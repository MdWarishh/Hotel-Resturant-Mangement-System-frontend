'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function POSOrdersChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchOrdersTrend = async () => {
  try {
    setLoading(true);

    const res = await apiRequest('/reports/sales?groupBy=day');

    // 🔥 UNIVERSAL SAFE EXTRACTOR
    const chart =
      res?.data?.chart ||
      res?.data?.data?.chart ||
      res?.chart ||
      [];

    const chartData = Array.isArray(chart)
      ? chart.map((item) => ({
          date: item._id || item.date || 'N/A',
          orders: item.orderCount || item.orders || 0,
        }))
      : [];

    setData(chartData);
  } catch (err) {
    console.error('POS orders chart error:', err);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOrdersTrend();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
        Loading POS orders…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
        No POS order data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-gray-700">
        POS Orders Trend (Daily)
      </h2>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="orders"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}