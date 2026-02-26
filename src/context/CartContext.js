// frontend/context/CartContext.js

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { calculateCartTotal } from '@/services/allinonApi';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children, hotelCode }) => {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (hotelCode) {
      const savedCart = localStorage.getItem(`cart_${hotelCode}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      }
    }
  }, [hotelCode]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (hotelCode && cart.length > 0) {
      localStorage.setItem(`cart_${hotelCode}`, JSON.stringify(cart));
    }
  }, [cart, hotelCode]);

  /**
   * Add item to cart
   * @param {Object} item - Menu item with { _id, name, price, images, variant, quantity }
   */
  const addToCart = (item) => {
    setCart((prevCart) => {
      // Check if item with same variant already exists
      const existingIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem._id === item._id &&
          cartItem.variant === item.variant
      );

      if (existingIndex > -1) {
        // Item exists, increase quantity
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += item.quantity || 1;
        return updatedCart;
      } else {
        // New item, add to cart
        return [
          ...prevCart,
          {
            ...item,
            quantity: item.quantity || 1,
          },
        ];
      }
    });
    
    setIsOpen(true); // Open cart drawer after adding
  };

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID
   * @param {string} variant - Item variant (optional)
   */
  const removeFromCart = (itemId, variant = null) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item._id === itemId && item.variant === variant)
      )
    );
  };

  /**
   * Update item quantity
   * @param {string} itemId - Item ID
   * @param {string} variant - Item variant (optional)
   * @param {number} quantity - New quantity
   */
  const updateQuantity = (itemId, variant, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId, variant);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === itemId && item.variant === variant
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Increase quantity by 1
   */
  const increaseQuantity = (itemId, variant = null) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === itemId && item.variant === variant
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  /**
   * Decrease quantity by 1
   */
  const decreaseQuantity = (itemId, variant = null) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === itemId && item.variant === variant
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0) // Remove if quantity becomes 0
    );
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    setCart([]);
    if (hotelCode) {
      localStorage.removeItem(`cart_${hotelCode}`);
    }
  };

  /**
   * Get item count in cart
   */
  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Check if item is in cart
   * @param {string} itemId - Item ID
   * @param {string} variant - Item variant (optional)
   */
  const isInCart = (itemId, variant = null) => {
    return cart.some(
      (item) => item._id === itemId && item.variant === variant
    );
  };

  /**
   * Get item quantity from cart
   * @param {string} itemId - Item ID
   * @param {string} variant - Item variant (optional)
   */
  const getItemQuantity = (itemId, variant = null) => {
    const item = cart.find(
      (item) => item._id === itemId && item.variant === variant
    );
    return item ? item.quantity : 0;
  };

  /**
   * Get cart totals (subtotal, tax, delivery, total)
   * @param {number} deliveryCharge - Pass delivery charge for delivery orders
   */
  const getCartTotals = (deliveryCharge = 0) => {
    return calculateCartTotal(cart, deliveryCharge);
  };

  /**
   * Open cart drawer
   */
  const openCart = () => {
    setIsOpen(true);
  };

  /**
   * Close cart drawer
   */
  const closeCart = () => {
    setIsOpen(false);
  };

  /**
   * Toggle cart drawer
   */
  const toggleCart = () => {
    setIsOpen((prev) => !prev);
  };

  const value = {
    cart,
    isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    getItemCount,
    isInCart,
    getItemQuantity,
    getCartTotals,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};