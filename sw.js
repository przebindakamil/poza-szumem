const CACHE_NAME = 'poza-szumem-v1';
const ROOT = new URL('./', self.location.href);
const CORE = [
  new URL('./', ROOT).href,
  new URL('index.html', ROOT).href,
  new URL('styles.css?v=20261007g', ROOT).href,
  new URL('script.js?v=20261007g', ROOT).href,
  new URL('manifest.webmanifest', ROOT).href,
  new URL('icon.svg', ROOT).href
];

async function cacheArticlesFromIndex(response) {
  try {
    const html = await response.clone().text();
    const paths = [...html.matchAll(/href=["'](artykuly\/[^"']+\.html)["']/g)].map(match => match[1]);
    const unique = [...new Set(paths)];
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(unique.map(path => cache.add(new URL(path, ROOT).href)));
  } catch (_) {}
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    const indexResponse = await fetch(new URL('index.html', ROOT));
    if (indexResponse.ok) await cacheArticlesFromIndex(indexResponse);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
            cacheArticlesFromIndex(response);
          }
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match(new URL('index.html', ROOT).href));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const networkPromise = fetch(request).then(async response => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);

    return cached || (await networkPromise) || Response.error();
  })());
});
