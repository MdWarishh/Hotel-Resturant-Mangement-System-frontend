'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { USER_ROLES, ORDER_STATUS } from '@/utils/constants'
import { apiRequest } from '@/services/api'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import { Loader2, AlertCircle, Eye, CheckCircle, XCircle, Download, Calendar, RefreshCw, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'


export default function POSOrdersPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [totalRevenue, setTotalRevenue] = useState(0)

  // Security check
  if (!user || ![USER_ROLES.HOTEL_ADMIN, USER_ROLES.MANAGER].includes(user.role)) {
    return (
      <div className="p-6 text-center text-red-600">
        Unauthorized access. Redirecting...
      </div>
    )
  }

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const res = await apiRequest(`/pos/orders?${params.toString()}`)
      const ordersData = Array.isArray(res?.data?.orders) ? res.data.orders : res.data || []

      setOrders(ordersData)
      setFilteredOrders(ordersData)

      // Calculate total revenue
      const total = ordersData.reduce((sum, order) => sum + (order.pricing?.total || 0), 0)
      setTotalRevenue(total)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError('Failed to load orders. Please try again.')
      setOrders([])
      setFilteredOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    const socket = connectPOSSocket()

    socket.on('connect', () => {
      console.log('✅ Connected to POS real-time updates')
    })

    socket.on('order:created', fetchOrders)
    socket.on('order:updated', fetchOrders)

    return () => disconnectPOSSocket()
  }, [startDate, endDate, statusFilter])

  // Apply local filters/search if needed (currently backend handles, but can add client-side search)
  const handleSearch = (query) => {
    const filtered = orders.filter(order => 
      order.orderNumber?.toLowerCase().includes(query.toLowerCase()) ||
      order.tableNumber?.toString().includes(query) ||
      order.room?.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredOrders(filtered)
  }

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await apiRequest(`/pos/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      // Socket will trigger refresh
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleExport = () => {
    const headers = [
      'Order Number', 'Type', 'Table/Room', 'Status', 'Created At', 'Total (₹)'
    ]

    const rows = filteredOrders.map(order => [
      order.orderNumber || order._id.slice(-6),
      order.orderType,
      order.tableNumber ? `Table ${order.tableNumber}` : order.room ? `Room ${order.room}` : 'Takeaway',
      order.status,
      format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm'),
      order.pricing?.total || 0
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pos-orders.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              POS Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and manage all orders ({filteredOrders.length})
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>

            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-[rgb(0,173,181)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-[rgb(0,173,181)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-[rgb(0,173,181)]"
            >
              <option value="ALL">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchOrders}
              className="w-full py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow border">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Total Revenue in Period</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{totalRevenue.toLocaleString()}</p>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Table/Room</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Created At</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Total (₹)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      #{order.orderNumber || order._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {order.orderType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.tableNumber ? `Table ${order.tableNumber}` : order.room ? `Room ${order.room}` : 'Takeaway'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ₹{order.pricing?.total?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-3">
                        <Link href={`/hotel-admin/pos/orders/${order._id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-5 w-5" />
                        </Link>
                        {order.status !== 'cancelled' && order.status !== 'served' && (
                          <>
                            {order.status === 'ready' && (
                              <button
                                disabled={updatingId === order._id}
                                onClick={() => updateStatus(order._id, 'served')}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => updateStatus(order._id, 'cancelled')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Status Badge Helper
function getStatusBadge(status) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    served: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
      {status.toUpperCase()}
    </span>
  )
}