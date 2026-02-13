'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrder, OrderProvider } from '@/context/OrderContext'
import { apiRequest } from '@/services/api'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import PaymentModal from '@/components/cashier/PaymentModal'
import { Loader2, AlertCircle, Printer, ArrowLeft, DollarSign, Clock, Users, BedDouble, ShoppingCart, X } from 'lucide-react'
import { format } from 'date-fns'


function OrderDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const { addItem, updateQuantity, removeItem, resetOrder } = useOrder()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showAddItems, setShowAddItems] = useState(false)

  useEffect(() => {
    fetchOrder()

    const socket = connectPOSSocket()

    socket.on('order:updated', (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder)
      }
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

  const handlePaymentSuccess = () => {
    // Socket will broadcast update → status becomes 'paid'
    setShowPayment(false)
    resetOrder()
    router.push('/cashier/orders') // back to running orders
  }

  const handlePrintBill = () => {
    if (!order?._id) return
    window.open(`/api/pos/orders/${order._id}/invoice/pdf`, '_blank')
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      paid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }

    return (
      <span className={`inline-flex px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">Error</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push('/cashier/orders')}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6 border-l-4 border-[rgb(0,173,181)]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 mt-1 sm:mt-0"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  Order #{order.orderNumber || order._id.slice(-6)}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-medium">
                    {order.tableNumber ? `Table ${order.tableNumber}` : 
                     order.room ? `Room ${order.room}` : 'Takeaway'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-xs sm:text-sm">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={handlePrintBill}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial"
              >
                <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Print</span>
              </button>

              {!['paid', 'settled'].includes(order.status) && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial"
                >
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Pay</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status & Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-6 sm:mb-8 hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Current Status</p>
              {getStatusBadge(order.status)}
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Grand Total</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[rgb(0,173,181)]">
                ₹{order.pricing?.total?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Items</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{order.items?.length || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Guest(s)</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{order.guestCount || 1}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Order Type</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize">{order.orderType}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 overflow-hidden mb-6 sm:mb-8">
          <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Order Items
              </h3>
              {/* <button
                onClick={() => setShowAddItems(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 text-sm font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                <ShoppingCart className="h-4 w-4" />
                Add More Items
              </button> */}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      {item.name}
                      {item.variant && <span className="text-xs sm:text-sm text-gray-500"> ({item.variant})</span>}
                    </div>
                    {item.notes && <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.notes}</p>}
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">₹{item.price.toLocaleString()} each</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    ₹{(item.quantity * item.price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Item</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Qty</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                        {item.variant && <span className="text-sm text-gray-500"> ({item.variant})</span>}
                      </div>
                      {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                      ₹{(item.quantity * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 sm:p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{order.pricing?.subtotal?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Tax</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{order.pricing?.tax?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-[rgb(0,173,181)]">₹{order.pricing?.total?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Items Modal (simple overlay) */}
        {showAddItems && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)]">
                <h3 className="text-lg sm:text-xl font-bold text-white">Add More Items</h3>
                <button 
                  onClick={() => setShowAddItems(false)} 
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MenuSection onItemAdded={() => {
                  setShowAddItems(false)
                  fetchOrder() // refresh order
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && (
          <PaymentModal
            order={order}
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  )
}

// Status Badge Helper (reused from running orders)
function getStatusBadge(status) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    paid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}



export default function CashierOrderDetailPage() {
  return (
    <OrderProvider>          
      <OrderDetailContent />
    </OrderProvider>
  )
}