'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useOrder } from '@/context/OrderContext';
import { CheckCircle, Loader2, AlertCircle, PlusCircle } from 'lucide-react';

/**
 * Submit POS Order
 * - Role-agnostic
 * - Parent decides redirect behavior
 * - ✅ existingOrderId diya ho to naya order nahi banega, purane mein items ADD honge
 */
export default function SubmitOrder({ onSuccess, extraCharges = [], existingOrderId = null }) {
  const router = useRouter();
  const { order, resetOrder } = useOrder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!order) return null;

  const handleSubmit = async () => {
    setError(null);

    if (!order.items || order.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);

      let res;

      if (existingOrderId) {
        // ✅ EXISTING ORDER MODE — sirf naye items + charges bhejo, purana order update hoga
        const itemsPayload = {
          items: order.items.map((item) => ({
            menuItem: item.menuItemId,
            variant: item.variant,
            quantity: item.quantity,
          })),
          extraCharges: extraCharges.filter(c => c.label && Number(c.amount) > 0),
        };

        res = await apiRequest(`/pos/orders/${existingOrderId}/items`, {
          method: 'PATCH',
          body: JSON.stringify(itemsPayload),
        });
      } else {
        // Normal — naya order banega
        const payload = {
          orderType: order.orderType,
          tableNumber:
            order.orderType === 'dine-in'
              ? order.tableNumber
              : undefined,
          room: order.room || undefined,
          booking: order.booking || undefined,
          extraCharges: extraCharges.filter(c => c.label && Number(c.amount) > 0),
          items: order.items.map((item) => ({
            menuItem: item.menuItemId,
            variant: item.variant,
            quantity: item.quantity,
          })),
        };

        res = await apiRequest('/pos/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const createdOrder = res.data?.order || res.data;

      if (typeof onSuccess === 'function') {
        onSuccess(createdOrder);
      } else {
        // Default (Hotel Admin safe fallback)
        // router.replace('/hotel-admin/pos/orders/new');
      }
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
          existingOrderId
            ? 'bg-orange-600 hover:bg-orange-600/90'
            : 'bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {existingOrderId ? 'Adding Items...' : 'Placing Order...'}
          </>
        ) : existingOrderId ? (
          <>
            <PlusCircle className="h-5 w-5" />
            Add Items to Order
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            Place Order
          </>
        )}
      </button>
    </div>
  );
}