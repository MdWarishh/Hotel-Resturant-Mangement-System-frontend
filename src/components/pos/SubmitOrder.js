'use client';

import { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { apiRequest } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function SubmitOrder({
  onSuccess,
  paymentMode = null, // CASH | UPI | CARD (optional)
}) {
  const { order, resetOrder } = useOrder();
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        room: order.room,
        booking: order.booking,
        customer: order.customer,
        items: order.items.map((item) => ({
          menuItem: item.menuItem,
          variant: item.variant,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        specialInstructions: order.specialInstructions || '',
      };

      // ✅ Attach payment ONLY if exists (cashier flow)
      if (paymentMode) {
        payload.payment = {
          mode: paymentMode, // CASH | UPI | CARD
        };
      }

     const res = await apiRequest('/pos/orders', {
  method: 'POST',
  body: JSON.stringify(payload),
});

      if (!res?.success) {
        throw new Error(res?.message || 'Order failed');
      }

      // resetOrder();

     if (typeof onSuccess === 'function') {
  // Use the correct data path from your API response
  onSuccess(res.data?.order || res.data);
}
    } catch (err) {
      console.error('Order submit failed:', err);
      alert(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Confirm Order
    </button>
  );
}