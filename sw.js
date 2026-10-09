const CACHE_PREFIX = 'poza-szumem-';
const CACHE_NAME = CACHE_PREFIX + '20261009a';
const ROOT = new URL('./', self.location.href);
const CORE = ['./', 'index.html', 'styles.css?v=20261009a', 'script.js?v=20261009a',
  'manifest.webmanifest', 'icon.svg', 'icon-192.svg', 'icon-512.svg'].map(path => new URL(path, ROOT).href);

async function timedFetch(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function remember(request, response) {
  if (response?.ok && response.type !== 'opaque') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (request.mode === 'navigate') {
      try {
        const response = await timedFetch(request);
        if (response.ok) {
          event.waitUntil(remember(request, response));
          return response;
        }
        // Preserve real 404s; an unavailable server can use an exact saved page.
        if (response.status >= 500) {
          const saved = await cache.match(request);
          if (saved) return saved;
        }
        return response;
      } catch (_) {
        const saved = await cache.match(request);
        if (saved) return saved;
        const homePath = url.pathname === ROOT.pathname || url.pathname === new URL('index.html', ROOT).pathname;
        if (homePath) {
          const home = await cache.match(new URL('index.html', ROOT).href);
          if (home) return home;
        }
        return new Response('<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Poza Szumem</title><body><main><h1>Ten tekst nie jest jeszcze zapisany offline.</h1><p>Polacz sie z internetem i otworz go ponownie.</p><a href="' + ROOT.href + '">Wroc do biblioteki</a></main></body></html>', {
          status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }
    const saved = await cache.match(request);
    const update = timedFetch(request).then(async response => {
      await remember(request, response);
      return response;
    }).catch(() => null);
    if (saved) {
      event.waitUntil(update);
      return saved;
    }
    return (await update) || Response.error();
  })());
});
