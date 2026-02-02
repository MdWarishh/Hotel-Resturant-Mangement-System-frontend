'use client';

import { useState } from 'react';

/**
 * Payment Section
 * - Select payment mode
 * - Mandatory before checkout
 */
export default function PaymentSection({
  value,
  onChange,
  readOnly = false,
}) {
  const [error, setError] = useState(null);

  const paymentModes = [
    { key: 'CASH', label: 'Cash' },
    { key: 'UPI', label: 'UPI' },
    { key: 'CARD', label: 'Card' },
  ];

  const handleSelect = (mode) => {
    if (readOnly) return;
    setError(null);
    onChange(mode);
  };

  return (
    <div className="border rounded p-4 mb-6">
      <h3 className="font-medium mb-3">
        Payment Method
      </h3>

      <div className="flex gap-3">
        {paymentModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => handleSelect(mode.key)}
            disabled={readOnly}
            className={`px-4 py-2 border rounded ${
              value === mode.key
                ? 'bg-black text-white'
                : 'bg-white'
            } ${
              readOnly
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {!value && (
        <p className="text-sm text-gray-500 mt-2">
          Select a payment method to proceed
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}