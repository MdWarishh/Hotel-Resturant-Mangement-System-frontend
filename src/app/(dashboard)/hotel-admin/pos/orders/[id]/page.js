'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrder, OrderProvider } from '@/context/OrderContext'
import { apiRequest } from '@/services/api'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import MenuSection from '../new/MenuSection'
import CartSection from '../new/CartSection'
import KotPrintButton from '@/app/(dashboard)/cashier/KotPrintButton/page'
import {
  Loader2, AlertCircle, Printer, ArrowLeft, Clock,
  ShoppingCart, X, CreditCard, CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'

function OrderDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const { resetOrder, startOrder } = useOrder()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddItems, setShowAddItems] = useState(false)

  useEffect(() => {
    fetchOrder()

    const socket = connectPOSSocket()

    socket.on('order:updated', (updatedOrder) => {
      if (updatedOrder._id === id) setOrder(updatedOrder)
    })
    socket.on('order:paid', (updatedOrder) => {
      if (updatedOrder._id === id) setOrder(updatedOrder)
    })

    return () => disconnectPOSSocket()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/pos/orders/${id}`)
      const fetchedOrder = res.data?.order || res.data
      if (!fetchedOrder) throw new Error('Order not found')
      setOrder(fetchedOrder)
    } catch (err) {
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Add Items modal ke liye cart ko existing order details se prime karo
  const handleOpenAddItems = () => {
    startOrder({
      orderType: order.orderType,
      tableNumber: order.orderType === 'dine-in' ? order.tableNumber : undefined,
      room: order.orderType === 'room-service' ? (order.room?._id || order.room) : undefined,
    })
    setShowAddItems(true)
  }

  const handleCloseAddItems = () => {
    setShowAddItems(false)
    resetOrder()
    fetchOrder()
  }

  const handlePrintInvoice = () => {
    if (!order) return
    const token = localStorage.getItem('token')
    const baseUrl = 'http://localhost:5000'
    const pdfUrl = `${baseUrl}/api/pos/orders/${order._id}/invoice/pdf?token=${token}`
    window.open(pdfUrl, '_blank')
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      served: 'bg-green-100 text-green-800',
      completed: 'bg-gray-200 text-gray-700',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md text-center bg-white rounded-xl shadow-xl p-6 sm:p-8">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">Error</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push('/hotel-admin/pos/orders')}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-semibold shadow-md"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const isPaid = order.payment?.status === 'PAID'
  const isCancelled = order.status === 'cancelled'
  const canModify = !isPaid && !isCancelled

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm p-5 sm:p-6 border-l-4 border-[rgb(0,173,181)]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
              <button
                onClick={() => router.push('/hotel-admin/pos/orders')}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 mt-1 sm:mt-0"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Order #{order.orderNumber || order._id.slice(-6)}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-medium">
                    {order.tableNumber ? `Table ${order.tableNumber}` :
                      order.room?.roomNumber ? `Room ${order.room.roomNumber}` : 'Takeaway'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isPaid ? '✓ PAID' : '⏸ UNPAID (HOLD)'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={handlePrintInvoice}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-md flex-1 sm:flex-initial"
              >
                <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Print</span>
              </button>

              {/* ✅ KOT button — payment hote hi turant dikhega */}
              {isPaid && (
                <div className="flex-1 sm:flex-initial sm:w-40">
                  <KotPrintButton orderId={order._id} orderNumber={order.orderNumber} />
                </div>
              )}

              {canModify && (
                <button
                  onClick={handleOpenAddItems}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-md flex-1 sm:flex-initial"
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Add Items</span>
                </button>
              )}

              {canModify && (
                <button
                  onClick={() => router.push(`/hotel-admin/pos/checkout/${order._id}`)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg font-semibold shadow-md flex-1 sm:flex-initial"
                >
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Checkout</span>
                </button>
              )}

              {isPaid && (
                <div className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-semibold flex-1 sm:flex-initial">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Paid</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Summary */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Status</p>
              {getStatusBadge(order.status)}
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Grand Total</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[rgb(0,173,181)]">
                ₹{order.pricing?.total?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Items</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{order.items?.length || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Order Type</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">{order.orderType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Payment Mode</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{order.payment?.mode || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Created
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden mb-6 sm:mb-8">
          <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order Items</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Item</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Qty</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {item.name}
                        {item.variant && <span className="text-sm text-gray-500"> ({item.variant})</span>}
                      </div>
                      {item.specialInstructions && <p className="text-sm text-gray-500 mt-1">{item.specialInstructions}</p>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-900">₹{item.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{(item.quantity * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 sm:p-6 border-t-2 border-gray-200 bg-gray-50">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{order.pricing?.subtotal?.toLocaleString() || '0'}</span>
              </div>
              {order.extraCharges?.filter(c => c.label && c.amount > 0).map((c, i) => (
                <div key={i} className="flex justify-between text-sm sm:text-base">
                  <span className="text-orange-600 font-medium">{c.label}</span>
                  <span className="font-semibold text-orange-600">+₹{Number(c.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 font-medium">GST (5%)</span>
                <span className="font-semibold text-gray-900">₹{order.pricing?.tax?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold mt-4 pt-4 border-t-2 border-gray-300">
                <span className="text-gray-900">Total</span>
                <span className="text-[rgb(0,173,181)]">₹{order.pricing?.total?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Items Modal */}
        {showAddItems && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)]">
                <h3 className="text-lg sm:text-xl font-bold text-white">Add More Items — Order #{order.orderNumber}</h3>
                <button onClick={handleCloseAddItems} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 overflow-y-auto">
                  <MenuSection />
                </div>
                <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto max-h-[50vh] md:max-h-none">
                  <CartSection
                    existingOrderId={order._id}
                    existingOrderMeta={order}
                    onFinishAddingItems={handleCloseAddItems}
                    onItemsAdded={() => fetchOrder()}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrderDetailPage() {
  return (
    <OrderProvider>
      <OrderDetailContent />
    </OrderProvider>
  )
}