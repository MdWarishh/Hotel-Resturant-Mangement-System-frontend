'use client';

import { useState } from 'react';
import { OrderProvider, useOrder } from '@/context/OrderContext';
import MenuSection from './MenuSection';
import CartSection from './CartSection';
import { UtensilsCrossed, Users, DoorOpen, AlertCircle } from 'lucide-react';

/**
 * Cashier POS – Create New Order
 * Full working POS screen (Menu + Cart)
 */
function NewOrderContent({ onOrderSuccess, requirePayment  }) {
  const { order, startOrder } = useOrder();

  const [orderType, setOrderType] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [errors, setErrors] = useState({});

  /**
   * Validate initial order setup
   */
  const validateStart = () => {
    const newErrors = {};

    if (!orderType) {
      newErrors.orderType = 'Order type is required';
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required for dine-in';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Start POS Order
   */
  const handleStartOrder = () => {
    if (!validateStart()) return;

    startOrder({
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber.trim() : '',
    });
  };

  const orderTypes = [
    { value: 'dine-in', label: 'Dine In', icon: UtensilsCrossed },
    { value: 'takeaway', label: 'Takeaway', icon: DoorOpen },
    { value: 'room-service', label: 'Room Service', icon: Users },
  ];

  /**
   * STEP 1: Order setup screen
   */
  if (!order) {
    return (
      <div className="h-full w-full p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[rgb(34,40,49)]">
            Create New Order
          </h1>
          <p className="mt-2 text-sm text-[rgb(57,62,70)]">
            Select order type to get started
          </p>
        </div>

        {/* ORDER TYPE */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-[rgb(34,40,49)]">
            Order Type
          </label>

          <div className="grid grid-cols-3 gap-4">
            {orderTypes.map(({ value, label, icon: Icon }) => {
              const isSelected = orderType === value;
              return (
                <button
                  key={value}
                  onClick={() => setOrderType(value)}
                  className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200 ${
                    isSelected
                      ? 'border-[rgb(0,173,181)] bg-[rgb(0,173,181)] text-white shadow-lg shadow-[rgb(0,173,181)]/30'
                      : 'border-[rgb(57,62,70)]/10 bg-white text-[rgb(57,62,70)] hover:border-[rgb(0,173,181)]/30 hover:bg-[rgb(238,238,238)]'
                  }`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          {errors.orderType && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.orderType}</span>
            </div>
          )}
        </div>

        {/* TABLE NUMBER */}
        {orderType === 'dine-in' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
              Table Number
            </label>

            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-64 rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-4 py-2.5 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
              placeholder="e.g. T5"
            />

            {errors.tableNumber && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.tableNumber}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStartOrder}
          className="rounded-lg bg-[rgb(0,173,181)] px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          Start Order
        </button>
      </div>
    );
  }

  /**
   * STEP 2: Active POS screen (Menu + Cart)
   */
  return (
    <div className="flex h-full w-full">
      {/* Menu Section */}
      <div className="flex-1 overflow-hidden">
        <MenuSection />
      </div>

      {/* Cart Section */}
      <div className="w-96">
        <CartSection onOrderSuccess={onOrderSuccess}  requirePayment={requirePayment}/>
      </div>
    </div>
  );
}

/**
 * OrderProvider wrapper
 */
export default function NewOrderPage({ onOrderSuccess,  
   requirePayment = false}) {
  return (
    <OrderProvider>
      <NewOrderContent onOrderSuccess={onOrderSuccess}  requirePayment={requirePayment}/>
    </OrderProvider>  
  );
}