const CACHE_PREFIX = "stars-cache-v";
const CACHE_VERSION = 3; // 🔄 Increase this number when you update your app
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Install & cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // activate immediately
});

// Activate & clear old caches
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

  // 🔄 Force refresh all open clients with the new version
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.navigate(client.url);
    }
  });
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // Always fetch live data from Google Sheets
  if (requestUrl.includes("docs.google.com/spreadsheets")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
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
});    }
  });
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // Always fetch live data from Google Sheets
  if (requestUrl.includes("docs.google.com/spreadsheets")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
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
