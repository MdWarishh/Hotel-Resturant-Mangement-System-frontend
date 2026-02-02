'use client';

import { useEffect, useState } from 'react';
import {apiRequest} from '@/services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
  try {
    setLoading(true);

    const res = await apiRequest('/reports/revenue?groupBy=day');

    // 🔥 UNIVERSAL SAFE EXTRACTOR
    const chart =
      res?.data?.chart ||
      res?.data?.data?.chart ||
      res?.chart ||
      [];

    const chartData = Array.isArray(chart)
      ? chart.map((item) => ({
          date: item._id || item.date || 'N/A',
          revenue: item.total || item.amount || 0,
        }))
      : [];

    setData(chartData);
  } catch (err) {
    console.error('Revenue chart error:', err);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
        Loading revenue chart…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
        No revenue data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-gray-700">
        Revenue Trend (Daily)
      </h2>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}