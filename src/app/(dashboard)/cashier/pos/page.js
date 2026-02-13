'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrder, OrderProvider } from '@/context/OrderContext'
import MenuSection from '../../hotel-admin/pos/orders/new/MenuSection'
import CartSection from '../../hotel-admin/pos/orders/new/CartSection'
import PaymentModal from '@/components/cashier/PaymentModal'
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Users, BedDouble, ShoppingCart, X } from 'lucide-react'

function NewOrderContent() {
  const { order, startOrder, resetOrder } = useOrder()
  const router = useRouter()

  const [orderType, setOrderType] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('') // 🔥 ADD THIS
  const [errors, setErrors] = useState({})
  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([]) // 🔥 ADD THIS
  const [loadingRooms, setLoadingRooms] = useState(false) // 🔥 ADD THIS
  const [showPayment, setShowPayment] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [showCart, setShowCart] = useState(false)

  // Socket for live table/order updates
  useEffect(() => {
    const socket = connectPOSSocket()

    socket.on('table:updated', () => {
      if (orderType === 'dine-in') fetchAvailableTables()
    })

    socket.on('room:updated', () => {
      if (orderType === 'room-service') fetchAvailableRooms()
    })

    socket.on('order:created', () => {
      // Optional: refresh stats if you show any
    })

    return () => disconnectPOSSocket()
  }, [orderType])

  // 🔥 Fetch available tables when dine-in is selected
  useEffect(() => {
    if (orderType === 'dine-in') {
      fetchAvailableTables()
    }
  }, [orderType])

  // 🔥 Fetch available rooms when room-service is selected
  useEffect(() => {
    if (orderType === 'room-service') {
      fetchAvailableRooms()
    }
  }, [orderType])

  const fetchAvailableTables = async () => {
    setLoadingTables(true)
    setErrors(prev => ({ ...prev, tables: null }))

    try {
      const res = await apiRequest('/tables')
      const tables = res.data?.tables || res.data || []
      setAvailableTables(tables.filter(t => t.status === 'available'))
    } catch (err) {
      setErrors(prev => ({ ...prev, tables: 'Failed to load available tables' }))
    } finally {
      setLoadingTables(false)
    }
  }

  // 🔥 NEW FUNCTION: Fetch available rooms
  const fetchAvailableRooms = async () => {
    setLoadingRooms(true)
    setErrors(prev => ({ ...prev, rooms: null }))

    try {
      const res = await apiRequest('/rooms')
      const rooms = res.data?.rooms || res.data || []
      // Only show occupied rooms for room service
      setAvailableRooms(rooms.filter(r => r.status === 'occupied'))
    } catch (err) {
      setErrors(prev => ({ ...prev, rooms: 'Failed to load available rooms' }))
    } finally {
      setLoadingRooms(false)
    }
  }

  const validateStart = () => {
    const newErrors = {}
    if (!orderType) newErrors.orderType = 'Please select order type'

    if (orderType === 'dine-in' && !tableNumber) {
      newErrors.tableNumber = 'Please select a table'
    }

    if (orderType === 'room-service' && !selectedRoomId) { // 🔥 CHANGED
      newErrors.roomNumber = 'Please select a room'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStartOrder = () => {
    if (!validateStart()) return

    startOrder({
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      room: orderType === 'room-service' ? selectedRoomId : undefined, // 🔥 CHANGED
    })
  }

  const handleOrderSuccess = (newOrder) => {
    setCreatedOrder(newOrder)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    resetOrder()
    setShowPayment(false)
    setCreatedOrder(null)
    router.push('/cashier')
  }

  // If no order started yet → show order type selection
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border-t-4 border-[rgb(0,173,181)]">
          <h2 className="text-gray-800 text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10">
            Start New Order
          </h2>

          <div className="text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <OrderTypeButton
              type="dine-in"
              label="Dine-In"
              icon={<Users className="h-8 w-8 sm:h-10 sm:w-10" />}
              active={orderType === 'dine-in'}
              onClick={() => setOrderType('dine-in')}
            />

            <OrderTypeButton
              type="takeaway"
              label="Takeaway"
              icon={<ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10" />}
              active={orderType === 'takeaway'}
              onClick={() => setOrderType('takeaway')}
            />

            <OrderTypeButton
              type="room-service"
              label="Room Service"
              icon={<BedDouble className="h-8 w-8 sm:h-10 sm:w-10" />}
              active={orderType === 'room-service'}
              onClick={() => setOrderType('room-service')}
            />
          </div>

          {errors.orderType && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <p className="text-red-700 font-medium">{errors.orderType}</p>
            </div>
          )}

          {/* 🔥 Dine-in table selection */}
          {orderType === 'dine-in' && (
            <div className="text-gray-800 mb-8 bg-gray-50 rounded-xl p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">Select Table</h3>
              {loadingTables ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-[rgb(0,173,181)]" />
                </div>
              ) : availableTables.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium">No tables available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                  {availableTables.map(table => (
                    <button
                      key={table._id}
                      onClick={() => setTableNumber(table.tableNumber)}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-center font-bold text-sm sm:text-base transition-all transform hover:scale-105 ${
                        tableNumber === table.tableNumber
                          ? 'bg-[rgb(0,173,181)] text-white border-[rgb(0,173,181)] shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[rgb(0,173,181)] hover:bg-gray-50'
                      }`}
                    >
                      {table.tableNumber}
                    </button>
                  ))}
                </div>
              )}
              {errors.tableNumber && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{errors.tableNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* 🔥 Room service selection - COMPLETELY REWRITTEN */}
          {orderType === 'room-service' && (
            <div className="text-gray-800 mb-8 bg-gray-50 rounded-xl p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">Select Room</h3>
              {loadingRooms ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-[rgb(0,173,181)]" />
                </div>
              ) : availableRooms.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No occupied rooms available</p>
                  <p className="text-gray-400 text-sm mt-1">Rooms must be checked-in for room service</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 max-h-64 overflow-y-auto p-1">
                  {availableRooms.map(room => (
                    <button
                      key={room._id}
                      onClick={() => {
                        setRoomNumber(room.roomNumber) // Display value
                        setSelectedRoomId(room._id)     // Backend value
                      }}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all transform hover:scale-105 ${
                        selectedRoomId === room._id
                          ? 'bg-[rgb(0,173,181)] text-white border-[rgb(0,173,181)] shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[rgb(0,173,181)] hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-lg">{room.roomNumber}</div>
                      <div className="text-[10px] uppercase text-gray-500 mt-1">
                        {room.type || 'Room'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {errors.roomNumber && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{errors.roomNumber}</p>
                </div>
              )}
            </div>
          )}

          {orderType && (
            <button
              onClick={handleStartOrder}
              className="w-full py-4 sm:py-5 bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)] text-white rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to Menu →
            </button>
          )}
        </div>
      </div>
    )
  }

  // Active order: show menu + cart
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50">
      {/* Menu - left side / full on mobile */}
      <div className="flex-1 overflow-y-auto bg-white">
        <MenuSection />
      </div>

      {/* Cart - right side on desktop / modal on mobile */}
      <div className="hidden lg:block lg:w-96 border-l-2 border-gray-200 bg-white overflow-y-auto shadow-xl">
        <CartSection
          onOrderSuccess={handleOrderSuccess}
          requirePayment={true}
        />
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-[rgb(0,173,181)] text-white p-4 rounded-full shadow-2xl hover:bg-[rgb(0,173,181)]/90 transition-all transform hover:scale-110 active:scale-95 z-40"
      >
        <ShoppingCart className="h-6 w-6" />
      </button>

      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-t-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b-2 border-gray-200 flex justify-between items-center bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,153,161)]">
              <h3 className="text-lg font-bold text-white">Your Cart</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartSection
                onOrderSuccess={(order) => {
                  setShowCart(false)
                  handleOrderSuccess(order)
                }}
                requirePayment={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && createdOrder && (
        <PaymentModal
          order={createdOrder}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

// Reusable Order Type Button
function OrderTypeButton({ type, label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 sm:gap-4 p-5 sm:p-6 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 ${
        active
          ? 'border-[rgb(0,173,181)] bg-gradient-to-br from-[rgb(0,173,181)]/10 to-[rgb(0,173,181)]/5 shadow-lg'
          : 'border-gray-300 hover:border-[rgb(0,173,181)] hover:bg-gray-50 shadow-md hover:shadow-lg'
      }`}
    >
      <div className={`p-3 sm:p-4 rounded-2xl transition-all ${active ? 'bg-[rgb(0,173,181)] text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>
        {icon}
      </div>
      <span className="font-bold text-sm sm:text-base text-gray-800">{label}</span>
    </button>
  )
}

export default function CashierNewOrderPage() {
  return (
    <OrderProvider>
      <NewOrderContent />
    </OrderProvider>
  )
}