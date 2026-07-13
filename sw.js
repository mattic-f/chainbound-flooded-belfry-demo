// BUMP THIS ON EVERY DEPLOY. The activate handler deletes every cache whose key
// !== CACHE, so a new CACHE name is the ONLY thing that evicts a returning
// player's stale app shell. Leave it unchanged and they keep the old index.html
// (and therefore the old asset hashes) forever, even though the new sw.js
// installed fine — which is exactly how a bad deploy stayed on screen after the
// server was already serving the fix.
const CACHE = "chainbound-belfry-v1.5.0";

// Resolve the app root from the worker's own location rather than assuming "/".
// On GitHub Pages the app is served from /chainbound-flooded-belfry-demo/, so a
// hard-coded "/" made every shell entry a 404 and the install event rejected.
const ROOT = new URL("./", self.location).pathname;
const SHELL = [ROOT, `${ROOT}manifest.webmanifest`, `${ROOT}icons/chainbound-mark.svg`];

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
          await cache.put(ROOT, copy);
          return response;
        })
        .catch(() => caches.match(ROOT)),
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
