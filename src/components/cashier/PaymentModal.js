// frontend/components/cashier/PaymentModal.jsx

'use client';

import { useState } from 'react';
import { apiRequest } from '@/services/api';
import { CreditCard, Smartphone, Banknote, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function PaymentModal({ order, onClose, onSuccess }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const paymentModes = [
    { value: 'CASH', label: 'Cash', icon: Banknote, color: 'bg-green-600' },
    { value: 'UPI', label: 'UPI', icon: Smartphone, color: 'bg-purple-600' },
    { value: 'CARD', label: 'Card', icon: CreditCard, color: 'bg-blue-600' },
  ];

  const handlePayment = async () => {
    if (!selectedMode) {
      setError('Please select a payment mode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ THIS API CALL AUTOMATICALLY FREES THE TABLE
      const response = await apiRequest(`/pos/orders/${order._id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ mode: selectedMode }),
      });

      setSuccess(true);
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess(response.data);
      }, 1200);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgb(0,173,181)] to-[rgb(0,150,160)] p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Payment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm opacity-90">Order #{order.orderNumber}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-semibold">₹{order.pricing?.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">GST (5%):</span>
              <span className="font-semibold">₹{order.pricing?.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-2xl font-bold text-[rgb(0,173,181)]">
                ₹{order.pricing?.total?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Payment successful! Table has been freed.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Payment Mode Selection */}
          {!success && (
            <>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Select Payment Mode
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value)}
                      disabled={loading}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedMode === mode.value
                          ? `${mode.color} text-white border-transparent shadow-lg scale-105`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } disabled:opacity-50`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-semibold">{mode.label}</p>
                    </button>
                  );
                })}
              </div>

              {/* Table Info (if dine-in) */}
              {order.orderType === 'dine-in' && order.tableNumber && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium">Table {order.tableNumber} will be marked as available after payment</p>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handlePayment}
                disabled={loading || !selectedMode}
                className="w-full py-3 bg-[rgb(0,173,181)] text-white rounded-lg font-semibold hover:bg-[rgb(0,150,160)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Confirm Payment - ₹${order.pricing?.total?.toLocaleString()}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}