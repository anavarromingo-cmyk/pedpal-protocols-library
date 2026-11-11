// Protocolos PEDPAL — service worker. Generado por pipeline/build.py a partir de sw.template.js
// (el nombre de caché cambia con cada build de datos → actualización automática).
const CACHE = "{{CACHE_NAME}}";
const CORE = [
  "./", "./index.html", "./pedpal.css", "./app.css", "./doc.css", "./app.js", "./search.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png",
  "./icon-512-maskable.png", "./apple-touch-icon.png", "./data/sinonimos.json"
];
const DATA = [
  {{DATA_ASSETS}}
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map((u) => new Request(u, { cache: "reload" }))).catch(() => {});
    // datos en segundo plano, sin bloquear la instalación si alguno falla
    await Promise.all(DATA.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación y version.json: red primero (para detectar nuevos protocolos), caché si no hay red
  if (req.mode === "navigate" || url.pathname.endsWith("/data/version.json")) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  // Resto (CSS/JS/datos/figuras): caché primero, actualizando en segundo plano
  event.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
