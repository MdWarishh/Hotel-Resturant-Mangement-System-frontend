'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { Loader2, Receipt } from 'lucide-react';

/**
 * Cashier Order History
 * - Read-only
 * - Completed / Served orders only
 */
export default function CashierOrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODAY');

const fetchOrders = async () => {
  try {
    setLoading(true);

    const res = await apiRequest('/pos/orders');

    const allOrders =
      res?.data?.data?.orders ||
      res?.data?.orders ||
      res?.data?.data ||
      [];

   const historyOrders = allOrders.filter((o) =>
  ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(o.status)
);

    setOrders(historyOrders);
  } catch (err) {
    console.error('Failed to load order history', err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};  

  useEffect(() => {
    fetchOrders();
  }, []);

  const isToday = (date) => {
    const d = new Date(date);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const visibleOrders =
    filter === 'TODAY'
      ? orders.filter((o) => isToday(o.createdAt))
      : orders;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="mb-6 text-xl font-semibold text-[rgb(34,40,49)]">
        Order History
      </h1>

      {/* FILTERS */}
      <div className="mb-6 flex gap-3">
        {['TODAY', 'ALL'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-sm border ${
              filter === f
                ? 'bg-black text-white'
                : 'bg-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 shadow">
          <Receipt className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500">
            No orders found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div
              key={order._id}
              className="rounded-lg border bg-white p-4"
            >
              <div className="mb-2 flex justify-between">
                <div>
                  <p className="font-medium">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.orderType}
                  </p>
                </div>

                <span className="text-xs rounded border px-2 py-1">
                  {order.status.toUpperCase()}
                </span>
              </div>

              <ul className="mb-2 text-sm">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>

              <p className="text-sm font-semibold text-right">
                Total: ₹{order.pricing?.total}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}