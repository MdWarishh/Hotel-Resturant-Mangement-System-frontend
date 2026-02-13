'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES, ORDER_STATUS } from '@/utils/constants';
import { apiRequest } from '@/services/api';
import { Loader2, Plus, ListOrdered, UtensilsCrossed, DollarSign, AlertCircle, ArrowRight, CreditCard, Bed, FileText } from 'lucide-react';
import Link from 'next/link';
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket';

export default function POSDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState(null);
  const [runningOrders, setRunningOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect non-hotel-admin roles
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Role-based redirect (only hotel-admin stays here)
    if (user.role === USER_ROLES.CASHIER) {
      router.replace('/hotel-admin/pos/orders/new');
      return;
    }
    if (user.role === USER_ROLES.KITCHEN_STAFF) {
      router.replace('/hotel-admin/pos/kitchen');
      return;
    }
    if (user.role === USER_ROLES.MANAGER) {
      router.replace('/hotel-admin/pos/orders');
      return;
    }

    // Only hotel-admin proceeds to load dashboard
    if (user.role !== USER_ROLES.HOTEL_ADMIN) {
      router.replace('/hotel-admin');
      return;
    }

    loadDashboardData();
  }, [user, authLoading, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = connectPOSSocket(token);

    socket.on('order:created', (newOrder) => {
      setRunningOrders((prev) => [newOrder, ...prev]);
      
      setSummary((prev) => ({
        ...prev,
        totalOrders: (prev?.totalOrders || 0) + 1,
        totalSales: (prev?.totalSales || 0) + (newOrder.pricing?.total || 0),
      }));
    });

    socket.on('order:updated', (updatedOrder) => {
      setRunningOrders((prev) => {
        if (['completed', 'cancelled'].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    return () => disconnectPOSSocket();
  }, []);

  useEffect(() => {
    const socket = connectPOSSocket();

    socket.on('order:created', (newOrder) => {
      loadDashboardData(); 
    });

    socket.on('order:updated', (updatedOrder) => {
      loadDashboardData();
    });

    return () => disconnectPOSSocket();
  }, []);

  const loadDashboardData = async () => {
    setPageLoading(true);
    try {
      const summaryRes = await apiRequest('/pos/reports/summary');
      const stats = summaryRes.data?.data || summaryRes.data || {};

      const ordersRes = await apiRequest('/pos/orders/running');
      const runningOrdersArray = ordersRes.data?.orders || ordersRes.data || [];

      const totalSales = runningOrdersArray.reduce((sum, o) => {
        if (o.status === 'cancelled') return sum;
        return sum + (o.pricing?.total || 0);
      }, 0);
      const avgValue = runningOrdersArray.length > 0 ? Math.round(totalSales / runningOrdersArray.length) : 0;

      setSummary({
        ...stats,
        todaySales: totalSales,
        totalOrders: runningOrdersArray.length,
        avgOrderValue: avgValue
      });
      
      setRunningOrders(runningOrdersArray);
    } catch (err) {
      console.error('POS Load Error:', err);
    } finally {
      setPageLoading(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(238,238,238)] dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-lg font-medium text-[rgb(34,40,49)] dark:text-gray-200">
            Loading POS Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(238,238,238)] dark:bg-gray-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(238,238,238)] dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[rgb(34,40,49)] dark:text-white">
            POS Dashboard
          </h1>
          <p className="text-[rgb(57,62,70)] dark:text-gray-400 mt-2">
            Manage restaurant orders, tables, and billing
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/hotel-admin/pos/orders/new"
            className="flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-xl hover:bg-[rgb(0,173,181)]/90 shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            New Order
          </Link>
          <Link
            href="/hotel-admin/pos/orders"
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 shadow transition-all"
          >
            <ListOrdered className="h-5 w-5" />
            All Orders
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value={`₹${(summary?.totalSales || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          bg="bg-green-50 dark:bg-green-950/30"
        />
        <StatCard
          title="Orders Today"
          value={summary?.totalOrders || 0}
          icon={<ListOrdered className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${(summary?.avgOrderValue || 0).toLocaleString()}`}
          icon={<CreditCard className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          title="Running Orders"
          value={runningOrders.length}
          icon={<UtensilsCrossed className="h-6 w-6 text-orange-600" />}
          bg="bg-orange-50 dark:bg-orange-950/30"
        />
      </div>

      {/* Running Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Running Orders</h2>
          <Link
            href="/hotel-admin/pos/orders"
            className="text-[rgb(0,173,181)] hover:underline flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {runningOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No running orders at the moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-4 font-medium">Order #</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Table/Room</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {runningOrders.slice(0, 10).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{order.orderNumber}</td>
                    <td className="p-4 capitalize">{order.orderType}</td>
                    <td className="p-4">
                      {order.tableNumber || order.room?.roomNumber || '—'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === ORDER_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' :
                        order.status === ORDER_STATUS.PREPARING ? 'bg-blue-100 text-blue-800' :
                        order.status === ORDER_STATUS.READY ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium">₹{order.pricing?.total?.toLocaleString() || 0}</td>
                    <td className="p-4">
                      <Link
                        href={`/hotel-admin/pos/orders/${order._id}`}
                        className="text-[rgb(0,173,181)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions - ✅ UPDATED: Added GST Report Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <QuickActionCard
          title="New Order"
          description="Start a new dine-in, room service or takeaway order"
          icon={<Plus className="h-8 w-8" />}
          href="/hotel-admin/pos/orders/new"
          color="bg-green-600 hover:bg-green-700"
        />
        <QuickActionCard
          title="View Menu"
          description="Manage menu items and categories"
          icon={<UtensilsCrossed className="h-8 w-8" />}
          href="/hotel-admin/pos/menu"
          color="bg-purple-600 hover:bg-purple-700"
        />
        <QuickActionCard
          title="Tables Status"
          description="Check table availability and occupancy"
          icon={<Bed className="h-8 w-8" />}
          href="/hotel-admin/pos/tables"
          color="bg-orange-600 hover:bg-orange-700"
        />
        {/* ✅ NEW: GST Report Card */}
        <QuickActionCard
          title="GST Report"
          description="Generate and export POS GST reports"
          icon={<FileText className="h-8 w-8" />}
          href="/hotel-admin/pos/gst-report"
          color="bg-blue-600 hover:bg-blue-700"
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, bg }) {
  return (
    <div className={`rounded-xl p-6 shadow-lg ${bg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// Quick Action Card
function QuickActionCard({ title, description, icon, href, color }) {
  return (
    <Link href={href} className={`group block rounded-xl ${color} p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-white/90 mb-4">{description}</p>
      <div className="flex items-center gap-2 text-sm font-medium">
        Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}