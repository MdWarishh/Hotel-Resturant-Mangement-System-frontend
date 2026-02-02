'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  connectPOSSocket,
  disconnectPOSSocket,
  getPOSSocket,
} from '@/services/posSocket';
import { ChefHat, Clock, CheckCircle, Loader2, Utensils } from 'lucide-react';

/**
 * Kitchen Screen (Real-time)
 * - Live orders via sockets
 * - No polling
 */
export default function KitchenPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  /**
   * Initial fetch (fallback / first load)
   */
  const fetchOrders = async () => {
    try {
      const res = await apiRequest('/pos/orders/kitchen');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch kitchen orders');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update order status
   */
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      await apiRequest(`/pos/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      // No manual fetch – socket will update UI
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 🔌 SOCKET CONNECT
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) return;

    const socket = connectPOSSocket(token);

    // New order
    socket.on('order:created', (order) => {
      setOrders((prev) => {
        // avoid duplicates
        if (prev.find((o) => o._id === order._id)) {
          return prev;
        }
        return [order, ...prev];
      });
    });

    // Order updated
    socket.on('order:updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    });

    return () => {
      socket.off('order:created');
      socket.off('order:updated');
      disconnectPOSSocket();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10">
          <ChefHat className="h-5 w-5 text-[rgb(0,173,181)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(34,40,49)]">
            Kitchen Orders (Live)
          </h1>
          <p className="text-sm text-[rgb(57,62,70)]">
            Real-time order management
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-12 text-center shadow-lg">
          <Utensils className="mb-4 h-12 w-12 text-[rgb(57,62,70)]/30" />
          <p className="text-sm text-[rgb(57,62,70)]">No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const isUpdating = updatingId === order._id;
            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 p-4">
                  <div>
                    <p className="font-semibold text-[rgb(34,40,49)]">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-sm text-[rgb(57,62,70)]">
                      {order.orderType === 'dine-in'
                        ? `Table ${order.tableNumber}`
                        : order.orderType}
                    </p>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div className="p-4">
                  <ul className="mb-4 space-y-2">
                    {order.items.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-start gap-2 text-sm text-[rgb(34,40,49)]"
                      >
                        <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgb(0,173,181)]/10 text-xs font-semibold text-[rgb(0,173,181)]">
                          {item.quantity}
                        </span>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.variant && (
                            <span className="ml-1 text-xs text-[rgb(57,62,70)]">
                              ({item.variant})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateStatus(order._id, 'PREPARING')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Start Preparing
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateStatus(order._id, 'READY')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Mark Ready
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ status }) {
  const styles = {
    PENDING:
      'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    PREPARING:
      'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    READY:
      'bg-[rgb(0,173,181)]/20 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/40',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}