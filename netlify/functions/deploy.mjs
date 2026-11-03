// GET / .netlify/functions/deploy?key=... -> triggers the Netlify build hook.
// The key stops crawlers and prefetchers from starting builds.
const KEY = 'td9x4k2m7q';
const HOOK = 'https://api.netlify.com/build_hooks/6aea1cdea3e19e42feaa2109';

export default async (request) => {
  const url = new URL(request.url);
  if (url.searchParams.get('key') !== KEY) {
    return new Response('Not found', { status: 404 });
  }

  const res = await fetch(HOOK, { method: 'POST' });
  const ok = res.ok;
  return new Response(
    ok ? 'Deploy triggered. The site will rebuild in about a minute.' : `Deploy failed (${res.status}).`,
    { status: ok ? 200 : 502, headers: { 'content-type': 'text/plain; charset=utf-8' } }
  );
};

export const config = { path: '/deploy' };
