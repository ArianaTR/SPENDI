const CACHE_NAME = 'spendi-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/main.js',
  '/src/db.js',
  '/src/pages/login.js',
  '/src/pages/register.js',
  '/src/pages/dashboard.js',
  '/src/pages/presupuestos.js',
  '/src/pages/metas.js',
  '/src/pages/grupos.js',
  '/src/pages/gamificacion.js',
  '/src/pages/configuracion.js',
  '/src/components/nav.js',
  '/src/components/semaforo.js',
  '/src/components/grafico.js',
  '/src/assets/logo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});