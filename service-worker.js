const CACHE_PREFIX = "stars-cache-";
const CACHE_NAME = CACHE_PREFIX + Date.now();
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: remove old caches + refresh clients
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

  // Force refresh all tabs
  self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    });
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // 🔄 For Google Sheets: try network first, fallback to cache
  if (requestUrl.includes("docs.google.com/spreadsheets")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // fallback when offline
    );
    return;
  }

  // 📦 For everything else: cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      );
    })
  );
});
