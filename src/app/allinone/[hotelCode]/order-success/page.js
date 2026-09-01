// frontend/app/public/[hotelCode]/order-success/page.js

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { trackOrder, formatPrice } from '@/services/allinonApi';
import Image from 'next/image';
import FeedbackModal from '@/components/allinone/FeedbackModal';

// ✅ NEW — hotel ka WhatsApp/call number (backup contact)
const SUPPORT_PHONE_DISPLAY = '9451236079';
const SUPPORT_PHONE_WHATSAPP = '919451236079'; // country code ke saath, WhatsApp link ke liye zaroori

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 🔥 FIX: Calculate totals from items
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });

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
      
      // trackOrder returns data.data — so response = { order: {...} }
      const orderData = response?.order 
        || response?.data?.order 
        || response?.data 
        || response;

      if (!orderData || !orderData.orderNumber) {
        throw new Error('Order data not found');
      }

      setOrder(orderData);
      calculateTotals(orderData);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW FUNCTION: Calculate totals from items
  const calculateTotals = (orderData) => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return;
    }

    // Calculate subtotal from items
    const subtotal = orderData.items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);

    // Calculate tax (5% GST)
    const tax = subtotal * 0.05;

    // Calculate total
    const total = subtotal + tax;

    setCalculatedTotals({
      subtotal: subtotal,
      tax: tax,
      total: total
    });
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

  // ✅ NEW — WhatsApp pe pre-filled message banane wala function
  const buildWhatsAppMessage = () => {
    if (!order) return '';

    const lines = [];
    lines.push(`🔔 *New Order Confirmation*`);
    lines.push(`Order No: *${order.orderNumber}*`);
    lines.push(`Type: ${getOrderTypeLabel(order.orderType)}`);

    if (order.tableNumber) lines.push(`Table: ${order.tableNumber}`);
    if (order.roomNumber) lines.push(`Room: ${order.roomNumber}`);

    lines.push('');
    lines.push(`Name: ${order.customer?.name || '-'}`);
    lines.push(`Phone: ${order.customer?.phone || '-'}`);
    if (order.customer?.address) lines.push(`Address: ${order.customer.address}`);

    lines.push('');
    lines.push('Items:');
    (order.items || []).forEach((item) => {
      const name = item.menuItem?.name || item.name || 'Item';
      lines.push(`- ${item.quantity} x ${name}${item.variant ? ` (${item.variant})` : ''}`);
    });

    if (order.specialInstructions) {
      lines.push('');
      lines.push(`Note: ${order.specialInstructions}`);
    }

    lines.push('');
    lines.push(`Total: ${formatPrice(order.total || order.pricing?.total || calculatedTotals.total)}`);
    lines.push('');
    lines.push('Please confirm my order, thank you!');

    return lines.join('\n');
  };

  const whatsappLink = order
    ? `https://wa.me/${SUPPORT_PHONE_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage())}`
    : '#';

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

  // 🔥 FIX: Use backend values if available, otherwise use calculated values
  const subtotal = order.subtotal || order.pricing?.subtotal || calculatedTotals.subtotal;
  const tax = order.tax || order.pricing?.tax || calculatedTotals.tax;
  const total = order.total || order.totalAmount || order.pricing?.total || calculatedTotals.total;

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
        {/* Order Number Card */}
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

        {/* ✅ NEW — WhatsApp backup confirmation card */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-3xl flex-shrink-0">📵</div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Restaurant busy or no update in 15 minutes?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Agar 15 minute ke andar order confirm/update na ho, to hotel band ho sakta hai ya busy ho sakta hai.
                Neeche diye button se seedha WhatsApp pe apna order bhej do — sab detail pehle se type ho jaayegi,
                bas <strong>Send</strong> dabana hai.
              </p>
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠️ Agar aap WhatsApp par confirm nahi karenge, to order thoda late ho sakta hai.
              </p>
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.9.53 3.68 1.45 5.19L2 22l4.94-1.42C8.4 21.47 10.15 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.69 0-3.27-.47-4.63-1.28l-.33-.19-3.44.99.99-3.42-.21-.35A8.17 8.17 0 013.8 12c0-4.53 3.68-8.2 8.2-8.2 4.53 0 8.2 3.68 8.2 8.2 0 4.53-3.68 8.2-8.2 8.2z"/>
            </svg>
            Send Order Details on WhatsApp
          </a>

          <p className="text-center text-sm text-gray-500 mt-3">
            Ya seedha call karo: <a href={`tel:+91${SUPPORT_PHONE_DISPLAY}`} className="font-semibold text-green-700">+91 {SUPPORT_PHONE_DISPLAY}</a>
          </p>
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
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.status?.replace('-', ' ') || 'Pending'}
                  </p>
                  <p className="text-sm text-gray-600">Your order is being prepared</p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Information</h3>
              
              <div className="space-y-3">
                {/* Order Type */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getOrderTypeIcon(order.type)}</span>
                  <div>
                    <p className="text-sm text-gray-600">Order Type</p>
                    <p className="font-semibold text-gray-900">{getOrderTypeLabel(order.orderType)}</p>
                  </div>
                </div>

                {/* Table/Room Number */}
                {(order.tableNumber || order.roomNumber) && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    <span className="text-2xl">
                      {order.type === 'room-service' ? '🏨' : '🪑'}
                    </span>
                    <div>
                      <p className="text-sm text-gray-600">
                        {order.type === 'room-service' ? 'Room Number' : 'Table Number'}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {order.roomNumber || order.tableNumber}
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
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

            {/* Feedback Button */}
            {order.items && order.items.length > 0 && (
              <button
                onClick={() => {
                  setSelectedItem(order.items[0].menuItem);
                  setShowFeedback(true);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <span>⭐</span>
                Rate Your Food
              </button>
            )}

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
                            {item.menuItem?.name || item.name || 'Item'}
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
                            {formatPrice((item.price || 0) * (item.quantity || 0))}
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
                  <span className=" text-black font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="text-black font-semibold">{formatPrice(tax)}</span>
                </div>
                {(order.pricing?.deliveryCharge > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charge</span>
                    <span className="text-black font-semibold">{formatPrice(order.pricing.deliveryCharge)}</span>
                  </div>
                )}
                <div className="text-black flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatPrice(total)}</span>
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
                If you have any questions about your order, please contact the restaurant directly at{' '}
                <strong>+91 {SUPPORT_PHONE_DISPLAY}</strong> or use the track order feature to see real-time updates.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          hotelCode={hotelCode}
          menuItem={selectedItem}
          customer={order?.customer}
          orderNumber={orderNumber}
        />
      </div>
    </div>
  );
}