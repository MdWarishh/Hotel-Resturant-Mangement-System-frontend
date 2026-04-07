// frontend/public/sw.js
// Service Worker — background mein push notifications handle karta hai

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Immediately activate — purana SW wait na kare
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated!');
  event.waitUntil(clients.claim()); // Existing pages ko bhi control karo
});

// ── 🔔 Push event — notification dikhao ──
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received!', event);

  let data = {};

  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = {
      title: '🆕 New Order!',
      body: 'Ek naya order aaya hai',
    };
  }

  const title = data.title || '🆕 New Order!';
  const options = {
    body: data.body || 'Nayi order notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || 'order-' + Date.now(),
    requireInteraction: true,  // Notification tab tak rahe jab tak dismiss na karo
    vibrate: [200, 100, 200],  // Mobile pe vibrate
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: '👀 Order Dekho',
      },
      {
        action: 'dismiss',
        title: '✖ Dismiss',
      },
    ],
  };

  console.log('[SW] Showing notification:', title, options.body);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Click handler — notification pe click karo ──
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') return;

  // Staff click kare toh POS orders page open ho
  const urlToOpen = event.notification.data?.url || '/pos/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Agar POS tab already open hai toh focus karo
      for (const client of windowClients) {
        if (client.url.includes('/pos') && 'focus' in client) {
          client.focus();
          return;
        }
      }
      // Nahi toh naya tab open karo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Push subscription change ──
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed — re-subscribing...');
  // Ye tab hota hai jab browser subscription expire kar de
  // Yahan resubscribe logic add kar sakte ho baad mein
});