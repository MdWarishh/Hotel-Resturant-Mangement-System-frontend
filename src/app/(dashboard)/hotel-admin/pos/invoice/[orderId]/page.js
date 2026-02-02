'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/services/api';

/**
 * POS Invoice Page
 * - Read-only
 * - Printable
 * - GST compliant
 */
export default function InvoicePage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await apiRequest(`/pos/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      console.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading invoice…
      </div>
    );
  }

  if (!order || order.status !== 'COMPLETED') {
    return (
      <div className="p-6 text-sm text-red-500">
        Invoice not available
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white print:p-0">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold">
          {order.hotel?.name || 'Hotel'}
        </h1>
        <p className="text-sm text-gray-500">
          GSTIN: {order.hotel?.gstNumber || '—'}
        </p>
        <p className="text-sm">
          Invoice #{order.orderNumber}
        </p>
      </div>

      {/* Meta */}
      <div className="text-sm mb-4">
        <p>
          Date:{' '}
          {new Date(order.createdAt).toLocaleString()}
        </p>
        <p>
          Order Type:{' '}
          {order.orderType === 'dine-in'
            ? `Dine In (Table ${order.tableNumber})`
            : order.orderType}
        </p>
        <p>
          Payment Mode: {order.payment?.mode}
        </p>
      </div>

      {/* Items */}
      <div className="border-t border-b py-2 mb-4">
        {order.items.map((item) => (
          <div
            key={item._id}
            className="flex justify-between text-sm mb-1"
          >
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>₹{item.subtotal}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="text-sm mb-6">
        <div className="flex justify-between mb-1">
          <span>Subtotal</span>
          <span>₹{order.pricing.subtotal}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>GST (5%)</span>
          <span>₹{order.pricing.tax}</span>
        </div>
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>₹{order.pricing.total}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mb-4">
        Thank you for dining with us!
      </div>

      {/* Print */}
      <div className="text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 border rounded"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
}