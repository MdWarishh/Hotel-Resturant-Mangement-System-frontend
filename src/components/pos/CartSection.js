'use client';

import { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import SubmitOrder from './SubmitOrder';
import PaymentModal from '@/components/cashier/PaymentModal';

/**
 * CartSection
 *
 * Behaviour:
 * - Hotel Admin  → Direct order submit
 * - Cashier      → Payment modal → submit
 */
export default function CartSection({
  onOrderSuccess,
  requirePayment = false,
}) {
  const { order } = useOrder();

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);

  if (!order || order.items.length === 0) return null;

  const totalAmount = order.pricing?.total || 0;

  /* ===============================
     HOTEL ADMIN FLOW (NO PAYMENT)
     =============================== */
  if (!requirePayment) {
    return (
      <SubmitOrder
        onSuccess={() => {
          if (onOrderSuccess) onOrderSuccess();
        }}
      />
    );
  }

  /* ===============================
     CASHIER FLOW (PAYMENT REQUIRED)
     =============================== */
  return (
    <>
      {/* PLACE ORDER */}
      <button
        onClick={() => setShowPayment(true)}
        className="mt-4 w-full rounded-lg bg-[rgb(0,173,181)] py-3 font-medium text-white"
      >
        Place Order
      </button>

      {/* PAYMENT MODAL */}
      <PaymentModal
        open={showPayment}
        totalAmount={totalAmount}
        onClose={() => setShowPayment(false)}
        onConfirm={(mode) => {
          setPaymentMode(mode);
          setShowPayment(false);
        }}
      />

      {/* SUBMIT AFTER PAYMENT */}
      {paymentMode && (
        <SubmitOrder
          paymentMode={paymentMode}
          onSuccess={() => {
            setPaymentMode(null);
            if (onOrderSuccess) onOrderSuccess();
          }}
        />
      )}
    </>
  );
}