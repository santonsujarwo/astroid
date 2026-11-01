import type { APIRoute } from 'astro';

const backend = () => ({
  url: (import.meta.env.ASTROID_API_URL || 'http://localhost:8787').replace(/\/$/, ''),
  key: import.meta.env.ASTROID_API_KEY
});
const forward = async (path: string, method = 'GET', body?: unknown) => {
  const config = backend();
  if (!config.key) return new Response(JSON.stringify({error:'Astroid API is not connected. Configure ASTROID_API_URL and ASTROID_API_KEY on the dashboard server.'}),{status:503,headers:{'content-type':'application/json'}});
  const response = await fetch(config.url + path, {
    method,
    headers: {'x-astroid-key':config.key,'content-type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return new Response(await response.text(),{status:response.status,headers:{'content-type':response.headers.get('content-type') || 'application/json'}});
};
export const GET: APIRoute = async () => forward('/api/sites');
export const POST: APIRoute = async ({request}) => forward('/api/sites','POST',await request.json());
