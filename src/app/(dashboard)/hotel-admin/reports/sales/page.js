'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * Sales Report (POS)
 * Operational sales insights
 */
export default function SalesReportPage() {
  const { user } = useAuth();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== USER_ROLES.HOTEL_ADMIN) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized
      </div>
    );
  }

  const fetchReport = async () => {
    if (!from || !to) return;

    try {
      setLoading(true);
      const res = await apiRequest(
        `/reports/sales?from=${from}&to=${to}`
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [from, to]);

  return (
    <div className="p-6 h-full">
      <h1 className="text-xl font-semibold mb-2">
        Sales Report (POS)
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Order volume, menu performance & customer behavior
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">
          Loading sales report…
        </p>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Total Orders
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalOrders}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Items Sold
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalItems}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Avg Order Value
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.avgOrderValue}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Cancelled Orders
              </p>
              <p className="text-xl font-semibold">
                {data.summary.cancelledOrders}
              </p>
            </div>
          </div>

          {/* Top Items */}
          <div className="border rounded p-4 mb-8">
            <h3 className="font-medium mb-3">
              Top Selling Items
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    Item
                  </th>
                  <th className="p-3 text-right">
                    Quantity
                  </th>
                  <th className="p-3 text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      {item.name}
                    </td>
                    <td className="p-3 text-right">
                      {item.qty}
                    </td>
                    <td className="p-3 text-right">
                      ₹{item.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Split */}
          <div className="border rounded p-4 mb-8">
            <h3 className="font-medium mb-3">
              Payment Mode Split
            </h3>

            <div className="space-y-2 text-sm">
              {Object.entries(data.paymentSplit).map(
                ([mode, value]) => (
                  <div
                    key={mode}
                    className="flex justify-between"
                  >
                    <span>{mode}</span>
                    <span>₹{value}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="border rounded p-4">
            <h3 className="font-medium mb-3">
              Peak Order Hours
            </h3>

            <ul className="text-sm space-y-1">
              {data.peakHours.map((h, idx) => (
                <li key={idx}>
                  {h.hour} — {h.orders} orders
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}