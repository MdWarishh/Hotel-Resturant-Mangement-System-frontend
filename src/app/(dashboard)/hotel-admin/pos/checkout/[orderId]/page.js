'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import PaymentSection from './PaymentSection';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * POS Checkout Screen
 * - Payment mandatory
 * - Inventory deduction trigger
 */
export default function CheckoutPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const isReadOnly = user?.role === USER_ROLES.HOTEL_ADMIN;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null);

  /**
   * Fetch order details
   */
  const fetchOrder = async () => {
    try {
      const res = await apiRequest(`/pos/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  /**
   * Confirm checkout
   */
  const handleCheckout = async () => {
    if (!paymentMode) {
      setError('Please select a payment method');
      return;
    }

    setError(null);

    try {
      setProcessing(true);

      await apiRequest(`/pos/orders/${orderId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMode,
        }),
      });

      router.replace('/hotel-admin/pos/orders');
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading checkout…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-sm text-red-500">
        Order not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">
        Checkout
      </h1>

      {/* Order Info */}
      <div className="mb-4">
        <p className="font-medium">
          Order #{order.orderNumber}
        </p>
        <p className="text-sm text-gray-500">
          {order.orderType === 'dine-in'
            ? `Table ${order.tableNumber}`
            : order.orderType}
        </p>
      </div>

      {/* Items */}
      <div className="border rounded mb-4">
        {order.items.map((item) => (
          <div
            key={item._id}
            className="flex justify-between px-4 py-2 border-b text-sm"
          >
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>₹{item.subtotal}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="border rounded p-4 mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Subtotal</span>
          <span>₹{order.pricing.subtotal}</span>
        </div>

        <div className="flex justify-between text-sm mb-1">
          <span>GST</span>
          <span>₹{order.pricing.tax}</span>
        </div>

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>₹{order.pricing.total}</span>
        </div>
      </div>

      {/* Payment */}
      <PaymentSection
        value={paymentMode}
        onChange={setPaymentMode}
        readOnly={isReadOnly}
      />

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 mb-3">
          {error}
        </p>
      )}

      {/* Confirm */}
      {!isReadOnly && (
        <button
          disabled={processing || !paymentMode}
          onClick={handleCheckout}
          className="w-full py-3 bg-black text-white rounded disabled:opacity-50"
        >
          {processing
            ? 'Processing…'
            : 'Confirm Checkout'}
        </button>
      )}
    </div>
  );
}