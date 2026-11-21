/* Kan Tahlili — Service Worker
   Yeni sürüm yayınladığınızda VERSION değerini artırın. */
const VERSION = "kt-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "js/app.js",
  "js/tests.js",
  "js/jsQR.js",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // YouTube vb. dış kaynaklar
  if (req.headers.has("range") || /\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return; // videolar doğrudan ağdan

  // Sayfa açılışı: önce ağ (güncel içerik), yoksa önbellek (çevrimdışı)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./").then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // tests.js (video linkleri burada): önce ağ, böylece yeni linkler hemen görünür
  if (url.pathname.endsWith("/js/tests.js")) {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Diğer dosyalar: önce önbellek, arkada güncelle
  event.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
