// PWA Service Worker for ইসমা গুড়া মসলা প্রাইভেট লিমিটেড
// Caches the app shell so it loads instantly and works offline (UI only).
// Data operations still require internet (syncs to Supabase cloud).

const CACHE_NAME = "isma-mosla-v1";
const APP_SHELL = [
  "/",
  "/logo.svg",
  "/logo.png",
  "/manifest.json",
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API requests (/api/*): always network (data must be fresh from Supabase)
// - Navigation/page requests: network first, fallback to cache (offline support)
// - Static assets: cache first (fast loading)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // API requests: always network, don't cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests: network first, fall back to cached app shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/").then((r) => r || caches.match(event.request)))
    );
    return;
  }

  // Static assets: cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
    )
  );
});
