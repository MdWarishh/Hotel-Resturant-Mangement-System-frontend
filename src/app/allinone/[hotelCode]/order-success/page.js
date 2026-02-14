// frontend/app/public/[hotelCode]/order-success/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { trackOrder, formatPrice } from '@/services/allinonApi';
import Image from 'next/image';
import FeedbackModal from '@/components/allinone/FeedbackModal';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelCode = params.hotelCode;
  const orderNumber = searchParams.get('orderNumber');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Inside component, add state
const [showFeedback, setShowFeedback] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      router.push(`/allinone/${hotelCode}`);
      return;
    }
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await trackOrder(hotelCode, orderNumber);
      setOrder(response.data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOrderTypeLabel = (type) => {
    const labels = {
      'dine-in': 'Dine-in',
      'room-service': 'Room Service',
      'takeaway': 'Takeaway',
      'delivery': 'Delivery',
    };
    return labels[type] || type;
  };

  const getOrderTypeIcon = (type) => {
    const icons = {
      'dine-in': '🍽️',
      'room-service': '🛎️',
      'takeaway': '🥡',
      'delivery': '🚚',
    };
    return icons[type] || '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => router.push(`/allinone/${hotelCode}`)}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Animation Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Success Icon with Animation */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full animate-bounce">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-orange-600 text-3xl sm:text-4xl font-bold mb-2">Order Placed Successfully! 🎉</h1>
          <p className="text-green-600 text-lg">Thank you for your order</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Number Card - Most Important */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-500 p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Your Order Number</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-600 font-mono">
                {orderNumber}
              </h2>
              <button
                onClick={copyOrderNumber}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                title="Copy order number"
              >
                {copied ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-yellow-800">Save this order number!</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You'll need it to track your order. Take a screenshot or copy it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status</h3>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pending Confirmation</p>
                  <p className="text-sm text-gray-600">
                    Your order is waiting for restaurant approval
                  </p>
                </div>
              </div>

              {order.estimatedPreparationTime && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Estimated preparation: <strong>{order.estimatedPreparationTime} mins</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Type & Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
              
              <div className="space-y-3">
                {/* Order Type */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <span className="text-2xl">{getOrderTypeIcon(order.orderType)}</span>
                  <div>
                    <p className="text-sm text-gray-600">Order Type</p>
                    <p className="font-semibold text-gray-900">{getOrderTypeLabel(order.orderType)}</p>
                  </div>
                </div>

                {/* Table/Room Number */}
                {order.tableNumber && (
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <span className="text-2xl">🪑</span>
                    <div>
                      <p className="text-sm text-gray-600">Table Number</p>
                      <p className="font-semibold text-gray-900">{order.tableNumber}</p>
                    </div>
                  </div>
                )}

                {order.roomNumber && (
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <span className="text-2xl">🚪</span>
                    <div>
                      <p className="text-sm text-gray-600">Room Number</p>
                      <p className="font-semibold text-gray-900">{order.roomNumber}</p>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="font-semibold text-gray-900">{order.customer.name}</p>
                    <p className="text-sm text-gray-600">{order.customer.phone}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.customer.address && (
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
                      <p className="font-semibold text-gray-900">{order.customer.address}</p>
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-sm text-gray-600">Special Instructions</p>
                      <p className="font-semibold text-gray-900">{order.specialInstructions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
  onClick={() => {
    setSelectedItem(order.items[0].menuItem); // First item
    setShowFeedback(true);
  }}
  className="px-6 py-3 bg-blue-600 text-white rounded-lg"
>
  ⭐ Rate Your Food
</button>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {item.menuItem?.images && item.menuItem.images[0] ? (
                        <Image 
                          src={item.menuItem.images[0]} 
                          alt={item.menuItem?.name || 'Item'} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.menuItem?.name || 'Item'}
                          </h4>
                          {item.variant && (
                            <p className="text-sm text-gray-600">{item.variant}</p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Price Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bill Summary</h3>
              
              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="font-semibold">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/allinone/${hotelCode}/track/${orderNumber}`)}
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Track Your Order
                </button>

                <button
                  onClick={() => router.push(`/allinone/${hotelCode}`)}
                  className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Order More Items
                </button>
              </div>

              {/* Payment Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Payment: <strong>Cash on Delivery</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
              <p className="text-sm text-blue-800">
                If you have any questions about your order, please contact the restaurant directly or use the track order feature to see real-time updates.
              </p>
            </div>
          </div>
        </div>

        <FeedbackModal
  isOpen={showFeedback}
  onClose={() => setShowFeedback(false)}
  hotelCode={hotelCode}
  menuItem={selectedItem}
  customer={order.customer}
  orderNumber={orderNumber}
/>
      </div>
    </div>
  );
}