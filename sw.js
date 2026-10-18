/*
 * Mi semana — service worker.
 * Guarda la app en el iPad para que abra sin conexión. Sirve lo que tiene
 * guardado y, por detrás, se trae la versión nueva para la próxima vez.
 * Sube CACHE cuando cambie la lista de ficheros.
 */
var CACHE = 'mi-semana-v2';
var FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './fonts/nunito-600.woff',
  './fonts/nunito-800.woff',
  './icons/icon-180.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(request, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(request).then(function (response) {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(function () { return cached; });
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
      });
    })
  );
});
