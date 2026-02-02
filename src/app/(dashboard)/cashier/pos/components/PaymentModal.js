'use client';

import { useState } from 'react';
import { apiRequest } from '@/services/api';
import { X } from 'lucide-react';

export default function PaymentModal({ order, onClose, onSuccess }) {
  const [mode, setMode] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
console.log('PAYMENT API HIT', order._id, mode);
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

     await apiRequest(
  `/pos/orders/${order._id}/payment`,
  {
    method: 'PATCH',
    body: JSON.stringify({ mode }),
  }
);

      onSuccess(); // refresh orders
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to record payment'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Take Payment
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order info */}
        <div className="mb-4 rounded border p-3 text-sm">
          <p>
            <span className="font-medium">Order:</span>{' '}
            #{order.orderNumber}
          </p>
          <p>
            <span className="font-medium">Total:</span>{' '}
            ₹{order.pricing?.total}
          </p>
        </div>

        {/* Payment mode */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Payment Mode
          </label>
          <div className="flex gap-3">
            {['CASH', 'UPI', 'CARD'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded border px-4 py-2 text-sm ${
                  mode === m
                    ? 'bg-black text-white'
                    : 'bg-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}