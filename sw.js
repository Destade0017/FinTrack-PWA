const CACHE_NAME = 'fintrack-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/utilities.css',
  '/css/animations.css',
  '/js/store.js',
  '/js/ui.js',
  '/js/charts.js',
  '/js/app.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
                // Ignore API/external requests from caching statically
                if (event.request.url.startsWith(self.location.origin)) {
                    cache.put(event.request, fetchResponse.clone());
                }
                return fetchResponse;
            });
        });
      })
  );
});
