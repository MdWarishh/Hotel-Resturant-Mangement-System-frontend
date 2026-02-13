'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/services/api'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import { Loader2, AlertCircle, RefreshCw, Clock, DollarSign, Users, BedDouble, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function RunningOrdersPage() {
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial orders
  useEffect(() => {
    fetchRunningOrders()

    const socket = connectPOSSocket()

    // Live updates
    socket.on('order:created', handleOrderUpdate)
    socket.on('order:updated', handleOrderUpdate)
    socket.on('order:deleted', handleOrderUpdate)
    socket.on('order:statusUpdated', handleOrderUpdate)

    return () => {
      disconnectPOSSocket()
    }
  }, [])

  const fetchRunningOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest('/pos/orders/running')
      // Assuming your endpoint returns { orders: [...] }
      const activeOrders = (res.data?.orders || []).filter(
        o => !['paid', 'settled', 'cancelled'].includes(o.status)
      )
      setOrders(activeOrders)
    } catch (err) {
      console.error('Failed to fetch running orders:', err)
      setError('Failed to load running orders')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    // Refresh list on any relevant socket event
    fetchRunningOrders()
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    }

    return (
      <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">Error</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchRunningOrders}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6 border-l-4 border-[rgb(0,173,181)]">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Running Orders
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Active dine-in, takeaway & room-service orders
            </p>
          </div>

          <button
            onClick={fetchRunningOrders}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">No running orders</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Start a new order or check back later
            </p>
          </div>
        ) : (
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
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </span>
                    <span className="sm:hidden">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }).replace('about ', '')}
                    </span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {order.items?.length || 0} items • {order.guestCount || 1} guest(s)
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                  <span className="text-sm sm:text-base text-[rgb(0,173,181)] font-semibold hover:underline">
                    View & Manage →
                  </span>
                </div>
              </div>
            ))}
          </div>
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

// Status Badge Helper
function getStatusBadge(status) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    paid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}