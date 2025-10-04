// Service Worker for offline support
const CACHE_NAME = 'math-games-v1';
const urlsToCache = [
  '/math-games/index.html',
  '/math-games/number-order-v2.html',
  '/math-games/neighbor-numbers-v2.html',
  '/math-games/make-ten-v2.html',
  '/math-games/learning-system.js'
];

// Install service worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
