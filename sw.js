
const CACHE_NAME = 'film-donusturucu-cache-v13';

const ASSETS = [
  './',
  './index.html',
  './app.js?v=13',
  './style.css',
  './manifest.webmanifest',
  './icon.svg',
  './worker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);

    if (cached) return cached;

    try {
      const response = await fetch(event.request);

      if (response.ok) {
        await cache.put(event.request, response.clone());
      }

      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        return await cache.match('./index.html') || Response.error();
      }

      return Response.error();
    }
  })());
});
