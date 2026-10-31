import { apiRequest } from '@/services/api';

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

/**
 * Returns: 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'
 */
export const getPushStatus = async () => {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'unsubscribed';

  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'unsubscribed';
};

export const subscribePush = async () => {
  if (!isPushSupported()) throw new Error('Browser push notifications support nahi karta');

  // 1. Permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('PERMISSION_DENIED');

  // 2. Service worker register + active hone tak wait
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // 3. VAPID public key (backend se)
  const keyRes = await apiRequest('/pos/push/vapid-public-key');
  const publicKey = keyRes?.data?.publicKey || keyRes?.publicKey;
  if (!publicKey) throw new Error('Server se notification key nahi mili');

  // 4. Purani subscription hatao (alag VAPID key ka conflict avoid karne ke liye)
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  // 5. Naya subscribe
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // 6. Backend mein save
  await apiRequest('/pos/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  return subscription;
};

export const unsubscribePush = async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;

  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await apiRequest('/pos/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch (err) {
    console.warn('Backend unsubscribe failed:', err.message);
  }

  await subscription.unsubscribe();
};