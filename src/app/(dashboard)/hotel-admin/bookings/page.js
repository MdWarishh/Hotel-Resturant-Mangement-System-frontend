'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Loader2, Search, Filter } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  /* ---------------- FETCH BOOKINGS ---------------- */
  const fetchBookings = async () => {
    try {
      const res = await apiRequest(`/bookings?hotel=${user.hotel}`);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hotel) fetchBookings();
  }, [user]);

  /* ---------------- CHECK-IN ---------------- */
  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await apiRequest(`/bookings/${bookingId}/checkin`, {
        method: 'POST',
      });
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------------- CHECK-OUT ---------------- */
  const handleCheckOut = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await apiRequest(`/bookings/${bookingId}/checkout`, {
        method: 'POST',
      });
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;

    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'POST' });
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Cancel failed');
    }
  };

  const handleNoShow = async (bookingId) => {
    if (!confirm('Mark this booking as No-Show?')) return;

    try {
      await apiRequest(`/bookings/${bookingId}/no-show`, { method: 'POST' });
      fetchBookings();
    } catch (err) {
      alert(err.message || 'No-show failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Bookings</h2>

        <Link
          href="/hotel-admin/bookings/create"
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          New Booking
        </Link>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-4 py-3 text-left font-medium">Booking #</th>
                <th className="px-4 py-3 text-left font-medium">Guest</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Room</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                <th className="px-4 py-3 text-center font-medium">Nights</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgb(57,62,70)]/10">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-[rgb(57,62,70)]">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const nights = Math.ceil(
                    (new Date(b.dates.checkOut) - new Date(b.dates.checkIn)) /
                      (1000 * 60 * 60 * 24)
                  );

                  const due = (b.pricing?.total || 0) - (b.advancePayment || 0);

                  return (
                    <tr
                      key={b._id}
                      className="transition-colors duration-150 hover:bg-[rgb(238,238,238)]/50"
                    >
                      {/* Booking # */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/hotel-admin/bookings/${b._id}`}
                          className="font-medium text-[rgb(0,173,181)] transition-colors hover:underline"
                        >
                          {b.bookingNumber}
                        </Link>
                      </td>

                      {/* Guest */}
                      <td className="px-4 py-3 text-[rgb(34,40,49)]">
                        {b.guest?.name}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-[rgb(57,62,70)]">
                        {b.guest?.phone}
                      </td>

                      {/* Room */}
                      <td className="px-4 py-3 font-medium text-[rgb(34,40,49)]">
                        {b.room?.roomNumber}
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 text-xs text-[rgb(57,62,70)]">
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">In:</span>{' '}
                            {new Date(b.dates.checkIn).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Out:</span>{' '}
                            {new Date(b.dates.checkOut).toLocaleString()}
                          </div>
                        </div>
                      </td>

                      {/* Nights */}
                      <td className="px-4 py-3 text-center font-semibold text-[rgb(34,40,49)]">
                        {nights}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <PaymentBadge status={b.paymentStatus} />
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-xs text-[rgb(57,62,70)]">
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Total:</span> ₹
                            {b.pricing?.total || 0}
                          </div>
                          <div>
                            <span className="font-medium">Advance:</span> ₹
                            {b.advancePayment || 0}
                          </div>
                          <div className="font-semibold text-[rgb(34,40,49)]">
                            Due: ₹{due}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {['confirmed', 'reserved'].includes(b.status) && (
                            <>
                              <button
                                onClick={() => handleCheckIn(b._id)}
                                disabled={actionLoading === b._id}
                                className="w-full rounded-lg bg-[rgb(0,173,181)] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionLoading === b._id ? (
                                  <Loader2 className="mx-auto h-3 w-3 animate-spin" />
                                ) : (
                                  'Check-in'
                                )}
                              </button>

                              <button
                                onClick={() => handleCancel(b._id)}
                                className="w-full rounded-lg bg-[rgb(57,62,70)] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[rgb(34,40,49)]"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {b.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(b._id)}
                              disabled={actionLoading === b._id}
                              className="w-full rounded-lg bg-[rgb(0,173,181)] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === b._id ? (
                                <Loader2 className="mx-auto h-3 w-3 animate-spin" />
                              ) : (
                                'Check-out'
                              )}
                            </button>
                          )}

                          {b.status === 'confirmed' &&
                            new Date(b.dates.checkIn) < new Date() && (
                              <button
                                onClick={() => handleNoShow(b._id)}
                                className="w-full rounded-lg bg-[rgb(57,62,70)]/60 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[rgb(57,62,70)]"
                              >
                                No-show
                              </button>
                            )}

                          {['checked_out', 'cancelled', 'no_show'].includes(
                            b.status
                          ) && (
                            <span className="text-center text-xs text-[rgb(57,62,70)]/50">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STATUS BADGE ---------------- */
function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    confirmed: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    reserved: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    checked_in: 'bg-[rgb(0,173,181)]/20 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/40',
    checked_out: 'bg-[rgb(57,62,70)]/10 text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/30',
    cancelled: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    no_show: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

/* ---------------- PAYMENT BADGE ---------------- */
function PaymentBadge({ status }) {
  const styles = {
    pending: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    paid: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    partially_paid: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    refunded: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {status?.replace('_', ' ')}
    </span>
  );
}