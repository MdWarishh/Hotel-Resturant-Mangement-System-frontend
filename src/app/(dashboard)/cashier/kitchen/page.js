'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiRequest } from '@/services/api'
import { connectPOSSocket } from '@/services/posSocket'
import {
  Loader2, AlertCircle, Bell, BellOff, UtensilsCrossed, Clock,
  ArrowRight, CheckCircle, XCircle, RefreshCw, Users, ShoppingCart,
  BedDouble, Search, TrendingUp, ChefHat
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import KotPrintButton from '../KotPrintButton/page'

export default function CashierKitchenPage() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Filters
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('oldest')

  const soundEnabledRef = useRef(soundEnabled)
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const playNotificationSound = useCallback(() => {
    if (soundEnabledRef.current) {
      const audio = new Audio('/sounds/beep.mp3')
      audio.play().catch(err => console.error('Sound playback failed:', err))
    }
  }, [])

  // Fetch kitchen orders
  const fetchKitchenOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/pos/orders/kitchen')
      const kitchenOrders = res.data?.orders || res.data || []
      setOrders(kitchenOrders)
    } catch (err) {
      setError('Failed to load kitchen orders')
      console.error('❌ Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Socket setup — only on mount
  useEffect(() => {
    fetchKitchenOrders()

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = connectPOSSocket(token)

    const handleOrderCreated = (newOrder) => {
      setOrders(prev => {
        if (prev.some(o => o._id === newOrder._id)) return prev
        playNotificationSound()
        return [newOrder, ...prev]
      })
    }

    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prev => {
        if (['cancelled', 'completed'].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id)
        }
        const exists = prev.some(o => o._id === updatedOrder._id)
        if (!exists) {
          playNotificationSound()
          return [updatedOrder, ...prev]
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o)
      })
    }

    const handleOrderPaid = (paidOrder) => {
      setOrders(prev => {
        const exists = prev.some(o => o._id === paidOrder._id)
        if (!exists) {
          playNotificationSound()
          return [paidOrder, ...prev]
        }
        return prev.map(o => o._id === paidOrder._id ? paidOrder : o)
      })
    }

    socket.on('order:created', handleOrderCreated)
    socket.on('order:new', handleOrderCreated)
    socket.on('order:updated', handleOrderUpdated)
    socket.on('order:paid', handleOrderPaid)

    return () => {
      socket.off('order:created', handleOrderCreated)
      socket.off('order:new', handleOrderCreated)
      socket.off('order:updated', handleOrderUpdated)
      socket.off('order:paid', handleOrderPaid)
    }
  }, [])

  // Filters effect
  useEffect(() => {
    let filtered = [...orders]

    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(o => o.orderType === orderTypeFilter)
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(query) ||
        o.tableNumber?.toString().includes(query) ||
        o.room?.toLowerCase().includes(query) ||
        o.items?.some(i => i.name?.toLowerCase().includes(query))
      )
    }

    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'totalAmount') return (b.pricing?.total || 0) - (a.pricing?.total || 0)
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    setFilteredOrders(filtered)
  }, [orderTypeFilter, statusFilter, searchQuery, sortBy, orders])

  const handleUpdateStatus = async (orderId, newStatus) => {
    // Optimistic update
    setOrders(prev => {
      if (!['pending', 'preparing'].includes(newStatus)) {
        return prev.filter(o => o._id !== orderId)
      }
      return prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
    })

    try {
      await apiRequest(`/pos/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (err) {
      console.error('Failed to update order status:', err)
      alert('Failed to update order status')
      fetchKitchenOrders()
    }
  }

  const handlePrintChit = (orderId) => {
    window.open(`/api/pos/orders/${orderId}/kot`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)] mx-auto mb-4" />
          <p className="text-white text-sm font-medium">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-500/50">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Error Loading Orders</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchKitchenOrders}
            className="px-6 py-3 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-gradient-to-br from-[rgb(0,173,181)] to-[rgb(0,153,161)] rounded-2xl shadow-lg">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-4xl font-bold">Kitchen Display</h1>
                  <p className="text-gray-400 mt-1 font-medium">
                    Active orders: <span className="text-[rgb(0,173,181)] font-bold">{filteredOrders.length}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold shadow-lg transition-all flex-1 sm:flex-initial ${
                    soundEnabled
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {soundEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  <span className="hidden sm:inline text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>

                <button
                  onClick={fetchKitchenOrders}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)] text-white rounded-xl font-semibold shadow-lg transition-all flex-1 sm:flex-initial"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Clock className="h-6 w-6" />} label="Pending" value={orders.filter(o => o.status === 'pending').length} color="yellow" />
            <StatCard icon={<UtensilsCrossed className="h-6 w-6" />} label="Preparing" value={orders.filter(o => o.status === 'preparing').length} color="blue" />
            <StatCard icon={<CheckCircle className="h-6 w-6" />} label="Ready" value={orders.filter(o => o.status === 'ready').length} color="green" />
            <StatCard icon={<TrendingUp className="h-6 w-6" />} label="Total Orders" value={orders.length} color="teal" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search order, table, item..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-700 rounded-xl focus:border-[rgb(0,173,181)] bg-gray-900 text-white placeholder-gray-500 outline-none transition-all text-sm font-medium"
              />
            </div>

            <select
              value={orderTypeFilter}
              onChange={e => setOrderTypeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-700 rounded-xl focus:border-[rgb(0,173,181)] bg-gray-900 text-white outline-none transition-all text-sm font-semibold"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine-In</option>
              <option value="takeaway">Takeaway</option>
              <option value="room-service">Room Service</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-700 rounded-xl focus:border-[rgb(0,173,181)] bg-gray-900 text-white outline-none transition-all text-sm font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-700 rounded-xl focus:border-[rgb(0,173,181)] bg-gray-900 text-white outline-none transition-all text-sm font-semibold"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="totalAmount">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-gray-700 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gray-900 rounded-full">
                <UtensilsCrossed className="h-16 w-16 text-gray-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">No Orders in Queue</h3>
            <p className="text-gray-400 font-medium">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                onPrintChit={handlePrintChit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Stats Card
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    yellow: 'from-yellow-600 to-yellow-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    teal: 'from-[rgb(0,173,181)] to-[rgb(0,153,161)]',
  }
  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide truncate">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}

// Order Card
function OrderCard({ order, onUpdateStatus, onPrintChit }) {
  const getOrderTypeIcon = () => {
    if (order.tableNumber) return <Users className="h-4 w-4" />
    if (order.room) return <BedDouble className="h-4 w-4" />
    return <ShoppingCart className="h-4 w-4" />
  }

  const getOrderTypeText = () => {
    if (order.tableNumber) return `Table ${order.tableNumber}`
    if (order.room) return `Room ${order.room?.roomNumber || order.room?._id?.slice(-4)}`
    return 'Takeaway'
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-gray-700 p-5 sm:p-6 hover:border-[rgb(0,173,181)] transition-all duration-300 transform hover:scale-[1.02]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold truncate">
            #{order.orderNumber || order._id.slice(-6)}
          </h3>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 font-medium">
            {getOrderTypeIcon()}
            {getOrderTypeText()}
          </p>
        </div>
        <div className="ml-2 flex-shrink-0">
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 bg-gray-900/50 rounded-xl p-4">
        <h4 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">Order Items</h4>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {order.items?.map((item, idx) => (
            <li key={idx} className="text-sm flex justify-between items-start gap-2 pb-2 border-b border-gray-700/50 last:border-0 last:pb-0">
              <span className="flex-1 font-medium">
                <span className="text-[rgb(0,173,181)] font-bold">{item.quantity}x</span> {item.name}
                {item.variant && <span className="text-gray-500 text-xs"> ({item.variant})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Time */}
      <div className="flex items-center text-sm mb-4 p-3 bg-gray-900/50 rounded-xl">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {order.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(order._id, 'preparing')}
            className="col-span-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-5 w-5" />
            Start Preparing
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => onUpdateStatus(order._id, 'ready')}
            className="col-span-2 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Mark as Ready
          </button>
        )}

          <div className="col-span-2">
    <KotPrintButton orderId={order._id} orderNumber={order.orderNumber} />
  </div>
        <button
          onClick={() => onUpdateStatus(order._id, 'cancelled')}
          className="col-span-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <XCircle className="h-5 w-5" />
          Cancel Order
        </button>
      </div>
    </div>
  )
}

// Status Badge
function getStatusBadge(status) {
  const styles = {
    pending: 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white',
    preparing: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white',
    ready: 'bg-gradient-to-r from-green-600 to-green-700 text-white',
    served: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white',
    paid: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
    cancelled: 'bg-gradient-to-r from-red-600 to-red-700 text-white',
  }
  return (
    <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold capitalize shadow-lg ${styles[status] || 'bg-gray-700 text-white'}`}>
      {status}
    </span>
  )
}