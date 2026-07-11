const CACHE = "chainbound-belfry-v1.2.0";
const SHELL = ["/chainbound-flooded-belfry-demo/", "/chainbound-flooded-belfry-demo/manifest.webmanifest", "/chainbound-flooded-belfry-demo/icons/chainbound-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const copy = response.clone();
          const cache = await caches.open(CACHE);
          await cache.put("/chainbound-flooded-belfry-demo/", copy);
          return response;
        })
        .catch(() => caches.match("/chainbound-flooded-belfry-demo/")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request).then(async (response) => {
      if (response.ok && /\.(?:js|css|woff2?|png|webp|svg)$/.test(url.pathname)) {
        const copy = response.clone();
        const cache = await caches.open(CACHE);
        await cache.put(event.request, copy);
      }
      return response;
    })),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
