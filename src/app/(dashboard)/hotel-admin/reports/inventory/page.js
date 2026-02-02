'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * Inventory Report
 * Stock movement, consumption & valuation
 */
export default function InventoryReportPage() {
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
        `/reports/inventory?from=${from}&to=${to}`
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to load inventory report');
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
        Inventory Report
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Stock movement, consumption & closing valuation
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
          Loading inventory report…
        </p>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Total Items
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalItems}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Stock In
              </p>
              <p className="text-xl font-semibold">
                {data.summary.stockIn}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Stock Consumed
              </p>
              <p className="text-xl font-semibold">
                {data.summary.stockOut}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Closing Stock Value
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.closingValue}
              </p>
            </div>
          </div>

          {/* Item-wise Stock */}
          <div className="border rounded p-4 mb-8">
            <h3 className="font-medium mb-3">
              Item-wise Stock Movement
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    Item
                  </th>
                  <th className="p-3 text-right">
                    Opening
                  </th>
                  <th className="p-3 text-right">
                    In
                  </th>
                  <th className="p-3 text-right">
                    Out
                  </th>
                  <th className="p-3 text-right">
                    Closing
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      {item.name}
                    </td>
                    <td className="p-3 text-right">
                      {item.opening}
                    </td>
                    <td className="p-3 text-right">
                      {item.in}
                    </td>
                    <td className="p-3 text-right">
                      {item.out}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {item.closing}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Low Stock */}
            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">
                Low Stock Items
              </h3>
              <ul className="text-sm space-y-1">
                {data.lowStock.map((i, idx) => (
                  <li key={idx}>
                    {i.name} — {i.qty}
                  </li>
                ))}
              </ul>
            </div>

            {/* High Consumption */}
            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">
                High Consumption Items
              </h3>
              <ul className="text-sm space-y-1">
                {data.highConsumption.map((i, idx) => (
                  <li key={idx}>
                    {i.name} — {i.qty}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}