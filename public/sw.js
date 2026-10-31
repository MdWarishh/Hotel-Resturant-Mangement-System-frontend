self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Push aane par notification dikhao ──
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '🆕 New Order!', body: 'Ek naya order aaya hai' };
  }

  const title = data.title || '🆕 New Order!';
  const options = {
    body: data.body || 'Nayi order notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || `order-${Date.now()}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'view', title: '👀 Order Dekho' },
      { action: 'dismiss', title: '✖ Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Click handler ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ── Subscription expire hone par ──
self.addEventListener('pushsubscriptionchange', () => {
  console.log('[SW] Subscription changed — user ko Settings se dobara enable karna padega');
});