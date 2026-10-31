'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import {
  Loader2, AlertCircle, DollarSign, BedDouble, ShoppingCart,
  UtensilsCrossed, Table2, TrendingUp, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  served: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}
const DEFAULT_STATUS_STYLE = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'

export default function HotelAdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [data, setData] = useState({
    todayRevenue: 0,
    occupancyToday: 0,
    activeOrders: 0,
    pendingOrders: [],
    activeTables: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // ✅ Teeno API parallel (pehle ek ke baad ek chal rahi thi)
      const [revenueRes, occupancyRes, ordersRes] = await Promise.all([
        apiRequest(`/reports/revenue?startDate=${todayStart.toISOString().split('T')[0]}`),
        apiRequest('/reports/occupancy'),
        apiRequest('/pos/orders/running'),
      ])

      const orders = ordersRes.data?.orders || []

      setData({
        todayRevenue: revenueRes.data?.totals?.totalRevenue || 0,
        occupancyToday: occupancyRes.data?.summary?.averageOccupancy || 0,
        activeOrders: orders.length,
        pendingOrders: orders.slice(0, 5),
        activeTables: orders.filter((o) => o.tableNumber).length,
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user, fetchDashboardData])

  // ✅ Next pages pehle se prefetch
  useEffect(() => {
    router.prefetch('/hotel-admin/pos/orders/new')
    router.prefetch('/hotel-admin/pos/tables')
    router.prefetch('/hotel-admin/pos/menu')
    router.prefetch('/hotel-admin/pos/orders')
    router.prefetch('/hotel-admin/reports')
  }, [router])

  const revenueText = useMemo(
    () => `₹${data.todayRevenue.toLocaleString()}`,
    [data.todayRevenue]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Admin'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening in your hotel today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Today's Revenue"
            value={revenueText}
            icon={<DollarSign className="h-8 w-8 text-green-600" />}
            trend="+12%"
          />
          <StatCard
            title="Occupancy Today"
            value={`${data.occupancyToday}%`}
            icon={<BedDouble className="h-8 w-8 text-blue-600" />}
            trend="+5%"
          />
          <StatCard
            title="Active Orders"
            value={data.activeOrders}
            icon={<ShoppingCart className="h-8 w-8 text-purple-600" />}
          />
          <StatCard
            title="Occupied Tables"
            value={data.activeTables}
            icon={<Table2 className="h-8 w-8 text-orange-600" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <QuickActionCard
            title="New POS Order"
            description="Start a dine-in, room service or takeaway order"
            icon={<ShoppingCart className="h-8 w-8" />}
            href="/hotel-admin/pos/orders/new"
            color="bg-green-600 hover:bg-green-700"
          />
          <QuickActionCard
            title="View Tables"
            description="Check table status and occupancy"
            icon={<Table2 className="h-8 w-8" />}
            href="/hotel-admin/pos/tables"
            color="bg-blue-600 hover:bg-blue-700"
          />
          <QuickActionCard
            title="Full Menu"
            description="Browse and manage menu items"
            icon={<UtensilsCrossed className="h-8 w-8" />}
            href="/hotel-admin/pos/menu"
            color="bg-purple-600 hover:bg-purple-700"
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent POS Orders
            </h2>
            <Link
              href="/hotel-admin/pos/orders"
              className="text-[rgb(0,173,181)] hover:underline text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.pendingOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No recent orders
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Order #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Table/Room</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.pendingOrders.map((order) => (
                    <OrderRow key={order._id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="New Order"
            description="Start a new POS order"
            href="/hotel-admin/pos/orders/new"
            icon={<ShoppingCart className="h-8 w-8" />}
            color="bg-green-600 hover:bg-green-700"
          />
          <QuickActionCard
            title="Tables Status"
            description="Monitor table occupancy"
            href="/hotel-admin/pos/tables"
            icon={<Table2 className="h-8 w-8" />}
            color="bg-blue-600 hover:bg-blue-700"
          />
          <QuickActionCard
            title="Full Reports"
            description="Revenue, occupancy, sales & more"
            href="/hotel-admin/reports"
            icon={<TrendingUp className="h-8 w-8" />}
            color="bg-purple-600 hover:bg-purple-700"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Reusable Components (component ke BAHAR, taaki har render pe recreate na hon) ───

const OrderRow = memo(function OrderRow({ order }) {
  const location = order.tableNumber
    ? `Table ${order.tableNumber}`
    : order.room
    ? `Room ${order.room?.roomNumber || ''}`.trim()
    : 'Takeaway'

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        #{order.orderNumber || order._id.slice(-6)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {location}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
        ₹{order.pricing?.total?.toLocaleString() || '0'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[order.status] || DEFAULT_STATUS_STYLE}`}>
          {order.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
        {format(new Date(order.createdAt), 'HH:mm')}
      </td>
    </tr>
  )
})

const StatCard = memo(function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-sm mt-1 text-green-600 dark:text-green-400">{trend}</p>
          )}
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
})

const QuickActionCard = memo(function QuickActionCard({ title, description, href, icon, color }) {
  return (
    <Link
      href={href}
      className={`group block rounded-xl ${color} p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-white/90 mb-4">{description}</p>
      <div className="flex items-center gap-2 text-sm font-medium">
        Go <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
})