// Cupid Rounds — Live Over-The-Air (OTA) Instant Auto-Update Service Worker
const CACHE_NAME = 'cupid-rounds-live-v4';

self.addEventListener('install', (event) => {
  // Immediately take over without waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache for instant live update:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First Strategy for all HTML/JS/CSS assets:
// Always fetch fresh code directly from Vercel server. Fallback to cache ONLY if completely offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to offline cache if network is unavailable
        return caches.match(event.request);
      })
  );
});

// Broadcast update message to connected client apps
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
