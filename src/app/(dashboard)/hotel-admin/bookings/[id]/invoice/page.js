'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { Printer, Loader2, Download } from 'lucide-react';

export default function InvoicePage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/bookings/${id}`)
      .then(res => setBooking(res.data?.booking || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center py-20 text-red-600">Invoice not found</div>;
  }

  const nights = Math.ceil(
    (new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) / 86400000
  );

  const subtotal = booking.pricing?.roomCharges || 0;
  const extra = booking.pricing?.extraCharges || 0;
  const tax = booking.pricing?.tax || 0;
  const total = booking.pricing?.total || 0;
  const paid = booking.advancePayment || 0;
  const due = total - paid;

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen py-12 px-8 print:py-0 print:px-0">
      {/* Print Button */}
      <div className="flex justify-end mb-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg transition-all"
        >
          <Printer className="h-5 w-5" />
          Print Invoice
        </button>
      </div>

      <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border-0">
        {/* Header */}
        <div className="bg-teal-700 text-white px-12 py-10 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter">INVOICE</h1>
            <p className="text-teal-200 mt-1 text-lg">#{booking.bookingNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{booking.hotel?.name}</div>
            <div className="text-teal-200 text-sm mt-1">
              {booking.hotel?.address?.street}, {booking.hotel?.address?.city}, {booking.hotel?.address?.state}
            </div>
            {booking.hotel?.contact && <div className="text-teal-200 text-sm mt-1">+91 {booking.hotel.contact}</div>}
          </div>
        </div>

        {/* Guest & Invoice Info */}
        <div className="grid grid-cols-2 gap-12 p-12 border-b">
          <div>
            <div className="uppercase text-xs tracking-widest text-gray-500 mb-2">Billed To</div>
            <div className="font-semibold text-xl">{booking.guest?.name}</div>
            <div className="text-gray-600 mt-1">{booking.guest?.phone}</div>
            {booking.guest?.email && <div className="text-gray-600">{booking.guest.email}</div>}
            {booking.guest?.idProof && (
              <div className="mt-4 text-xs text-gray-500">
                ID: {booking.guest.idProof.type.toUpperCase()} - {booking.guest.idProof.number}
              </div>
            )}
          </div>

          <div className="text-right space-y-1 text-sm">
            <div><span className="text-gray-500">Invoice Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
            <div><span className="text-gray-500">Check-in:</span> {new Date(booking.dates.checkIn).toLocaleDateString('en-IN')}</div>
            <div><span className="text-gray-500">Check-out:</span> {new Date(booking.dates.checkOut).toLocaleDateString('en-IN')}</div>
            <div><span className="text-gray-500">Room:</span> {booking.room?.roomNumber} ({booking.room?.roomType})</div>
          </div>
        </div>

        {/* Charges Table */}
        <div className="p-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-widest text-gray-500">
                <th className="pb-4 font-medium">Description</th>
                <th className="pb-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y text-lg">
              <tr>
                <td className="py-5">Room Charges ({nights} nights × ₹{booking.pricing?.basePrice || 0})</td>
                <td className="py-5 text-right font-medium">₹{subtotal}</td>
              </tr>
              {extra > 0 && (
                <tr>
                  <td className="py-5 text-teal-600">Extra Guest Charges</td>
                  <td className="py-5 text-right text-teal-600 font-medium">₹{extra}</td>
                </tr>
              )}
              <tr>
                <td className="py-5">GST (5%)</td>
                <td className="py-5 text-right font-medium">₹{tax}</td>
              </tr>
              <tr className="bg-teal-50 font-bold">
                <td className="py-6 text-xl">Total Amount</td>
                <td className="py-6 text-right text-2xl text-teal-700">₹{total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 px-12 py-10 flex justify-between items-center border-t">
          <div>
            <div className="text-sm text-gray-500">Payment Status</div>
            <div className="text-2xl font-semibold capitalize mt-1">
              {booking.paymentStatus.replace('_', ' ')}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Amount Paid</div>
            <div className="text-3xl font-bold text-emerald-600">₹{paid}</div>
            {due > 0 && (
              <div className="text-orange-600 text-xl font-medium mt-3">
                Balance Due: ₹{due}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-12 py-10 text-center text-xs text-gray-500 border-t">
          Thank you for choosing <span className="font-semibold text-teal-700">{booking.hotel?.name}</span>.<br />
          This is a computer-generated invoice and does not require a signature.
        </div>
      </div>
    </div>
  );
}