// Cupid Rounds — Live Over-The-Air (OTA) Instant Auto-Update Service Worker
const CACHE_NAME = 'cupid-rounds-live-v11';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
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

// Network-First Strategy with Cache Bypassing
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
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
        return caches.match(event.request);
      })
  );
});

// ── NATIVE DEVICE PUSH & STATUS BAR NOTIFICATION HANDLERS ─────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Cupid Rounds Alert', body: 'You have a new live round update in Cupid Rounds!' };
  if (event.data) {
    try { 
      data = event.data.json(); 
    } catch(e) { 
      data.body = event.data.text(); 
    }
  }

  const options = {
    body: data.body || data.message || 'Check Cupid Rounds app for new updates.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    tag: `cupid_push_${Date.now()}`
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Cupid Rounds', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
