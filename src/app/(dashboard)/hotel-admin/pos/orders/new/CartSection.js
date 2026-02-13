'use client';

import { useOrder } from '@/context/OrderContext';
import { useRouter } from 'next/navigation';
import SubmitOrder from './SubmitOrder';
import { ShoppingCart, Minus, Plus, Trash2, Tag, Printer, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PaymentModal from '@/components/cashier/PaymentModal';

export default function CartSection({ onOrderSuccess, requirePayment = true }) {
  const { order, addItem, removeItem, updateQuantity, applyDiscount, resetOrder } = useOrder();
  const [showPayment, setShowPayment] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const { user } = useAuth();
 const router = useRouter();

// src/components/pos/CartSection.js

const finalizeOrderSuccess = (orderData) => {
  if (!orderData?._id) return;

  const token = localStorage.getItem('token'); //
  
  // Base URL for the backend
  const baseUrl = 'http://localhost:5000'; 
  
  // Pass the token in the URL so the new tab can be authorized
  const pdfUrl = `${baseUrl}/api/pos/orders/${orderData._id}/invoice/pdf?token=${token}`;
  
  window.open(pdfUrl, '_blank');

  // Clear states and redirect
  resetOrder(); //
  setShowPayment(false);
  setCreatedOrder(null);
  setShowSuccess(false);
  // If cashier, stay in cashier POS; if admin, stay in admin POS
    if (user?.role === 'cashier') {
      router.push('/cashier/pos'); 
    } else {
      router.push('/hotel-admin/pos/orders/new');
    }
  };


  if (!order || !order.items?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 text-center border-l border-gray-200 dark:border-gray-700">
        <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
        <p className="text-gray-500 dark:text-gray-400">Add items from the menu to get started</p>
      </div>
    );
  }

  const { items, pricing } = order;

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }
    applyDiscount(discountCode.trim());
    setDiscountError(null);
    setDiscountCode('');
  };

const handlePaymentSuccess = (updatedOrder) => {
  // 1. Close the modal immediately
  setShowPayment(false); 
  
  // 2. Clear the 'createdOrder' state so this ID is no longer active
  setCreatedOrder(null); 
  
  // 3. Reset the cart context
  resetOrder(); 

  // 4. Trigger print or navigation
  window.open(`/api/pos/orders/${updatedOrder._id}/invoice/pdf`, '_blank');
};

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

 

  return (
    <div className="flex h-full flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10">
            <ShoppingCart className="h-5 w-5 text-[rgb(0,173,181)]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Cart</h3>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {item.name} {item.variant ? `(${item.variant})` : ''}
                </h4>
                <p className="font-medium text-[rgb(0,173,181)]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-4">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-1 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Discount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Discount Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={e => setDiscountCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-[rgb(0,173,181)] focus:ring-2 focus:ring-[rgb(0,173,181)]/30"
            />
            <button
              onClick={handleApplyDiscount}
              className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Apply
            </button>
          </div>
          {discountError && <p className="text-red-600 text-sm mt-1">{discountError}</p>}
        </div>

        {/* Totals */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>₹{pricing.subtotal?.toFixed(2)}</span>
          </div>
          {pricing.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{pricing.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>GST (5%)</span>
            <span>₹{pricing.tax?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t pt-3">
            <span>Total</span>
            <span className="text-[rgb(0,173,181)]">₹{pricing.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit & Payment */}
 <div className="space-y-4">
  {/* STEP 1: PLACE ORDER */}
  {!createdOrder && (
    <SubmitOrder
      onSuccess={(savedOrder) => {
        setCreatedOrder(savedOrder);
        if (requirePayment) {
          setShowPayment(true);
        } else {
          // No payment needed → finish immediately
          finalizeOrderSuccess(savedOrder);
        }
      }}
    />
  )}

  {/* STEP 2: CASH PAYMENT BUTTON (only if order created + payment needed) */}
  {requirePayment && createdOrder && (
    <button
      onClick={() => setShowPayment(true)}
      className="w-full py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
    >
      Proceed to Cash Payment
    </button>
  )}

  {/* CASH PAYMENT MODAL */}
  {showPayment && createdOrder && (
    <PaymentModal
      order={createdOrder}
      onClose={() => setShowPayment(false)}
      onSuccess={(updatedOrder) => {
        finalizeOrderSuccess(updatedOrder);
      }}
    />
  )}
</div>
      </div>

      {/* Payment Modal */}
      {/* {showPayment && createdOrder && (
        <PaymentModal
          order={createdOrder}
          onClose={() => setShowPayment(false)}
          onSuccess={(paymentData) => {
            resetOrder();
            setShowPayment(false);
            setShowSuccess(true);
            window.open(`/api/pos/orders/new/${createdOrder._id}/invoice/pdf`, '_blank');
            if (onOrderSuccess) onOrderSuccess(createdOrder);
          }}
        />
      )} */}

      {/* Success Confirmation */}
      {showSuccess && createdOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Placed Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Order #{createdOrder.orderNumber}
            </p>
            <p className="text-xl font-semibold text-[rgb(0,173,181)] mb-6">
              Total: ₹{createdOrder.pricing?.total?.toFixed(2)}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.open(`/api/pos/orders/new/${createdOrder._id}/invoice/pdf`, '_blank')}
                className="w-full py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 flex items-center justify-center gap-2 font-medium"
              >
                <Printer className="h-5 w-5" />
                Print Invoice
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  router.push('/hotel-admin/pos/orders');
                }}
                className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}