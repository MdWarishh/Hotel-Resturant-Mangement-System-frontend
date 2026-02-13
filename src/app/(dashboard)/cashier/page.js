'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { ShoppingCart, Receipt, Clock, DollarSign, Loader2, AlertCircle } from 'lucide-react';

export default function CashierHomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    todayCollection: 0,
    activeOrders: 0,
    pendingBills: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get today's sales
      const today = new Date().toISOString().split('T')[0];
      const salesRes = await apiRequest(`/reports/sales?startDate=${today}&endDate=${today}`);
      const ordersRes = await apiRequest('/pos/orders/running');
      const allOrders = ordersRes.data?.orders || [];

      setStats({
        todayCollection: salesRes.data?.totals?.totalSales || 0,
        activeOrders: ordersRes.data?.orders?.length || 0,
       pendingBills: allOrders.filter(o => o.payment?.status !== 'PAID').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(238,238,238)] p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm p-5 sm:p-6 border-l-4 border-[rgb(0,173,181)]">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Welcome, {user?.name || 'Cashier'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">Start taking orders and manage your cashier operations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(0,173,181)]" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 text-gray-800">
            <StatCard
              title="Today's Collection"
              value={`₹${stats.todayCollection.toLocaleString()}`}
              icon={<DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />}
              
            />
            <StatCard
              title="Active Orders"
              value={stats.activeOrders}
              icon={<Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />}
            />
            <StatCard
              title="Pending Bills"
              value={stats.pendingBills}
              icon={<ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />}
            />
          </div>

          {/* Big Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ActionButton
              title="Start New Order"
              description="Dine-in, takeaway, or room service"
              icon={<ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />}
              onClick={() => router.push('/cashier/pos')}
              color="bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90"
            />

            <ActionButton
              title="View Running Orders"
              description="Manage active tables and orders"
              icon={<Clock className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />}
              onClick={() => router.push('/cashier/orders')}
              color="bg-purple-600 hover:bg-purple-700"
            />

            <ActionButton
              title="Order History"
              description="View completed and past orders"
              icon={<Receipt className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />}
              onClick={() => router.push('/cashier/pos/history')}
              color="bg-gray-700 hover:bg-gray-600"
            />
          </div>
        </>
      )}
    </div>
  );
}

// Reusable Components
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border-t-4 border-[rgb(0,173,181)]">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 break-words text-gray-900">{value}</p>
        </div>
        <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex-shrink-0 ml-3 shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] ${color}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 sm:mb-5 p-4 sm:p-5 bg-white/25 rounded-2xl shadow-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">{icon}</div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300">{title}</h3>
        <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">{description}</p>
      </div>
    </button>
  );
}