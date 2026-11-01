import type { APIRoute } from 'astro';

const forward = async (path: string, method = 'GET', body?: unknown) => {
  const url = (import.meta.env.ASTROID_API_URL || 'http://localhost:8787').replace(/\/$/, '');
  const key = import.meta.env.ASTROID_API_KEY;
  if (!key) return new Response(JSON.stringify({error:'Astroid API is not connected. Configure ASTROID_API_URL and ASTROID_API_KEY on the dashboard server.'}),{status:503,headers:{'content-type':'application/json'}});
  const response = await fetch(url + path,{method,headers:{'x-astroid-key':key,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return new Response(await response.text(),{status:response.status,headers:{'content-type':response.headers.get('content-type') || 'application/json'}});
};
export const GET: APIRoute = async ({params}) => forward('/api/sites/'+encodeURIComponent(params.id || ''));
export const PUT: APIRoute = async ({params,request}) => forward('/api/sites/'+encodeURIComponent(params.id || ''),'PUT',await request.json());
