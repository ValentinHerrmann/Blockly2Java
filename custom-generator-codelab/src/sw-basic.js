// Minimal service worker: offline fallback for app shell resources
const CACHE_NAME = 'b2j-sw-v1';
const RESOURCES = [
  '/',
  '/index.html',
  '/assets/B2J.svg',
  '/assets/B2J_flat.svg',
  '/assets/B2J_flat_bright.svg',
  '/bundle.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(RESOURCES)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (k !== CACHE_NAME) return caches.delete(k);
      return null;
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((r) => r || fetch(event.request)).catch(() => fetch(event.request))
  );
});
