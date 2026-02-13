// frontend/components/public/TrackOrderModal.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackOrderModal({ isOpen, onClose, hotelCode }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  const handleTrackOrder = () => {
    setError('');

    // Validate order number
    if (!orderNumber.trim()) {
      setError('Please enter your order number');
      return;
    }

    // Order number format validation (ORD + digits)
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();
    
    if (!trimmedOrderNumber.match(/^ORD\d+$/)) {
      setError('Invalid order number format. Should be like: ORD2402101234');
      return;
    }

    // Navigate to tracking page
    router.push(`/public/${hotelCode}/track/${trimmedOrderNumber}`);
    onClose();
    setOrderNumber('');
  };

  const handleClose = () => {
    setOrderNumber('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Track Your Order
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Enter your order number to see the current status
            </p>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order Number
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g., ORD2402101234"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTrackOrder();
                }
              }}
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Example */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-600 mb-1">💡 Where to find your order number?</p>
            <p className="text-xs text-gray-700">
              Check your order confirmation page or receipt. It starts with "ORD" followed by numbers.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTrackOrder}
              className="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}