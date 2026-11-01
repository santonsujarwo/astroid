import 'dotenv/config';
import Fastify from 'fastify';
import pg from 'pg';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { generateAstroProject, type PageDocument } from './generator.js';

const { Pool } = pg;
const app = Fastify({ logger: true, bodyLimit: 2_000_000 });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});
const apiKey = process.env.ASTROID_API_KEY;
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const sectionSchema = z.object({
  type:z.string().min(1), label:z.string().min(1), eyebrow:z.string().optional(),
  heading:z.string().optional(), body:z.string().optional(), image:z.string().optional(),
  button:z.string().optional(), link:z.string().optional(),
  layout:z.enum(['standard','split','centered','cards']).optional()
});
const documentSchema = z.object({ version:z.number().default(1), sections:z.array(sectionSchema) });
const siteSchema = z.object({ name:z.string().min(1), domain:z.string().optional(), description:z.string().optional(), templateId:z.string().optional(), page:documentSchema.optional() });

app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health') return;
  if (!apiKey) return reply.code(503).send({ error:'API is not configured: ASTROID_API_KEY is missing' });
  if (request.headers['x-astroid-key'] !== apiKey) return reply.code(401).send({ error:'Unauthorized' });
});

app.get('/health', async () => ({ ok:true, service:'astroid-api', database: await pool.query('SELECT 1').then(()=> 'connected').catch(()=> 'unavailable') }));

app.get('/api/sites', async () => {
  const { rows } = await pool.query('SELECT s.*, p.id AS page_id, p.document, p.revision FROM sites s LEFT JOIN pages p ON p.site_id=s.id AND p.slug=\'/\' ORDER BY s.created_at DESC');
  return { sites: rows };
});

app.post('/api/sites', async (request, reply) => {
  const input = siteSchema.parse(request.body);
  const slug = slugify(input.name) || 'new-site';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows:[site] } = await client.query(
      'INSERT INTO sites(name,slug,domain,description,template_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [input.name, slug + '-' + Date.now().toString(36), input.domain || null, input.description || '', input.templateId || 'business-starter']
    );
    const doc = input.page || {version:1,sections:[
      {type:'hero',label:'Hero',heading:'Welcome to '+input.name,body:'Tell visitors what makes your business different.',layout:'split'},
      {type:'about',label:'About us',heading:'About '+input.name,body:'Introduce your business.',layout:'standard'},
      {type:'services',label:'Services',heading:'What we do',body:'Describe your services.',layout:'cards'},
      {type:'contact',label:'Contact',heading:'Get in touch',body:'Invite visitors to contact you.',layout:'centered'}
    ]};
    await client.query('INSERT INTO pages(site_id,slug,title,document) VALUES($1,\'/\',\'Home\',$2)',[site.id,JSON.stringify(doc)]);
    await client.query('INSERT INTO activity_log(site_id,action,detail) VALUES($1,\'site.created\',$2)',[site.id,JSON.stringify({name:site.name})]);
    await client.query('COMMIT');
    return reply.code(201).send({site,page:doc});
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

app.get('/api/sites/:id', async (request, reply) => {
  const { id } = request.params as {id:string};
  const { rows } = await pool.query('SELECT s.*,p.document,p.revision,p.title AS page_title FROM sites s LEFT JOIN pages p ON p.site_id=s.id AND p.slug=\'/\' WHERE s.id=$1',[id]);
  if (!rows[0]) return reply.code(404).send({error:'Site not found'});
  return rows[0];
});

app.put('/api/sites/:id', async (request, reply) => {
  const { id } = request.params as {id:string};
  const input = siteSchema.parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows:[site] } = await client.query('UPDATE sites SET name=$2,domain=$3,description=$4,updated_at=now(),status=\'draft\' WHERE id=$1 RETURNING *',[id,input.name,input.domain || null,input.description || '']);
    if (!site) { await client.query('ROLLBACK'); return reply.code(404).send({error:'Site not found'}); }
    if (input.page) await client.query('UPDATE pages SET document=$2,revision=revision+1,updated_at=now() WHERE site_id=$1 AND slug=\'/\'',[id,JSON.stringify(input.page)]);
    await client.query('INSERT INTO activity_log(site_id,action,detail) VALUES($1,\'site.updated\',$2)',[id,JSON.stringify({name:site.name})]);
    await client.query('COMMIT');
    return {site};
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

app.post('/api/sites/:id/publish', async (request, reply) => {
  const { id } = request.params as {id:string};
  const token = process.env.ASTROID_GITHUB_TOKEN;
  if (!token) return reply.code(503).send({error:'GitHub publishing is not configured. Set ASTROID_GITHUB_TOKEN on the API server.'});
  const { rows } = await pool.query('SELECT s.*,p.document FROM sites s JOIN pages p ON p.site_id=s.id AND p.slug=\'/\' WHERE s.id=$1',[id]);
  const site = rows[0];
  if (!site) return reply.code(404).send({error:'Site not found'});
  const doc = documentSchema.parse(site.document) as PageDocument;
  const octokit = new Octokit({auth:token});
  const owner = (await octokit.users.getAuthenticated()).data.login;
  const repoName = site.github_repo || slugify(site.name) + '-' + site.id.slice(0,8);
  let repo;
  try {
    repo = (await octokit.repos.get({owner,repo:repoName})).data;
  } catch {
    repo = (await octokit.repos.createForAuthenticatedUser({name:repoName,description:'Static website generated by Astroid',private:false,auto_init:true})).data;
  }
  const base = (await octokit.git.getRef({owner,repo:repoName,ref:'heads/'+repo.default_branch})).data.object.sha;
  const baseTree = (await octokit.git.getCommit({owner,repo:repoName,commit_sha:base})).data.tree.sha;
  const files = generateAstroProject(site,doc);
  const tree = await octokit.git.createTree({owner,repo:repoName,base_tree:baseTree,tree:await Promise.all(Object.entries(files).map(async ([path,content])=>({
    path,mode:'100644' as const,type:'blob' as const,content
  })))});
  const commit = await octokit.git.createCommit({owner,repo:repoName,message:'Publish website from Astroid',tree:tree.data.sha,parents:[base]});
  await octokit.git.updateRef({owner,repo:repoName,ref:'heads/'+repo.default_branch,sha:commit.data.sha});
  await pool.query('UPDATE sites SET status=\'published\',github_owner=$2,github_repo=$3,github_url=$4,published_commit=$5,updated_at=now() WHERE id=$1',[id,owner,repoName,repo.html_url,commit.data.sha]);
  await pool.query('INSERT INTO activity_log(site_id,action,detail) VALUES($1,\'site.published\',$2)',[id,JSON.stringify({repository:repo.html_url,commit:commit.data.sha})]);
  return {ok:true,repository:repo.html_url,commit:commit.data.sha,buildWorkflow:'Add a GitHub Actions Astro deployment workflow to connect a hosting provider.'};
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  if (error instanceof z.ZodError) return reply.code(400).send({error:'Invalid request',details:error.flatten()});
  return reply.code(500).send({error:'Internal server error'});
});

const port = Number(process.env.API_PORT || 8787);
if (!process.env.DATABASE_URL) app.log.warn('DATABASE_URL is missing. API routes will not be usable until configured.');
app.listen({port,host:'0.0.0.0'}).catch(error=>{app.log.error(error);process.exit(1)});
