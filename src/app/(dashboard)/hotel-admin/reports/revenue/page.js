'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * Revenue Report
 * Hotel + Restaurant combined revenue
 */
export default function RevenueReportPage() {
  const { user } = useAuth();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');
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
        `/reports/revenue?from=${from}&to=${to}&groupBy=${groupBy}`
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [from, to, groupBy]);

  return (
    <div className="p-6 h-full">
      <h1 className="text-xl font-semibold mb-2">
        Revenue Report
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Combined room & restaurant revenue
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
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">
          Loading report…
        </p>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Total Revenue
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.totalRevenue}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Room Revenue
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.roomRevenue}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                POS Revenue
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.foodRevenue}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Tax Collected
              </p>
              <p className="text-xl font-semibold">
                ₹{data.summary.tax}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Period</th>
                  <th className="p-3 text-right">
                    Room
                  </th>
                  <th className="p-3 text-right">
                    POS
                  </th>
                  <th className="p-3 text-right">
                    Tax
                  </th>
                  <th className="p-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      {row.period}
                    </td>
                    <td className="p-3 text-right">
                      ₹{row.roomRevenue}
                    </td>
                    <td className="p-3 text-right">
                      ₹{row.foodRevenue}
                    </td>
                    <td className="p-3 text-right">
                      ₹{row.tax}
                    </td>
                    <td className="p-3 text-right font-medium">
                      ₹{row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}