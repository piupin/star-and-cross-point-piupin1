const CACHE_NAME = 'stars-cache-v4';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install & cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate & clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n)=>n!==CACHE_NAME).map((n)=>caches.delete(n)))
    )
  );
  self.clients.claim();
});

// SPA-style navigate fallback + cache-first for assets
self.addEventListener('fetch', (event) => {
  // Always serve index.html for navigation (fixes GitHub Pages 404 from PWA icon)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => cached || fetch('./index.html'))
    );
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        // Cache fetched assets (ignore opaque errors)
        try {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache)=>cache.put(event.request, copy));
        } catch {}
        return resp;
      }).catch(() => cached);
    })
  );
});
