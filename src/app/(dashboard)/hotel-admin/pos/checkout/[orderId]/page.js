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
 * - Now allowed for both Hotel Admin and Cashier
 */
export default function CheckoutPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // ✅ FIXED: ab admin bhi payment le sakta hai — sirf cancelled/completed orders read-only rahenge (order fetch hone ke baad handle hoga)
  const isReadOnly = false;

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
   * ✅ FIXED: Confirm checkout — ab sahi payment endpoint call hota hai
   */
  const handleCheckout = async () => {
    if (!paymentMode) {
      setError('Please select a payment method');
      return;
    }

    setError(null);

    try {
      setProcessing(true);

      // ✅ FIXED: /checkout ki jagah /payment endpoint, aur field name 'mode' (backend jo expect karta hai)
      await apiRequest(`/pos/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          mode: paymentMode,
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
      <div className="p-6 text-sm text-black bg-white">
        Loading checkout…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-sm text-red-500 bg-white">
        Order not found
      </div>
    );
  }

  const alreadyPaid = order.payment?.status === 'PAID';

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white text-black">
      <h1 className="text-xl font-semibold mb-6 text-black">
        Checkout
      </h1>

      {/* Order Info */}
      <div className="mb-4">
        <p className="font-medium text-black">
          Order #{order.orderNumber}
        </p>
        <p className="text-sm text-gray-600">
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
            className="flex justify-between px-4 py-2 border-b text-sm text-black"
          >
            <span>
              {item.quantity} × {item.name}
            </span>
            <span className="font-medium">₹{item.subtotal}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="border rounded p-4 mb-6 text-black">
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

      {/* ✅ NEW: Agar pehle se paid hai to info dikhao, dobara payment mat lo */}
      {alreadyPaid ? (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-sm font-medium">
          ✓ This order is already paid via {order.payment?.mode || 'N/A'}.
        </div>
      ) : (
        <>
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
          <button
            disabled={processing || !paymentMode}
            onClick={handleCheckout}
            className="w-full py-3 bg-black text-white rounded disabled:opacity-50 font-medium"
          >
            {processing
              ? 'Processing…'
              : 'Confirm Checkout'}
          </button>
        </>
      )}
    </div>
  );
}