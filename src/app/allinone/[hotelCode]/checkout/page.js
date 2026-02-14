// frontend/app/public/[hotelCode]/checkout/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { 
  placePublicOrder, 
  getAvailableTables, 
  getAvailableRooms,
  formatPrice 
} from '@/services/allinonApi';
import Image from 'next/image';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const hotelCode = params.hotelCode;
  
  const { cart, getCartTotals, clearCart } = useCart();
  const { subtotal, tax, total } = getCartTotals();

  // Form State
  const [orderType, setOrderType] = useState('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // UI State
  const [availableTables, setAvailableTables] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState('');
  
  // 🔥 NEW: Flag to prevent redirect after order is placed
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Redirect if cart is empty (BUT NOT if order was just placed)
  useEffect(() => {
    if (cart.length === 0 && !isOrderPlaced) {
      router.push(`/allinone/${hotelCode}`);
    }
  }, [cart, hotelCode, router, isOrderPlaced]);

  // Fetch tables when dine-in is selected
  useEffect(() => {
    if (orderType === 'dine-in') {
      fetchTables();
    }
  }, [orderType]);

  // Fetch rooms when room-service is selected
  useEffect(() => {
    if (orderType === 'room-service') {
      fetchRooms();
    }
  }, [orderType]);

  const fetchTables = async () => {
    try {
      setLoadingResources(true);
      const response = await getAvailableTables(hotelCode);
      setAvailableTables(response.data.tables || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoadingResources(true);
      const response = await getAvailableRooms(hotelCode);
      setAvailableRooms(response.data.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // Form validation
  const validateForm = () => {
    if (!customerName.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    if (!/^[0-9]{10}$/.test(customerPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a table');
      return false;
    }

    if (orderType === 'room-service' && !selectedRoom) {
      setError('Please select a room');
      return false;
    }

    if (orderType === 'delivery' && (!customerAddress.trim() || customerAddress.trim().length < 10)) {
      setError('Please enter a valid delivery address (min 10 characters)');
      return false;
    }

    return true;
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        orderType,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
          address: orderType === 'delivery' ? customerAddress.trim() : undefined,
        },
        items: cart.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
          variant: item.variant || undefined,
        })),
        specialInstructions: specialInstructions.trim() || undefined,
      };

      // Add table/room based on order type
      if (orderType === 'dine-in') {
        orderData.tableNumber = selectedTable;
      } else if (orderType === 'room-service') {
        orderData.roomNumber = selectedRoom;
      }

      // Place order
      const response = await placePublicOrder(hotelCode, orderData);
      
      // 🔥 IMPORTANT: Set flag BEFORE clearing cart to prevent redirect
      setIsOrderPlaced(true);
      
      // Clear cart
      clearCart();

      // Navigate to success page with order number
      const orderNumber = response.data.order.orderNumber;
      router.push(`/allinone/${hotelCode}/order-success?orderNumber=${orderNumber}`);

    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setIsOrderPlaced(false); // Reset flag on error
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !isOrderPlaced) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-black p-2 hover:bg-gray-500 rounded-lg transition-colors bg-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600">Complete your order</p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Order Type</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'dine-in', label: 'Dine-in', icon: '🍽️' },
                  { value: 'room-service', label: 'Room Service', icon: '🛎️' },
                  { value: 'takeaway', label: 'Takeaway', icon: '🥡' },
                  { value: 'delivery', label: 'Delivery', icon: '🚚' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setOrderType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      orderType === type.value
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className={`font-semibold text-sm ${
                      orderType === type.value ? 'text-orange-600' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h2>
              
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-gray-400 text-sm">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Delivery Address (Only for Delivery) */}
                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter complete delivery address"
                      rows={3}
                      className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Table Selection (Dine-in) */}
            {orderType === 'dine-in' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Select Table <span className="text-red-500">*</span>
                </h2>
                
                {loadingResources ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading tables...</p>
                  </div>
                ) : availableTables.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableTables.map((table) => (
                      <button
                        key={table._id}
                        onClick={() => setSelectedTable(table.tableNumber)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTable === table.tableNumber
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">🪑</div>
                        <div className={`font-semibold text-sm ${
                          selectedTable === table.tableNumber ? 'text-orange-600' : 'text-gray-700'
                        }`}>
                          {table.tableNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {table.capacity} seats
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No tables available at the moment</p>
                  </div>
                )}
              </div>
            )}

            {/* Room Selection (Room Service) */}
            {orderType === 'room-service' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Select Room <span className="text-red-500">*</span>
                </h2>
                
                {loadingResources ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading rooms...</p>
                  </div>
                ) : availableRooms.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableRooms.map((room) => (
                      <button
                        key={room._id}
                        onClick={() => setSelectedRoom(room.roomNumber)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedRoom === room.roomNumber
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">🚪</div>
                        <div className={`font-semibold ${
                          selectedRoom === room.roomNumber ? 'text-orange-600' : 'text-gray-700'
                        }`}>
                          {room.roomNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Floor {room.floor}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No occupied rooms available for room service</p>
                  </div>
                )}
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Special Instructions <span className="text-gray-400 text-sm">(Optional)</span>
              </h2>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests? (e.g., extra spicy, no onions, etc.)"
                rows={3}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item._id}-${item.variant || 'default'}`} className="flex gap-3">
                    <div className="text-black relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {item.images && item.images[0] ? (
                        <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                          <span className="text-xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
                      {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                        <span className="text-sm font-semibold text-orange-600">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-black font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="text-black font-semibold">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 text-black">
                  <span>Total</span>
                  <span className="text-orange-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Payment: Cash on Delivery
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}