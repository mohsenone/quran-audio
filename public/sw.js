// PWA shell: offline app cache + runtime caching for API GETs and audio.
const CACHE = "quran-audio-v1";
const SHELL = ["/", "/quran", "/search", "/bookmarks", "/reciters", "/downloads", "/settings", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // cross-origin audio + fonts: cache-first
  if (url.origin !== location.origin) {
    if (url.hostname === "verses.quran.com" || url.hostname === "cdn.islamic.network") {
      e.respondWith(
        caches.open(CACHE).then(async (c) => {
          const hit = await c.match(e.request);
          if (hit) return hit;
          const res = await fetch(e.request);
          if (res.ok) c.put(e.request, res.clone());
          return res;
        })
      );
    }
    return;
  }

  // our API: network-first, fall back to cache offline
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // app shell/pages: network-first, cache fallback
  if (e.request.mode === "navigate" || url.pathname.startsWith("/_next/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r ?? caches.match("/")))
    );
  }
});
