import type { APIRoute } from 'astro';

const forward = async (method = 'GET', body?: unknown) => {
  const url = (import.meta.env.ASTROID_API_URL || 'http://localhost:8787').replace(/\/$/, '');
  const key = import.meta.env.ASTROID_API_KEY;
  if (!key) return new Response(JSON.stringify({error:'Astroid API is not connected.'}),{status:503,headers:{'content-type':'application/json'}});
  const response = await fetch(url+'/api/templates',{method,headers:{'x-astroid-key':key,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return new Response(await response.text(),{status:response.status,headers:{'content-type':response.headers.get('content-type') || 'application/json'}});
};
export const GET: APIRoute = async () => forward();
export const POST: APIRoute = async ({request}) => forward('POST',await request.json());
