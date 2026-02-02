'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import NewOrderPage from '@/app/(dashboard)/hotel-admin/pos/orders/new/page';
import PaymentModal from './components/PaymentModal';
import RunningOrders from './components/RunningOrders';
import { apiRequest } from '@/services/api';

export default function CashierPOSPage() {
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCheckout = async (order) => {
    try {
      await apiRequest(
        `/pos/orders/${order._id}/checkout`,
        { method: 'POST' }
      );

      // Refresh running orders
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Checkout failed');
    }
  };

  return (
    <div className="flex h-full">
      {/* LEFT: CREATE ORDER */}
      <div className="flex-1 border-r">
        <NewOrderPage
          requirePayment={false}
          onOrderSuccess={(order) => {
            setSelectedOrder(order);
            setShowPayment(true);
          }}
        />
      </div>

      {/* RIGHT: RUNNING ORDERS */}
      <div className="w-96 p-4">
        <h2 className="mb-3 text-lg font-semibold">
          Running Orders
        </h2>

        <RunningOrders
          key={refreshKey}
          onCheckout={handleCheckout}
        />
      </div>

      {/* PAYMENT MODAL */}
      {showPayment && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => {
            setShowPayment(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowPayment(false);
            setSelectedOrder(null);
            setRefreshKey((k) => k + 1);
            router.replace('/cashier/pos');
          }}
        />
      )}
    </div>
  );
}