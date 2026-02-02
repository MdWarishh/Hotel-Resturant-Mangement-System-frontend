// components/kitchen/OrderDetailModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; // assume lucide icons installed, ya simple X use kar le

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OrderDetailModal({ orderId, isOpen, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const res = await fetch(`${API_URL}/pos/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to fetch order');
        }

        const data = await res.json();
        setOrder(data.data.order || data.order);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            Order Details {order ? `#${order.orderNumber}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={28} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading order details...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : !order ? (
          <div className="p-10 text-center text-gray-400">Order not found</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status & Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Status</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase ${
                    order.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : order.status === 'preparing'
                      ? 'bg-orange-500/20 text-orange-300'
                      : order.status === 'ready'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Type & Location</h3>
                <p>{order.orderType.toUpperCase()}</p>
                {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                {order.room?.roomNumber && <p>Room: {order.room.roomNumber}</p>}
                {order.booking && <p>Booking: {order.booking.bookingNumber}</p>}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Customer</h3>
                {order.customer?.name ? (
                  <>
                    <p>{order.customer.name}</p>
                    {order.customer.phone && <p>Ph: {order.customer.phone}</p>}
                    {order.customer.email && <p>Email: {order.customer.email}</p>}
                  </>
                ) : (
                  <p className="text-gray-500">No customer details</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-xl font-bold mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="p-3">{item.name}{item.variant ? ` (${item.variant})` : ''}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">₹{item.price}</td>
                        <td className="p-3">₹{item.subtotal}</td>
                        <td className="p-3 text-yellow-200">
                          {item.specialInstructions || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-700 p-4 rounded-lg">
              <div>
                <p className="text-gray-400">Subtotal</p>
                <p className="text-xl font-bold">₹{order.pricing.subtotal}</p>
              </div>
              <div>
                <p className="text-gray-400">Tax (GST)</p>
                <p className="text-xl font-bold">₹{order.pricing.tax}</p>
              </div>
              <div>
                <p className="text-gray-400">Total</p>
                <p className="text-2xl font-bold text-green-400">₹{order.pricing.total}</p>
              </div>
            </div>

            {/* Notes & Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Special Instructions / Notes</h3>
                <div className="bg-gray-700 p-4 rounded-lg min-h-[100px] whitespace-pre-wrap">
                  {order.specialInstructions || order.notes || 'None'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Timeline</h3>
                <ul className="space-y-2 text-sm">
                  <li>Placed: {new Date(order.timestamps.placed).toLocaleString()}</li>
                  {order.timestamps.preparing && (
                    <li>Preparing started: {new Date(order.timestamps.preparing).toLocaleString()}</li>
                  )}
                  {order.timestamps.ready && (
                    <li>Ready: {new Date(order.timestamps.ready).toLocaleString()}</li>
                  )}
                  {order.timestamps.served && (
                    <li>Served: {new Date(order.timestamps.served).toLocaleString()}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}