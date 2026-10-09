const CACHE_PREFIX = 'poza-szumem-';
const CACHE_NAME = CACHE_PREFIX + '366f150c9f38';
const ARTICLE_CACHE = CACHE_PREFIX + 'articles-v1';
const ROOT = new URL('./', self.location.href);
const CORE = ['./', 'index.html', 'styles.css?v=366f150c9f38', 'script.js?v=366f150c9f38',
  'manifest.webmanifest', 'icon.svg', 'icon-192.svg', 'icon-512.svg', 'assets/lucide.min.js', 'assets/icon-192.png', 'assets/icon-512.png'].map(path => new URL(path, ROOT).href);

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
    const article = new URL(typeof request === 'string' ? request : request.url, ROOT).pathname.startsWith(new URL('artykuly/', ROOT).pathname);
    const cache = await caches.open(article ? ARTICLE_CACHE : CACHE_NAME);
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
    const articles = await caches.open(ARTICLE_CACHE);
    for (const key of keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME && key !== ARTICLE_CACHE)) {
      const old = await caches.open(key);
      for (const request of await old.keys()) {
        if (new URL(request.url).pathname.startsWith(new URL('artykuly/', ROOT).pathname) && !(await articles.match(request))) {
          const response = await old.match(request);
          if (response) await articles.put(request, response);
        }
      }
    }
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME && key !== ARTICLE_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  event.respondWith((async () => {
    const article = url.pathname.startsWith(new URL('artykuly/', ROOT).pathname);
    const cache = await caches.open(article ? ARTICLE_CACHE : CACHE_NAME);
    const offlineResponse = async saved => {
      if (!article) return saved;
      const html = (await saved.text())
        .replace(/(script\.js|styles\.css)\?v=[a-z0-9]+/g, '$1?v=' + CACHE_NAME.slice(CACHE_PREFIX.length))
        .replace(/assets\/lucide\.min\.js(?:\?v=[a-z0-9]+)?/g, 'assets/lucide.min.js?v=' + CACHE_NAME.slice(CACHE_PREFIX.length));
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    };
    if (request.mode === 'navigate') {
      try {
        const response = await timedFetch(request);
        if (response.ok) {
          await remember(request, response);
          return response;
        }
        // Preserve real 404s; an unavailable server can use an exact saved page.
        if (response.status >= 500) {
          const saved = await cache.match(request);
          if (saved) return await offlineResponse(saved);
        }
        return response;
      } catch (_) {
        const saved = await cache.match(request);
        if (saved) return await offlineResponse(saved);
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
    const saved = await cache.match(request, { ignoreSearch: url.pathname === new URL('icon.svg', ROOT).pathname });
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

self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_ARTICLE' || typeof event.data.url !== 'string') return;
  let url;
  try { url = new URL(event.data.url); } catch (_) { return; }
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(new URL('artykuly/', ROOT).pathname) || !url.pathname.endsWith('.html')) return;
  url.hash = '';
  event.waitUntil(timedFetch(url.href).then(response => remember(url.href, response)).catch(() => {}));
});
