// Çevrimdışı çalışma için basit önbellek.
// Sürüm numarasını değiştirmek eski önbelleği temizler.

const CACHE = 'abo-v1';

const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'config.js',
  'manifest.webmanifest',
  'js/app.js',
  'js/model.js',
  'js/store.js',
  'js/sync.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
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
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Supabase çağrıları hiçbir zaman önbelleğe alınmaz.
  if (url.origin !== self.location.origin) return;

  // Uygulama kabuğu: önce ağ, olmazsa önbellek (güncel kalsın, çevrimdışı da açılsın).
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('index.html')))
  );
});
