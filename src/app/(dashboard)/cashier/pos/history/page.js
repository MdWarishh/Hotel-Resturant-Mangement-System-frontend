'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/services/api'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import { Loader2, AlertCircle, Calendar, Download, RefreshCw, DollarSign, CheckCircle, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function OrderHistoryPage() {
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // last 7 days
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchHistory()

    const socket = connectPOSSocket()

    socket.on('order:updated', (updatedOrder) => {
      if (['paid', 'settled', 'cancelled'].includes(updatedOrder.status)) {
        // Refresh if a new completed order appears
        fetchHistory()
      }
    })

    return () => disconnectPOSSocket()
  }, [startDate, endDate])

// src/app/(dashboard)/cashier/history/page.js

const fetchHistory = async () => {
  setLoading(true)
  setError(null)

  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
      // ✅ FIX: Added 'served' to the status filter to match backend
      status: 'served,paid,settled,cancelled', 
    })

    const res = await apiRequest(`/pos/orders?${params.toString()}`)
  const ordersArray = res.data && Array.isArray(res.data) ? res.data : (res.data?.orders || []);

    // Use optional chaining to safely access the orders array
   const completedOrders = ordersArray.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    setOrders(completedOrders)
  } catch (err) {
    setError('Failed to load order history')
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  const handleExport = () => {
    if (orders.length === 0) return

    const headers = ['Order #', 'Type', 'Table/Room', 'Total (₹)', 'Status', 'Date', 'Payment Mode']
    const rows = orders.map(o => [
      o.orderNumber || o._id.slice(-6),
      o.orderType,
      o.tableNumber ? `Table ${o.tableNumber}` : o.room ? `Room ${o.room}` : 'Takeaway',
      o.pricing?.total || 0,
      o.status,
      format(new Date(o.updatedAt), 'dd MMM yyyy, HH:mm'),
      o.payment?.mode || 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-history-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

// Add 'served' to your badge styles
const getStatusBadge = (status) => {
  const styles = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    served: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', // ✅ NEW
    settled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6 border-l-4 border-[rgb(0,173,181)]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Order History
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Completed and past orders
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={handleExport}
                disabled={loading || orders.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Export</span>
              </button>

              <button
                onClick={fetchHistory}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial"
              >
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline text-sm sm:text-base">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] outline-none transition-all text-sm sm:text-base font-medium"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] outline-none transition-all text-sm sm:text-base font-medium"
              />
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 sm:py-20">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-[rgb(0,173,181)]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 sm:p-8 text-center shadow-md">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-red-500 mb-4" />
            <p className="text-sm sm:text-base text-red-700 dark:text-red-300 mb-4 font-medium">{error}</p>
            <button
              onClick={fetchHistory}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">No completed orders found</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Try adjusting the date range
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)] rounded-xl p-5 sm:p-6 mb-6 sm:mb-8 text-white shadow-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs sm:text-sm opacity-90 font-medium mb-1">Total Orders</p>
                  <p className="text-2xl sm:text-3xl font-bold">{orders.length}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm opacity-90 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold">
                    ₹{orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs sm:text-sm opacity-90 font-medium mb-1">Avg Order Value</p>
                  <p className="text-2xl sm:text-3xl font-bold">
                    ₹{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0) / orders.length).toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {orders.map(order => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/cashier/orders/${order._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 p-5 sm:p-6 cursor-pointer hover:border-[rgb(0,173,181)] hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                        #{order.orderNumber || order._id.slice(-6)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                        {order.tableNumber
                          ? `Table ${order.tableNumber}`
                          : order.room
                          ? `Room ${order.room}`
                          : 'Takeaway'}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-lg sm:text-xl">
                      <DollarSign className="h-5 w-5" />
                      ₹{order.pricing?.total?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {format(new Date(order.updatedAt), 'dd MMM, HH:mm')}
                      </span>
                      <span className="sm:hidden">
                        {format(new Date(order.updatedAt), 'dd MMM')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {order.items?.length || 0} items • Paid via {order.payment?.mode || 'Cash'}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                    <span className="text-sm sm:text-base text-[rgb(0,173,181)] font-semibold hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Floating New Order Button */}
        <button
          onClick={() => router.push('/cashier/pos')}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-[rgb(0,173,181)] text-white p-4 sm:p-5 rounded-full shadow-2xl hover:bg-[rgb(0,173,181)]/90 transition-all transform hover:scale-110 active:scale-95 z-50"
          aria-label="New Order"
        >
          <Plus className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>
    </div>
  )
}

// Status Badge Helper (reused)
function getStatusBadge(status) {
  const styles = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    served: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    settled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}