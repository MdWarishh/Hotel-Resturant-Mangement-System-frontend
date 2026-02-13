'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useOrder } from '@/context/OrderContext';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

/**
 * Submit POS Order
 * - Role-agnostic
 * - Parent decides redirect behavior
 */
export default function SubmitOrder({ onSuccess }) {
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
    
    const payload = {
      // hotel: user?.hotel,
      orderType: order.orderType,
      tableNumber:
        order.orderType === 'dine-in'
        ? order.tableNumber
        : undefined,
        room: order.room || undefined,
        booking: order.booking || undefined,
        items: order.items.map((item) => ({
          menuItem: item.menuItemId,
        variant: item.variant,
        quantity: item.quantity,
      })),
    };
     
    try {
      setLoading(true);

  const res = await apiRequest('/pos/orders', {
  method: 'POST',
  body: JSON.stringify(payload),
});
console.log('Sending payload:', payload);
   

const createdOrder = res.data?.order || res.data;

// VERY IMPORTANT — pass the real saved order to parent
if (typeof onSuccess === 'function') {
  onSuccess(createdOrder);
}
else {
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] py-3 font-medium text-white shadow-lg transition-all hover:bg-[rgb(0,173,181)]/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Placing Order...
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