const CACHE_NAME = 'stars-trial-cache-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => (n !== CACHE_NAME ? caches.delete(n) : null)))
    )
  );
  self.clients.claim();
});

// SPA-friendly: always serve index.html for navigations (prevents 404 on GH Pages)
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(resp => resp || fetch('./index.html'))
    );
    return;
  }

  // Cache-first for static files; network for others
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(netRes => {
        // Optionally cache fetched static assets
        const clone = netRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return netRes;
      }).catch(() => cached);
    })
  );
});
