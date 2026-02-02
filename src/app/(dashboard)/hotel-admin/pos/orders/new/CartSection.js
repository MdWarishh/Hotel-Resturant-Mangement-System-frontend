'use client';

import { useOrder } from '@/context/OrderContext';
import SubmitOrder from './SubmitOrder';
import { ShoppingCart, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { useState } from 'react';
import PaymentModal from '@/components/cashier/PaymentModal';

export default function CartSection({ onOrderSuccess, requirePayment = false }) {
  const { order, addItem, removeItem, applyDiscount } = useOrder();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);

  if (!order) {
    return null;
  }

  console.log('CartSection requirePayment:', requirePayment);

  const { items, pricing } = order;

  return (
    <div className="flex h-full flex-col border-l border-[rgb(57,62,70)]/10 bg-white p-4">
      {/* HEADER */}
      <div className="mb-4 flex items-center gap-3 border-b border-[rgb(57,62,70)]/10 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10">
          <ShoppingCart className="h-5 w-5 text-[rgb(0,173,181)]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">Cart</h3>
      </div>

      {/* CART ITEMS */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="mb-3 h-12 w-12 text-[rgb(57,62,70)]/30" />
            <p className="text-sm text-[rgb(57,62,70)]">No items added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.menuItemId}-${item.variant}`}
                className="rounded-lg border border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/30 p-3"
              >
                <div className="mb-2 flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-[rgb(34,40,49)]">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-[rgb(57,62,70)]">
                        Variant: {item.variant}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-[rgb(57,62,70)]">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <button
                      onClick={() =>
                        removeItem({
                          menuItemId: item.menuItemId,
                          variant: item.variant,
                        })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgb(57,62,70)]/20 bg-white text-[rgb(57,62,70)] transition-all hover:bg-[rgb(57,62,70)] hover:text-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>

                    <span className="flex h-7 w-8 items-center justify-center text-sm font-semibold text-[rgb(34,40,49)]">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        addItem({
                          menuItemId: item.menuItemId,
                          name: item.name,
                          variant: item.variant,
                          price: item.price,
                        })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgb(0,173,181)]/20 bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] transition-all hover:bg-[rgb(0,173,181)] hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-semibold text-[rgb(34,40,49)]">
                    Subtotal: ₹{item.subtotal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRICING SUMMARY – yeh hamesha dikhega */}
      <div className="mt-4 border-t border-[rgb(57,62,70)]/10 pt-4">
        {/* Discount */}
        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-[rgb(34,40,49)]">
            <Tag className="h-4 w-4 text-[rgb(57,62,70)]" />
            Discount
          </label>
          <input
            type="number"
            min="0"
            value={pricing.discount}
            onChange={(e) =>
              applyDiscount(Math.max(Number(e.target.value) || 0, 0))
            }
            className="w-24 rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-1.5 text-right text-sm text-[rgb(34,40,49)] transition-all focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
          />
        </div>

        {/* Subtotal */}
        <div className="mb-2 flex justify-between text-sm text-[rgb(57,62,70)]">
          <span>Subtotal</span>
          <span>₹{pricing.subtotal}</span>
        </div>

        {/* GST */}
        <div className="mb-2 flex justify-between text-sm text-[rgb(57,62,70)]">
          <span>GST (5%)</span>
          <span>₹{pricing.tax}</span>
        </div>

        {/* Total */}
        <div className="mb-4 mt-3 flex justify-between border-t border-[rgb(57,62,70)]/10 pt-3 text-lg font-semibold text-[rgb(34,40,49)]">
          <span>Total</span>
          <span className="text-[rgb(0,173,181)]">₹{pricing.total}</span>
        </div>

        {/* Place Order Button – hamesha dikhega */}
        <SubmitOrder onSuccess={onOrderSuccess} />

        {/* Payment Modal – optional, only if requirePayment true */}
        {requirePayment && (
          <>
            <button
              onClick={() => setShowPayment(true)}
              className="mt-4 w-full rounded-lg bg-gray-600 py-3 font-medium text-white hover:bg-gray-700"
            >
              Proceed to Payment
            </button>

            {showPayment && (
              <PaymentModal
                order={order}
                onClose={() => setShowPayment(false)}
                onSuccess={() => {
                  setShowPayment(false);
                  onOrderSuccess(order); // refresh
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}