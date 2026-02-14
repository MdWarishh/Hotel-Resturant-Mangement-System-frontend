// frontend/src/app/allinone/[hotelCode]/track/[ordernumber]/page.js

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { trackOrder, formatPrice } from '@/services/allinonApi';
import Link from 'next/link';
import Image from 'next/image';
import { io } from 'socket.io-client';

export default function OrderTrackingPage({ params }) {
  const router = useRouter();

  // ✅ Next.js 15 fix: use(params) se unwrap karo
  // ⚠️ Folder names se EXACTLY match karo:
  // [hotelCode] → hotelCode, [ordernumber] → ordernumber (lowercase n)
  const { hotelCode, ordernumber } = use(params);
  const hotelcode = hotelCode;     // alias - links mein use hoga
  const orderNumber = ordernumber; // alias - baaki code same rahega

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // ✅ Socket.io connection
  useEffect(() => {
    if (!orderNumber || !hotelcode) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const newSocket = io(`${socketUrl}/allinone`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Public socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join:order', orderNumber);
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

    return () => {
      newSocket.emit('leave:order', orderNumber);
      newSocket.close();
    };
  }, [orderNumber, hotelcode]);

  // ✅ Socket order status listener
  useEffect(() => {
    if (!socket || !orderData) return;

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder.orderNumber === orderNumber) {
        console.log('🔔 Order status updated:', updatedOrder.status);
        setOrderData(prevData => ({
          ...prevData,
          status: updatedOrder.status,
          timestamps: updatedOrder.timestamps || prevData.timestamps,
        }));
        setLastUpdated(new Date());

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Status Updated', {
            body: `Your order is now ${updatedOrder.status}`,
            icon: '/favicon.ico',
          });
        }
      }
    };

    socket.on('order:status-updated', handleOrderUpdate);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:confirmed', handleOrderUpdate);
    socket.on('order:preparing', handleOrderUpdate);
    socket.on('order:ready', handleOrderUpdate);
    socket.on('order:served', handleOrderUpdate);

    return () => {
      socket.off('order:status-updated', handleOrderUpdate);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:confirmed', handleOrderUpdate);
      socket.off('order:preparing', handleOrderUpdate);
      socket.off('order:ready', handleOrderUpdate);
      socket.off('order:served', handleOrderUpdate);
    };
  }, [socket, orderData, orderNumber]);

  // ✅ Fetch order on mount
  useEffect(() => {
    if (!orderNumber || !hotelcode) {
      setError('Invalid order details');
      setLoading(false);
      return;
    }

    fetchOrderDetails();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [orderNumber, hotelcode]);

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      console.log('🔍 Fetching order:', hotelcode, orderNumber);
      const response = await trackOrder(hotelcode, orderNumber);

      if (response && response.order) {
        setOrderData(response.order);
      } else {
        throw new Error('Invalid order data received');
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Error fetching order:', err);
      if (!silent) {
        setError(err.message || 'Failed to load order details');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Order status steps
  const getStatusSteps = () => {
    const orderType = orderData?.orderType?.toLowerCase() || orderData?.type?.toLowerCase();

    if (orderType === 'delivery') {
      const steps = [
        { key: 'pending', label: 'Order Placed', icon: '📝' },
        { key: 'confirmed', label: 'Confirmed', icon: '✅' },
        { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
        { key: 'ready', label: 'Ready', icon: '🔔' },
      ];
      const statusOrder = ['pending', 'confirmed', 'preparing', 'ready'];
      const currentIndex = statusOrder.indexOf(orderData?.status?.toLowerCase());
      return steps.map((step, index) => ({
        ...step,
        completed: index <= currentIndex,
        active: index === currentIndex,
      }));
    } else {
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
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {/* ✅ Fixed: hotelcode (lowercase) use karo */}
          <Link href={`/allinone/${hotelcode}`}>
            <button className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
              Back to Menu
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">No order data available</p>
          <Link href={`/allinone/${hotelcode}`} className="mt-4 inline-block">
            <button className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
              Back to Menu
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const isCancelled = orderData.status?.toLowerCase() === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* ✅ Fixed: hotelcode (lowercase) use karo */}
          <Link href={`/allinone/${hotelcode}`}>
            <button className="text-black p-2 hover:bg-gray-500 rounded-lg transition-colors bg-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
          <button
            onClick={() => fetchOrderDetails(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pb-8">
        {/* Connection Status */}
        {isConnected && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-800 font-medium">Live tracking active</span>
          </div>
        )}

        {/* Order Number Card */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <p className="text-orange-600 text-sm mb-2">Order Number</p>
          <p className="text-black text-3xl font-bold tracking-wider">{orderNumber}</p>
          <p className="text-orange-600 text-sm mt-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Order Status Timeline */}
        {!isCancelled ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Status</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                orderData.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                orderData.status?.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                orderData.status?.toLowerCase() === 'preparing' ? 'bg-orange-100 text-orange-800' :
                orderData.status?.toLowerCase() === 'ready' ? 'bg-green-100 text-green-800' :
                orderData.status?.toLowerCase() === 'served' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {orderData.status?.toUpperCase() || 'N/A'}
              </span>
            </div>

            {/* Desktop Timeline - Horizontal */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-orange-600 transition-all duration-500"
                    style={{
                      width: `${(statusSteps.filter(s => s.completed).length - 1) / (statusSteps.length - 1) * 100}%`
                    }}
                  />
                </div>
                <div className="relative flex justify-between">
                  {statusSteps.map((step) => (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 ${
                        step.completed ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'
                      } ${step.active ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}>
                        {step.icon}
                      </div>
                      <p className={`text-sm font-semibold text-center ${
                        step.completed ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.active && (
                        <p className="text-xs text-orange-600 mt-1 animate-pulse">In Progress</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Timeline - Vertical */}
            <div className="md:hidden space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="relative flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                    step.completed ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'
                  } ${step.active ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-sm text-orange-600 mt-1 animate-pulse">In Progress...</p>
                    )}
                  </div>
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
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Order Type</span>
              <span className="font-semibold text-gray-900 capitalize">
                {(orderData.orderType || orderData.type || 'N/A').replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Customer</span>
              <span className="font-semibold text-gray-900">{orderData.customer?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Phone</span>
              <span className="font-semibold text-gray-900">{orderData.customer?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Placed At</span>
              <span className="font-semibold text-gray-900">
                {orderData.timestamps?.placed
                  ? new Date(orderData.timestamps.placed).toLocaleString()
                  : orderData.createdAt
                  ? new Date(orderData.createdAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Items</h3>
          <div className="space-y-4">
            {orderData.items?.map((item, index) => (
              <div key={index} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {item.menuItem?.images?.[0] ? (
                    <Image
                      src={item.menuItem.images[0]}
                      alt={item.name || 'Item'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                      <span className="text-xl">🍽️</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {item.menuItem?.name || item.name || 'Item'}
                  </h4>
                  {item.variant && <p className="text-sm text-gray-600">{item.variant}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                    <span className="text-sm font-medium text-gray-900">{formatPrice(item.price)} each</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">
                    {formatPrice(item.subtotal || (item.price * item.quantity))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-black font-semibold">
                {formatPrice(orderData.pricing?.subtotal || orderData.subtotal || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (5%)</span>
              <span className="text-black font-semibold">
                {formatPrice(orderData.pricing?.tax || orderData.tax || 0)}
              </span>
            </div>
            <div className="text-black flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
              <span>Total</span>
              <span className="text-orange-600">
                {formatPrice(orderData.pricing?.total || orderData.total || orderData.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          {/* ✅ Fixed: hotelcode (lowercase) use karo */}
          <Link href={`/allinone/${hotelcode}`}>
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
              <p className="font-semibold text-black mb-1">Need Help?</p>
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