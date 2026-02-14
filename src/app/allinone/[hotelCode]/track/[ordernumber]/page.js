// frontend/app/public/[hotelCode]/track/[orderNumber]/page.js

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { trackOrder, formatPrice } from '@/services/publicApi';
import Link from 'next/link';
import Image from 'next/image';
import { io } from 'socket.io-client';

export default function OrderTrackingPage({ params }) {
  const router = useRouter();
  
  // ✅ Next.js 15: Unwrap params promise
  const { hotelCode, orderNumber } = use(params);

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🔥 Initialize Socket.io connection to PUBLIC namespace
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    // Create socket connection to PUBLIC namespace (NO authentication)
    const newSocket = io(`${socketUrl}/public`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Public socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Join room for this specific order
      if (orderNumber) {
        newSocket.emit('join:order', orderNumber);
        console.log(`📦 Joined order room: ${orderNumber}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Public socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (orderNumber) {
        newSocket.emit('leave:order', orderNumber);
      }
      newSocket.close();
    };
  }, [orderNumber]);

  // 🔥 Listen for order status updates via Socket.io
  useEffect(() => {
    if (!socket || !orderData) return;

    // Listen for order status updates
    const handleOrderUpdate = (updatedOrder) => {
      // Check if this is our order
      if (updatedOrder.orderNumber === orderNumber) {
        console.log('🔔 Order status updated via socket:', updatedOrder.status);
        
        // Update order data
        setOrderData(prevData => ({
          ...prevData,
          status: updatedOrder.status,
          timestamps: updatedOrder.timestamps || prevData.timestamps,
        }));
        
        setLastUpdated(new Date());

        // Show browser notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Status Updated', {
            body: `Your order is now ${updatedOrder.status}`,
            icon: '/favicon.ico',
          });
        }
      }
    };

    // Listen to multiple events that might update the order
    socket.on('order:status-updated', handleOrderUpdate);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:confirmed', handleOrderUpdate);
    socket.on('order:preparing', handleOrderUpdate);
    socket.on('order:ready', handleOrderUpdate);
    socket.on('order:served', handleOrderUpdate);

    // Cleanup listeners
    return () => {
      socket.off('order:status-updated', handleOrderUpdate);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:confirmed', handleOrderUpdate);
      socket.off('order:preparing', handleOrderUpdate);
      socket.off('order:ready', handleOrderUpdate);
      socket.off('order:served', handleOrderUpdate);
    };
  }, [socket, orderData, orderNumber]);

  // Fetch initial order details
  useEffect(() => {
    fetchOrderDetails();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      const response = await trackOrder(hotelCode, orderNumber);
      setOrderData(response.data.order);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load order details');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Order status timeline steps
  const getStatusSteps = () => {
    const orderType = orderData?.orderType?.toLowerCase();
    
    // Different flow for delivery orders
    if (orderType === 'delivery') {
      const steps = [
        { key: 'pending', label: 'Order Placed', icon: '📝' },
        { key: 'confirmed', label: 'Confirmed', icon: '✅' },
        { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
        { key: 'ready', label: 'Ready', icon: '🔔' },
        // For delivery, stop at ready - no "served" status
      ];

      const statusOrder = ['pending', 'confirmed', 'preparing', 'ready'];
      const currentIndex = statusOrder.indexOf(orderData?.status?.toLowerCase());

      return steps.map((step, index) => ({
        ...step,
        completed: index <= currentIndex,
        active: index === currentIndex,
      }));
    } else {
      // For dine-in, takeaway, room-service
      const steps = [
        { key: 'pending', label: 'Order Placed', icon: '📝' },
        { key: 'confirmed', label: 'Confirmed', icon: '✅' },
        { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
        { key: 'ready', label: 'Ready', icon: '🔔' },
        { key: 'served', label: 'Served', icon: '🎉' },
      ];

      const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
      const currentIndex = statusOrder.indexOf(orderData?.status?.toLowerCase());

      return steps.map((step, index) => ({
        ...step,
        completed: index <= currentIndex,
        active: index === currentIndex,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderDetails()}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Retry
            </button>
            <button
              onClick={() => router.push(`/public/${hotelCode}`)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const isCancelled = orderData?.status?.toLowerCase() === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/public/${hotelCode}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
                <p className="text-sm text-gray-600 font-mono">{orderNumber}</p>
              </div>
            </div>

            {/* Connection Status & Refresh Button */}
            <div className="flex items-center gap-2">
              {/* Real-time Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs font-medium text-gray-700">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={() => fetchOrderDetails()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh status"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mb-6">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {isConnected && (
            <span className="ml-2 text-green-600 font-medium">• Real-time updates enabled ✓</span>
          )}
        </div>

        {/* Status Timeline */}
        {!isCancelled ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Order Status</h2>
            
            {/* Desktop Timeline - Horizontal */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute left-0 right-0 top-8 h-1 bg-gray-200">
                  <div
                    className="h-full bg-orange-600 transition-all duration-500"
                    style={{
                      width: `${(statusSteps.filter(s => s.completed).length - 1) * (100 / (statusSteps.length - 1))}%`,
                    }}
                  />
                </div>

                {/* Steps */}
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    {/* Icon Circle */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                        step.completed
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${step.active ? 'ring-4 ring-orange-200 scale-110 animate-pulse' : ''}`}
                    >
                      {step.icon}
                    </div>
                    {/* Label */}
                    <p
                      className={`mt-3 text-sm font-semibold text-center ${
                        step.completed ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-xs text-orange-600 mt-1 animate-pulse">In Progress...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Timeline - Vertical */}
            <div className="md:hidden space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                      step.completed
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${step.active ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}
                  >
                    {step.icon}
                  </div>
                  
                  {/* Label */}
                  <div className="flex-1 pt-2">
                    <p
                      className={`font-semibold ${
                        step.completed ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-sm text-orange-600 mt-1 animate-pulse">
                        In Progress...
                      </p>
                    )}
                  </div>

                  {/* Connecting Line */}
                  {index < statusSteps.length - 1 && (
                    <div className="absolute left-6 mt-12 w-0.5 h-8 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Estimated Time */}
            <div className="mt-8 text-center bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-1">Estimated Time</p>
              <p className="text-xl font-bold text-orange-600">
                {orderData.estimatedTime || '15-30 minutes'}
              </p>
            </div>
          </div>
        ) : (
          /* Cancelled Status */
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Order Cancelled</h3>
            <p className="text-gray-600">This order has been cancelled</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
          
          <div className="space-y-3">
            {/* Order Type */}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Order Type</span>
              <span className="font-semibold text-gray-900 capitalize">
                {orderData.orderType.replace('-', ' ')}
              </span>
            </div>

            {/* Customer */}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Customer</span>
              <span className="font-semibold text-gray-900">
                {orderData.customer.name}
              </span>
            </div>

            {/* Phone */}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Phone</span>
              <span className="font-semibold text-gray-900">
                {orderData.customer.phone}
              </span>
            </div>

            {/* Order Placed */}
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Placed At</span>
              <span className="font-semibold text-gray-900">
                {new Date(orderData.timestamps.placed).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Items</h3>
          
          <div className="space-y-4">
            {orderData.items.map((item, index) => (
              <div key={index} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                {/* Item Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {item.menuItem?.images?.[0] ? (
                    <Image
                      src={item.menuItem.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                      <span className="text-xl">🍽️</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  {item.variant && (
                    <p className="text-sm text-gray-600">{item.variant}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price)} each
                    </span>
                  </div>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="font-bold text-orange-600">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">
                {formatPrice(orderData.pricing.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (5%)</span>
              <span className="font-semibold">
                {formatPrice(orderData.pricing.tax)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
              <span>Total</span>
              <span className="text-orange-600">
                {formatPrice(orderData.pricing.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Link href={`/public/${hotelCode}`}>
            <button className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
              Order More Items
            </button>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-1">Need Help?</p>
              <p className="text-sm text-blue-800">
                If you have any questions about your order, please contact the restaurant staff 
                or show them your order number: <strong>{orderNumber}</strong>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}