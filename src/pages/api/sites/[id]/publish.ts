import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({params}) => {
  const url = (import.meta.env.ASTROID_API_URL || 'http://localhost:8787').replace(/\/$/, '');
  const key = import.meta.env.ASTROID_API_KEY;
  if (!key) return new Response(JSON.stringify({error:'Astroid API is not connected. Configure ASTROID_API_URL and ASTROID_API_KEY on the dashboard server.'}),{status:503,headers:{'content-type':'application/json'}});
  const response = await fetch(url+'/api/sites/'+encodeURIComponent(params.id || '')+'/publish',{method:'POST',headers:{'x-astroid-key':key}});
  return new Response(await response.text(),{status:response.status,headers:{'content-type':response.headers.get('content-type') || 'application/json'}});
};
