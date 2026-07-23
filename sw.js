/* Service worker AZ-104 flashcards
   - Pages (navigations) : réseau d'abord, cache en secours → contenu toujours frais en ligne, dispo hors ligne.
   - Statique (icônes, manifest) : cache d'abord. */
const CACHE = "az104-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./revision.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(hit => hit || caches.match("./revision.html"))
        )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(res => {
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
