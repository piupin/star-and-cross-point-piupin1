// ✅ Service Worker for Stars & Naughty PWA
// Handles offline support + auto-updates

const CACHE_PREFIX = "stars-cache-";
const CACHE_NAME = CACHE_PREFIX + Date.now();

// List of core assets to cache (the "app shell")
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// 📥 INSTALL: Cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // Activate immediately
});

// 🧹 ACTIVATE: Remove old caches + claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();

  // 🔄 Force refresh so users always see the latest version
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.navigate(client.url);
    }
  });
});

// 🌍 FETCH: Network-first for Google Sheets, cache-first for everything else
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // Always fetch live data from Google Sheets (don’t cache it)
  if (requestUrl.includes("docs.google.com/spreadsheets")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    })
  );
});
