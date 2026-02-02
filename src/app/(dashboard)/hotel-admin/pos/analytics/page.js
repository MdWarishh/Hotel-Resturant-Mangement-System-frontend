'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import {
  connectPOSSocket,
  disconnectPOSSocket,
} from '@/services/posSocket';

/**
 * POS Analytics Dashboard (Real-time)
 * - Auto-refresh on completed orders
 */
export default function POSAnalyticsPage() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Security gate
  if (
    !user ||
    ![USER_ROLES.HOTEL_ADMIN, USER_ROLES.MANAGER].includes(
      user.role
    )
  ) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized
      </div>
    );
  }

const fetchAnalytics = async () => {
  try {
    setLoading(true);

    const res = await apiRequest('/reports/sales?groupBy=day');

    const analyticsData = {
      totalSales: res?.data?.totals?.totalSales || 0,
      totalOrders: res?.data?.totals?.orderCount || 0,
      avgOrderValue: res?.data?.totals?.avgOrderValue || 0,
      paymentSplit: {}, // backend me abhi nahi hai
      topItems: res?.data?.topItems || [],
      peakHours: [], // backend me abhi nahi hai
    };

    setData(analyticsData);
  } catch (err) {
    console.error('Failed to load analytics', err);
    setData(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAnalytics();

    // 🔌 SOCKET CONNECT
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : null;

    if (!token) return;

    const socket = connectPOSSocket(token);

    // Refresh analytics only on completed orders
  socket.on('order:completed', () => {
  fetchAnalytics();
});

socket.on('order:updated', (order) => {
  if (order.status === 'COMPLETED') {
    fetchAnalytics();
  }
});

    return () => {
      socket.off('order:completed');
      disconnectPOSSocket();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading analytics…
      </div>
    );
  }

 if (!data || !data.paymentSplit) {
  return (
    <div className="p-6 text-sm text-gray-500">
      No analytics data available
    </div>
  );
}

  return (
    <div className="p-6 h-full">
      <h1 className="text-xl font-semibold mb-6">
        POS Analytics (Live)
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">
            Total Sales
          </p>
          <p className="text-xl font-semibold">
            ₹{data.totalSales}
          </p>
        </div>

        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>
          <p className="text-xl font-semibold">
            {data.totalOrders}
          </p>
        </div>

        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">
            Avg Order Value
          </p>
          <p className="text-xl font-semibold">
            ₹{data.avgOrderValue}
          </p>
        </div>
      </div>

      {/* Payment Split */}
      <div className="border rounded p-4 mb-8">
        <h3 className="font-medium mb-3">
          Payment Split
        </h3>

        <div className="space-y-2 text-sm">
          {Object.entries(data.paymentSplit).map(
            ([mode, amount]) => (
              <div
                key={mode}
                className="flex justify-between"
              >
                <span>{mode}</span>
                <span>₹{amount}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="border rounded p-4 mb-8">
        <h3 className="font-medium mb-3">
          Top Selling Items
        </h3>

        <ul className="text-sm space-y-1">
          {data.topItems.map((item, idx) => (
            <li key={idx}>
              {item.name} — {item.qty} orders
            </li>
          ))}
        </ul>
      </div>

      {/* Peak Hours */}
      <div className="border rounded p-4">
        <h3 className="font-medium mb-3">
          Peak Hours
        </h3>

        <ul className="text-sm space-y-1">
          {data.peakHours.map((h, idx) => (
            <li key={idx}>
              {h.hour} — {h.orders} orders
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}