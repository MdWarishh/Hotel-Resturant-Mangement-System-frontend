// components/kitchen/OrderTimer.jsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function OrderTimer({ order }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);

  // Max prep time calculate (all items ka max)
  const getMaxPrepTime = () => {
    if (!order?.items?.length) return 15 * 60; // default 15 min in seconds
    return Math.max(
      ...order.items.map(item => (item.menuItem?.preparationTime || 15) * 60)
    ); // seconds mein
  };

  useEffect(() => {
    if (order.status !== 'preparing') {
      setTimeLeft(null);
      setIsOverdue(false);
      return;
    }

    const prepTimeSeconds = getMaxPrepTime();
    const startTime = new Date(order.timestamps.preparing).getTime();
    const now = Date.now();

    const elapsed = Math.floor((now - startTime) / 1000);
    let remaining = prepTimeSeconds - elapsed;

    setTimeLeft(remaining > 0 ? remaining : 0);
    setIsOverdue(remaining <= 0);

    const interval = setInterval(() => {
      const newNow = Date.now();
      const newElapsed = Math.floor((newNow - startTime) / 1000);
      const newRemaining = prepTimeSeconds - newElapsed;

      setTimeLeft(newRemaining > 0 ? newRemaining : 0);
      setIsOverdue(newRemaining <= 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status, order.timestamps?.preparing, order.items]);

  if (order.status !== 'preparing' || timeLeft === null) {
    return null;
  }

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 text-sm font-medium mt-2 p-2 rounded-lg ${
      isOverdue ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    }`}>
      <Clock className="h-4 w-4" />
      <span>Time left: {formatTime(timeLeft)}</span>
      {isOverdue && (
        <>
          <AlertTriangle className="h-4 w-4 text-red-300" />
          <span className="text-red-300">Overdue!</span>
        </>
      )}
    </div>
  );
}