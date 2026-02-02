'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { Printer, Loader2, Building2, User, Phone, Calendar, Bed } from 'lucide-react';

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiRequest(`/bookings/${id}`);
        setBooking(res.data?.booking || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        Invoice not found
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) /
      (1000 * 60 * 60 * 24)
  );

  const subtotal = booking.pricing?.roomCharges || 0;
  const tax = booking.pricing?.tax || 0;
  const total = booking.pricing?.total || 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Print Button - Hidden on Print */}
      <div className="mb-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>

      {/* Invoice Container */}
      <div className="space-y-6 rounded-xl border-2 border-[rgb(57,62,70)]/20 bg-white p-8 shadow-xl print:border-0 print:shadow-none">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-[rgb(0,173,181)] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[rgb(34,40,49)]">INVOICE</h1>
            <p className="mt-1 text-sm text-[rgb(57,62,70)]">
              Payment Receipt
            </p>
          </div>
          <div className="text-right">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)]/10 px-3 py-1.5">
              <Building2 className="h-4 w-4 text-[rgb(0,173,181)]" />
              <span className="text-sm font-medium text-[rgb(0,173,181)]">
                Official Invoice
              </span>
            </div>
          </div>
        </div>

        {/* HOTEL INFO */}
        <div className="rounded-lg bg-[rgb(238,238,238)]/50 p-4">
          <h2 className="mb-1 text-lg font-semibold text-[rgb(34,40,49)]">
            {booking.hotel?.name || 'Hotel'}
          </h2>
          <p className="text-sm text-[rgb(57,62,70)]">
            {booking.hotel?.address?.city || '—'}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-[rgb(57,62,70)]/10 bg-white p-6">
          <Info
            label="Invoice No"
            value={booking.bookingNumber}
            icon={<Bed className="h-4 w-4" />}
          />
          <Info
            label="Invoice Date"
            value={new Date().toLocaleDateString()}
            icon={<Calendar className="h-4 w-4" />}
          />
          <Info
            label="Guest Name"
            value={booking.guest?.name}
            icon={<User className="h-4 w-4" />}
          />
          <Info
            label="Phone"
            value={booking.guest?.phone}
            icon={<Phone className="h-4 w-4" />}
          />
          <Info label="Room" value={booking.room?.roomNumber} />
          <Info label="Nights" value={nights} />
        </div>

        {/* CHARGES TABLE */}
        <div className="overflow-hidden rounded-lg border border-[rgb(57,62,70)]/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(57,62,70)]/10">
              <tr className="transition-colors hover:bg-[rgb(238,238,238)]/30">
                <td className="px-4 py-3 text-[rgb(34,40,49)]">
                  Room Charges ({nights} nights)
                </td>
                <td className="px-4 py-3 text-right font-medium text-[rgb(34,40,49)]">
                  ₹{subtotal}
                </td>
              </tr>
              <tr className="transition-colors hover:bg-[rgb(238,238,238)]/30">
                <td className="px-4 py-3 text-[rgb(34,40,49)]">GST</td>
                <td className="px-4 py-3 text-right font-medium text-[rgb(34,40,49)]">
                  ₹{tax}
                </td>
              </tr>
              <tr className="bg-[rgb(0,173,181)]/10">
                <td className="px-4 py-3 text-lg font-bold text-[rgb(34,40,49)]">
                  Total Amount
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-[rgb(0,173,181)]">
                  ₹{total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAYMENT STATUS */}
        <div className="rounded-lg border border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/30 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-[rgb(57,62,70)]">
                Payment Status:
              </span>
              <span className="font-semibold text-[rgb(34,40,49)]">
                {booking.paymentStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-[rgb(57,62,70)]">
                Amount Paid:
              </span>
              <span className="font-semibold text-[rgb(0,173,181)]">
                ₹{booking.advancePayment}
              </span>
            </div>
            {booking.advancePayment < total && (
              <div className="flex justify-between border-t border-[rgb(57,62,70)]/20 pt-2">
                <span className="font-medium text-[rgb(57,62,70)]">
                  Balance Due:
                </span>
                <span className="font-semibold text-[rgb(34,40,49)]">
                  ₹{total - booking.advancePayment}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t-2 border-[rgb(57,62,70)]/10 pt-6 text-center">
          <p className="text-sm font-medium text-[rgb(0,173,181)]">
            Thank you for staying with us!
          </p>
          <p className="mt-1 text-xs text-[rgb(57,62,70)]">
            This is a computer-generated invoice and does not require a signature
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        {icon && <div className="text-[rgb(57,62,70)]/50">{icon}</div>}
        <p className="text-xs font-medium text-[rgb(57,62,70)]">{label}</p>
      </div>
      <p className="font-semibold text-[rgb(34,40,49)]">{value || '—'}</p>
    </div>
  );
}