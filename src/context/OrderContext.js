'use client';

import { createContext, useContext, useMemo, useState } from 'react';

const OrderContext = createContext(null);

const GST_RATE = 5;

export const OrderProvider = ({ children }) => {
  const [order, setOrder] = useState(null);

  /**
   * 🆕 Initialize new order
   */
  const startOrder = ({ orderType, tableNumber, room, booking }) => {
    setOrder({
      orderType,
      tableNumber: tableNumber || '',
      room: room || null,
      booking: booking || null,
      items: [],
      pricing: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    });
  };


  /**
   * 🔄 Update item quantity directly
   * Added to fix the "updateQuantity is not a function" error
   */
  const updateQuantity = (index, newQuantity) => {
    setOrder((prev) => {
      if (!prev || !prev.items[index]) return prev;
      if (newQuantity < 1) return prev; // Prevents negative or zero quantity

      let updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity,
        subtotal: newQuantity * updatedItems[index].price,
      };

      return recalculate({ ...prev, items: updatedItems });
    });
  };


  /**
   * ➕ Add item to cart
   * Variant is mandatory if provided
   */
  const addItem = ({ menuItemId, name, variant, price }) => {
    setOrder((prev) => {
      if (!prev) return prev;

      const existingIndex = prev.items.findIndex(
        (i) =>
          i.menuItemId === menuItemId &&
          i.variant === variant
      );

      let updatedItems = [...prev.items];

      if (existingIndex > -1) {
        updatedItems[existingIndex].quantity += 1;
        updatedItems[existingIndex].subtotal =
          updatedItems[existingIndex].quantity *
          updatedItems[existingIndex].price;
      } else {
        updatedItems.push({
          menuItemId,
          name,
          variant: variant || null,
          price,
          quantity: 1,
          subtotal: price,
        });
      }

      return recalculate({ ...prev, items: updatedItems });
    });
  };

  /**
   * ➖ Remove item / decrease quantity
   */
  const removeItem = ({ menuItemId, variant }) => {
    setOrder((prev) => {
      if (!prev) return prev;

      let updatedItems = prev.items
        .map((item) => {
          if (
            item.menuItemId === menuItemId &&
            item.variant === variant
          ) {
            const qty = item.quantity - 1;
            if (qty <= 0) return null;
            return {
              ...item,
              quantity: qty,
              subtotal: qty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean);

      return recalculate({ ...prev, items: updatedItems });
    });
  };

  /**
   * 💸 Apply discount (flat amount)
   */
  const applyDiscount = (amount) => {
    setOrder((prev) => {
      if (!prev) return prev;
      return recalculate({
        ...prev,
        pricing: {
          ...prev.pricing,
          discount: amount || 0,
        },
      });
    });
  };

  /**
   * 🔄 Recalculate pricing
   */
  const recalculate = (data) => {
  // 1. Calculate Subtotal from items
  const subtotal = data.items.reduce(
    (sum, i) => sum + (Number(i.subtotal) || 0), 
    0
  );

  // 2. Safely get the discount
  const discount = Number(data.pricing?.discount) || 0;
  
  // 3. Calculate taxable amount (after discount)
  const taxableAmount = Math.max(subtotal - discount, 0);

  // 4. Calculate Tax (5%) and Total
  const tax = Math.ceil((taxableAmount * GST_RATE) / 100);
  const total = taxableAmount + tax;

  return {
    ...data,
    pricing: {
      subtotal: subtotal,
      discount: discount,
      tax: tax,
      total: total,
    },
  };
};

  /**
   * 🧹 Clear order (after submit)
   */
  const resetOrder = () => {
    setOrder(null);
  };

  const value = useMemo(
    () => ({
      order,
      startOrder,
      addItem,
      removeItem,
      updateQuantity,
      applyDiscount,
      resetOrder,
    }),
    [order]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error(
      'useOrder must be used inside OrderProvider'
    );
  }
  return context;
};