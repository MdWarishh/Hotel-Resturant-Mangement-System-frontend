'use client';

import { useState, useEffect } from 'react';
import { Loader2, Bell, BellOff, BellRing } from 'lucide-react';
import { getPushStatus, subscribePush, unsubscribePush } from '@/utils/pushHelpers';

export default function PushNotificationSection() {
  // 'idle' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'
  const [pushStatus, setPushStatus] = useState('idle');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  useEffect(() => {
    getPushStatus()
      .then(setPushStatus)
      .catch((err) => {
        console.error('Push status check error:', err);
        setPushStatus('unsubscribed');
      });
  }, []);

  const handleSubscribe = async () => {
    setPushLoading(true);
    setPushMsg('');
    try {
      await subscribePush();
      setPushStatus('subscribed');
      setPushMsg('✅ Notifications enabled! Ab order aane par notification milega.');
      setTimeout(() => setPushMsg(''), 5000);
    } catch (err) {
      console.error('Subscribe error:', err);
      if (err.message === 'PERMISSION_DENIED' || Notification.permission === 'denied') {
        setPushStatus('denied');
        setPushMsg('');
      } else {
        setPushMsg(`❌ ${err.message || 'Failed to enable notifications. Please try again.'}`);
      }
    } finally {
      setPushLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setPushLoading(true);
    setPushMsg('');
    try {
      await unsubscribePush();
      setPushStatus('unsubscribed');
      setPushMsg('Notifications disabled for this device.');
      setTimeout(() => setPushMsg(''), 4000);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setPushMsg('❌ Failed to disable. Try again.');
    } finally {
      setPushLoading(false);
    }
  };

  if (pushStatus === 'idle') {
    return (
      <div className="flex items-center gap-3 text-gray-400 text-sm py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking notification status...
      </div>
    );
  }

  if (pushStatus === 'unsupported') {
    return (
      <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-200">
        <BellOff className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">Browser Not Supported</p>
          <p className="text-sm text-amber-600 mt-1">
            Aapka browser push notifications support nahi karta. Chrome ya Edge use karo.
          </p>
        </div>
      </div>
    );
  }

  if (pushStatus === 'denied') {
    return (
      <div className="flex items-start gap-4 p-5 bg-red-50 rounded-2xl border border-red-200">
        <BellOff className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-red-800">Notifications Blocked</p>
          <p className="text-sm text-red-600 mt-1">
            Aapne notifications block ki hain. Browser settings mein jaake allow karo:
          </p>
          <p className="text-xs text-red-500 mt-2 font-mono bg-red-100 px-3 py-1 rounded-lg inline-block">
            Address bar ka 🔒 icon → Site settings → Notifications → Allow
          </p>
        </div>
      </div>
    );
  }

  if (pushStatus === 'subscribed') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 bg-teal-50 rounded-2xl border border-teal-200">
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-2.5 rounded-xl">
              <BellRing className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-teal-900">Notifications Active</p>
              <p className="text-sm text-teal-700 mt-0.5">
                Ye device receive karega — delivery, takeaway, room service, dine-in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <span className="text-xs font-semibold text-teal-600">LIVE</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={pushLoading}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {pushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          Disable for this device
        </button>

        {pushMsg && <p className="text-sm text-gray-600">{pushMsg}</p>}
      </div>
    );
  }

  // unsubscribed
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
        <BellOff className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-gray-700">Notifications OFF for this device</p>
          <p className="text-sm text-gray-500 mt-1">
            Enable karo taaki jab bhi koi order aaye, aapko notification mile —
            chahe browser band ho ya system idle ho.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pushLoading}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-sm transition-all disabled:opacity-50"
      >
        {pushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        {pushLoading ? 'Enabling...' : 'Enable Notifications for this Device'}
      </button>

      {pushMsg && (
        <p className={`text-sm font-medium ${pushMsg.startsWith('✅') ? 'text-teal-600' : 'text-red-500'}`}>
          {pushMsg}
        </p>
      )}

      <p className="text-xs text-gray-400">
        💡 Tip: Har us device par enable karo jahan aap orders dekhte ho (mobile + desktop dono)
      </p>
    </div>
  );
}