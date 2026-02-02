'use client';

import { useEffect, useState } from 'react';
import {apiRequest} from '@/services/api';
import RevenueChart from '@/components/dashboard/RevenueChart';
import POSOrdersChart from '@/components/dashboard/POSOrdersChart';
// import {RevenueChart} from '@/components/dashboard/RevenueChart';

const StatCard = ({ title, value, subtitle }) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {subtitle && (
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    )}
  </div>
);

export default function HotelAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/reports/dashboard');

      // backend successResponse → res.data.stats
      setStats(res?.data?.stats || null);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-sm text-red-500">
        Failed to load dashboard data
      </div>
    );
  }

  const {
    rooms,
    bookings,
    revenue,
    orders,
    inventory,
  } = stats;

  return (
    <div className="p-6 space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Hotel Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of hotel operations today
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Rooms"
          value={rooms.total}
          subtitle={`Available: ${rooms.available}`}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${rooms.occupancyRate}%`}
          subtitle={`Occupied: ${rooms.occupied}`}
        />
        <StatCard
          title="Today Revenue"
          value={`₹${revenue.today}`}
          subtitle="Room + POS"
        />
        <StatCard
          title="Today POS Orders"
          value={orders.today}
          subtitle={`Preparing: ${orders.preparing}`}
        />
      </div>

   

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Bookings"
          value={bookings.active}
          subtitle={`Check-ins today: ${bookings.checkInsToday}`}
        />
        <StatCard
          title="Check-outs Today"
          value={bookings.checkOutsToday}
        />
        <StatCard
          title="Low Stock Items"
          value={inventory.lowStock}
          subtitle={`Out of stock: ${inventory.outOfStock}`}
        />
        <StatCard
          title="Pending Revenue"
          value={`₹${revenue.pending}`}
          subtitle="Unpaid / Partial"
        />
      </div>

      {/* MONTH / YEAR SNAPSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="This Month Revenue"
          value={`₹${revenue.thisMonth}`}
        />
        <StatCard
          title="This Year Revenue"
          value={`₹${revenue.thisYear}`}
        />
        <StatCard
          title="POS Orders (This Month)"
          value={orders.thisMonth}
        />
      </div>
{/* DASHBOARD CHARTS */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <RevenueChart />
  <POSOrdersChart />
</div>
    </div>

    
  );
}