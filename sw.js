// ChronoSport — service worker : fonctionnement hors connexion.
// Stratégie « stale-while-revalidate » : réponse immédiate depuis le cache,
// mise à jour en arrière-plan (la nouvelle version s'affiche au lancement suivant).
// Incrémenter CACHE quand la liste PRECACHE change.
'use strict';

const CACHE = 'chronosport-v1';
const PRECACHE = [
  './',
  './index.html',
  './4fantastiques.html',
  './mentions-legales.html',
  './404.html',
  './manifest.webmanifest',
  './favicon.ico',
  './assets/style.css',
  './assets/vendor/bootstrap.min.css',
  './assets/chrono.js',
  './assets/index.js',
  './assets/4fantastiques.js',
  './assets/pwa.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    // `no-cache` : revalide auprès du serveur malgré le cache HTTP de GitHub Pages (10 min).
    const network = fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
