// Service Worker for INCO Smart Shop PWA - Safari & WebKit Hardened
const CACHE_NAME = "inco-smartshop-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache assets individually so failure of one asset doesn't abort installation
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Non-blocking in dev or preview environments
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Clearing stale cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never intercept non-GET, API endpoints, or Vite development internal paths
  if (
    event.request.method !== "GET" ||
    url.includes("/api/") ||
    url.includes("/@vite") ||
    url.includes("/@fs") ||
    url.includes("/@id") ||
    url.includes("/src/") ||
    url.includes("?t=") ||
    url.includes("hot-update")
  ) {
    return;
  }

  // Network-First with safe fallback - guaranteed NEVER to return undefined (which breaks Safari)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone to cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline or connection lost), attempt cache
        try {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // For HTML navigation requests, return cached index.html
          if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
            const indexCached = await caches.match("/index.html");
            if (indexCached) return indexCached;
            const rootCached = await caches.match("/");
            if (rootCached) return rootCached;
          }
        } catch (err) {}

        // Fallback response so Safari NEVER throws WebKit undefined response error
        return new Response(
          "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>INCO Offline</title><style>body{background:#0b0f19;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center}button{background:#e8fe00;color:#000;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:16px}</style></head><body><div><h2>INCO Smart Shop is Offline</h2><p>Please check your network connection.</p><button onclick='location.reload()'>Tap to Retry</button></div></body></html>",
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      })
  );
});
