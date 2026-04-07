// components/PushNotificationSetup.jsx
'use client';
import { useEffect, useState } from 'react';

export default function PushNotificationSetup() {
  const [status, setStatus] = useState('idle'); // idle | subscribed | denied

  useEffect(() => {
    // Service worker register karo
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;

      // Backend se VAPID public key lo
      const res = await fetch('/api/pos/push/vapid-public-key');
      const { publicKey } = await res.json();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Subscription backend mein save karo
      await fetch('/api/pos/push/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ subscription }),
      });

      setStatus('subscribed');
    } catch (err) {
      console.error(err);
      setStatus('denied');
    }
  };

  if (status === 'subscribed') {
    return <p className="text-green-600 text-sm">🔔 Notifications ON</p>;
  }

  return (
    <button
      onClick={subscribe}
      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
    >
      🔔 Enable Order Notifications
    </button>
  );
}