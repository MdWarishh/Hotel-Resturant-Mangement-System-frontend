// frontend/components/public/CartDrawer.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/services/publicApi';
import Image from 'next/image';

export default function CartDrawer({ isOpen, hotelCode, hotel }) {
  const router = useRouter();
  const {
    cart,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
  } = useCart();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { subtotal, tax, total } = getCartTotals();

  const handleCheckout = () => {
    closeCart();
    router.push(`/public/${hotelCode}/checkout`);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-orange-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Your Cart</h2>
            <p className="text-sm text-orange-100">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-280px)]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 mb-4">
                Add some delicious items to get started!
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <CartItem
                  key={`${item._id}-${item.variant || 'default'}`}
                  item={item}
                  onIncrease={() => increaseQuantity(item._id, item.variant)}
                  onDecrease={() => decreaseQuantity(item._id, item.variant)}
                  onRemove={() => removeFromCart(item._id, item.variant)}
                />
              ))}

              {/* Clear Cart Button */}
              {cart.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer - Price Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t bg-gray-50 p-4">
            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (5%)</span>
                <span className="font-semibold">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Clear Cart?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all items from your cart?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Cart Item Component
function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Item Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {item.name}
              </h4>
              {item.variant && (
                <p className="text-xs text-gray-500">{item.variant}</p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Price & Quantity Controls */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-orange-600">
              {formatPrice(item.price * item.quantity)}
            </p>

            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={onDecrease}
                className="px-3 py-1 hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <span className="px-3 py-1 font-semibold min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={onIncrease}
                className="px-3 py-1 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Individual Item Price */}
          <p className="text-xs text-gray-500 mt-1">
            {formatPrice(item.price)} each
          </p>
        </div>
      </div>
    </div>
  );
}