'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import {
  connectPOSSocket,
  disconnectPOSSocket,
} from '@/services/posSocket';


export default function POSOrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  /* ---------- SECURITY ---------- */
  if (
    !user ||
    ![USER_ROLES.HOTEL_ADMIN, USER_ROLES.MANAGER].includes(user.role)
  ) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized
      </div>
    );
  }

  /* ---------- FETCH ORDERS ---------- */
  const fetchOrders = async () => {
  try {
    setLoading(true);

    const res = await apiRequest('/pos/orders');

    // ✅ paginatedResponse handling
    const ordersData = Array.isArray(res?.data)
      ? res.data
      : [];

    setOrders(ordersData);
  } catch (err) {
    console.error('Failed to fetch orders', err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  /* ---------- UPDATE STATUS ---------- */
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      await apiRequest(`/pos/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      await fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

useEffect(() => {
  fetchOrders(); // initial load (important)

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  if (!token) return;

  const socket = connectPOSSocket(token);

  // 🟢 NEW ORDER CREATED
  socket.on('order:created', (order) => {
    setOrders((prev) => {
      if (prev.find((o) => o._id === order._id)) return prev;
      return [order, ...prev];
    });
  });

  // 🟡 ORDER STATUS UPDATED
  socket.on('order:updated', (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === updatedOrder._id ? updatedOrder : o
      )
    );
  });

  return () => {
    socket.off('order:created');
    socket.off('order:updated');
    disconnectPOSSocket();
  };
}, []);

  /* ---------- FILTER ---------- */
const visibleOrders =
  filter === 'ALL'
    ? orders
    : orders.filter(
        (o) =>
          o.status &&
          o.status.toUpperCase() === filter
      );

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading orders…
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-xl font-semibold mb-6">
        POS Orders
      </h1>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'PREPARING', 'READY', 'SERVED'].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 border rounded text-sm ${
                filter === s
                  ? 'bg-black text-white'
                  : 'bg-white'
              }`}
            >
              {s}
            </button>
          )
        )}
      </div>

      {visibleOrders.length === 0 ? (
        <p className="text-sm text-gray-500">
          No orders found
        </p>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div
              key={order._id}
              className="border rounded p-4 bg-white"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-medium">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.orderType === 'dine-in'
                      ? `Table ${order.tableNumber}`
                      : order.orderType}
                  </p>
                </div>

                <span className="text-xs px-2 py-1 border rounded">
                  {order.status.toUpperCase()}
                </span>
              </div>

              <ul className="text-sm mb-3">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>

            {order.status === 'READY' && (
  <button
    disabled={updatingId === order._id}
    onClick={() => updateStatus(order._id, 'SERVED')}
    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
  >
    Mark Served
  </button>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}