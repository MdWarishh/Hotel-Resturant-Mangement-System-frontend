'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { ArrowLeft, User, Phone, Mail, DoorOpen, Bed, Calendar, Clock, CreditCard, Download, Receipt, LogOut, Loader2, X } from 'lucide-react';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiRequest(`/bookings/${id}`);
        setBooking(res.data?.booking || null);
      } catch (err) {
        console.error('Failed to fetch booking', err);
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
          <p className="text-sm text-[rgb(57,62,70)]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking || !booking.dates) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        Booking data incomplete or corrupted
      </div>
    );
  }

  const nights =
    booking.dates.checkIn && booking.dates.checkOut
      ? Math.ceil(
          (new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const due = (booking.pricing?.total || 0) - (booking.advancePayment || 0);

  const handlePaymentUpdate = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Enter valid amount');
      return;
    }

    try {
      setPaymentLoading(true);

      await apiRequest(`/bookings/${booking._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
        }),
      });

      setShowPayment(false);
      setPaymentAmount('');

      const res = await apiRequest(`/bookings/${id}`);
      setBooking(res.data.booking);
    } catch (err) {
      alert(err.message || 'Payment update failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!confirm('Confirm check-out?')) return;

    await apiRequest(`/bookings/${booking._id}/checkout`, {
      method: 'POST',
    });

    const res = await apiRequest(`/bookings/${id}`);
    setBooking(res.data.booking);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">
            Booking #{booking.bookingNumber}
          </h2>
          <p className="mt-1 text-sm text-[rgb(57,62,70)]">
            Complete booking information
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 rounded-lg bg-[rgb(238,238,238)] px-4 py-2 text-sm font-medium text-[rgb(34,40,49)] transition-all duration-200 hover:bg-[rgb(57,62,70)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>

      {/* STATUS */}
      <Section title="Status" icon={<Receipt className="h-5 w-5" />}>
        <div className="col-span-2">
          <StatusBadge status={booking.status} />
        </div>
      </Section>

      {/* GUEST */}
      <Section title="Guest Details" icon={<User className="h-5 w-5" />}>
        <Info label="Name" value={booking.guest?.name} icon={<User className="h-4 w-4" />} />
        <Info label="Phone" value={booking.guest?.phone} icon={<Phone className="h-4 w-4" />} />
        <Info label="Email" value={booking.guest?.email || '—'} icon={<Mail className="h-4 w-4" />} />
      </Section>

      {/* ROOM */}
      <Section title="Room Details" icon={<DoorOpen className="h-5 w-5" />}>
        <Info label="Room Number" value={booking.room?.roomNumber} icon={<DoorOpen className="h-4 w-4" />} />
        <Info label="Room Type" value={booking.room?.roomType} icon={<Bed className="h-4 w-4" />} />
        <Info label="Floor" value={booking.room?.floor || '—'} />
      </Section>

      {/* DATES */}
      <Section title="Stay Details" icon={<Calendar className="h-5 w-5" />}>
        <Info
          label="Planned Check-in"
          value={new Date(booking.dates.checkIn).toLocaleString()}
          icon={<Calendar className="h-4 w-4" />}
        />
        <Info
          label="Planned Check-out"
          value={new Date(booking.dates.checkOut).toLocaleString()}
          icon={<Calendar className="h-4 w-4" />}
        />
        <Info
          label="Actual Check-in"
          value={
            booking.dates.actualCheckIn
              ? new Date(booking.dates.actualCheckIn).toLocaleString()
              : '—'
          }
          icon={<Clock className="h-4 w-4" />}
        />
        <Info
          label="Actual Check-out"
          value={
            booking.dates.actualCheckOut
              ? new Date(booking.dates.actualCheckOut).toLocaleString()
              : '—'
          }
          icon={<Clock className="h-4 w-4" />}
        />
        <Info label="Nights" value={nights} />
      </Section>

      {/* PAYMENT */}
      <Section title="Payment" icon={<CreditCard className="h-5 w-5" />}>
        <Info
          label="Payment Status"
          value={<PaymentBadge status={booking.paymentStatus} />}
        />
        <Info label="Total Amount" value={`₹${booking.pricing?.total || 0}`} />
        <Info label="Advance Paid" value={`₹${booking.advancePayment || 0}`} />
        <Info label="Due Amount" value={`₹${due}`} />

        <div className="col-span-2 mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setShowPayment(true)}
            className="flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90"
          >
            <CreditCard className="h-4 w-4" />
            Update Payment
          </button>

          {booking.status === 'checked_out' && (
            <>
              <button
                onClick={() =>
                  router.push(`/hotel-admin/bookings/${booking._id}/invoice`)
                }
                className="flex items-center gap-2 rounded-lg bg-[rgb(57,62,70)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(34,40,49)]"
              >
                <Receipt className="h-4 w-4" />
                View Invoice
              </button>

              <button
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/bookings/${booking._id}/invoice/pdf?token=${token}`,
                    '_blank'
                  )
                }
                className="flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </>
          )}
        </div>
      </Section>

      {/* AUDIT */}
      <Section title="Audit" icon={<Clock className="h-5 w-5" />}>
        <Info
          label="Created At"
          value={new Date(booking.createdAt).toLocaleString()}
        />
        <Info label="Created By" value={booking.createdBy?.name || '—'} />
        <Info label="Checked-in By" value={booking.checkedInBy?.name || '—'} />
        <Info label="Checked-out By" value={booking.checkedOutBy?.name || '—'} />

        {booking.status === 'checked_in' && booking.paymentStatus === 'paid' && (
          <div className="col-span-2 mt-4">
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(0,173,181)]/90"
            >
              <LogOut className="h-4 w-4" />
              Check-out Guest
            </button>
          </div>
        )}
      </Section>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(34,40,49)]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-[modalSlide_0.3s_ease-out] rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">
                Update Payment
              </h3>
              <button
                onClick={() => setShowPayment(false)}
                className="rounded-lg p-1 text-[rgb(57,62,70)] transition-colors hover:bg-[rgb(238,238,238)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
                Amount
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 text-[rgb(34,40,49)] transition-all focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="rounded-lg bg-[rgb(238,238,238)] px-4 py-2 text-sm font-medium text-[rgb(34,40,49)] transition-all hover:bg-[rgb(57,62,70)]/10"
              >
                Cancel
              </button>

              <button
                onClick={handlePaymentUpdate}
                disabled={paymentLoading}
                className="flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[rgb(0,173,181)]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, icon, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-2 border-b border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 px-6 py-4">
        <div className="text-[rgb(0,173,181)]">{icon}</div>
        <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="group">
      <div className="mb-1 flex items-center gap-2">
        {icon && <div className="text-[rgb(57,62,70)]/50">{icon}</div>}
        <p className="text-xs font-medium text-[rgb(57,62,70)]">{label}</p>
      </div>
      <p className="font-medium text-[rgb(34,40,49)]">{value ?? '—'}</p>
    </div>
  );
}

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
      className={`inline-block rounded-full px-3 py-1.5 text-sm font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    pending: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    paid: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    partially_paid: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    refunded: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {status?.replace('_', ' ')}
    </span>
  );
}