'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

/**
 * Payment Modal
 * - Cash / UPI / Card
 * - Phase 1 (no gateway)
 */
export default function PaymentModal({
  open,
  totalAmount,
  onClose,
  onConfirm,
}) {
  const [mode, setMode] = useState('CASH');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            Payment
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="text-sm text-gray-600">
            Total Amount
          </div>
          <div className="text-2xl font-bold">
            ₹{totalAmount}
          </div>

          {/* Payment Modes */}
          <div className="space-y-2">
            {['CASH', 'UPI', 'CARD'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  mode === m
                    ? 'border-black bg-black text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm border"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(mode)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
          >
            <CheckCircle size={16} />
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
}