'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { Loader2 } from 'lucide-react';

const RUNNING_STATUSES = ['pending', 'preparing', 'ready', 'served'];

export default function RunningOrders({ onCheckout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // IMPORTANT: apiRequest already unwraps .data
    const res = await apiRequest('/pos/orders/running');
setOrders(res?.orders || []);

      console.log(
        'ALL ORDERS (RAW):',
        allOrders.map((o) => o.status)
      );

      const runningOrders = allOrders.filter((o) =>
        RUNNING_STATUSES.includes(o.status?.toLowerCase())
      );

      console.log(
        'RUNNING ORDERS:',
        runningOrders.map((o) => o.status)
      );

      setOrders(runningOrders);
    } catch (err) {
      console.error('Failed to load running orders', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[rgb(0,173,181)]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-500">
        No running orders
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order._id}
          className="rounded-lg border bg-white p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium">
                #{order.orderNumber}
              </p>
              <p className="text-xs text-gray-500">
                {order.orderType}
              </p>
            </div>

            <span className="rounded border px-2 py-1 text-xs">
              {order.status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              ₹{order.pricing?.total}
            </p>

            {order.status?.toLowerCase() === 'served' && (
              <button
                onClick={() => onCheckout(order)}
                className="rounded bg-black px-3 py-1.5 text-xs text-white"
              >
                Checkout
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}