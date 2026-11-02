// Service worker: guarda la interfaz en caché para abrir la app con mala señal.
// Las llamadas a /api nunca se guardan en caché.
const CACHE = 'agroriego-v1';

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icono.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.pathname.startsWith('/api')) return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request).then((r) => r ?? caches.match('/'))),
  );
});
