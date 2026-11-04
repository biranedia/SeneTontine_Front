// Service worker SèneTontine : rend l'app installable et utilisable hors connexion.
// Réseau d'abord pour TOUT : chaque appareil reçoit la dernière version dès qu'elle est en ligne
// (avant, un ancien fichier en cache pouvait rester affiché après une mise à jour).
// Les données (API) ne sont JAMAIS mises en cache.
const CACHE = 'senetontine-v3';
const SHELL = ['/', '/accueil', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('/accueil') : undefined))),
  );
});
