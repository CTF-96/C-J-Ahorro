/* Service worker mínimo: guarda la app para que abra rápido y sin internet.
   Los datos SIEMPRE se piden a la red (nunca se cachea el Apps Script). */

const CACHE = "ahorro-cj-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-64.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // Nunca cachear los datos ni las fuentes de Google
  if (url.includes("script.google.com") || url.includes("fonts.g")) return;
  if (e.request.method !== "GET") return;

  // La página: red primero, caché si no hay internet
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Resto de archivos: caché primero
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
