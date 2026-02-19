'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { 
  ArrowLeft, User, Phone, Mail, DoorOpen, Calendar, CreditCard, 
  Download, LogOut, Loader2, X, Clock, UserCheck, Globe, Image as ImageIcon 
} from 'lucide-react';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showIdProofModal, setShowIdProofModal] = useState(false);

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

  const nights = booking?.dates?.checkIn && booking?.dates?.checkOut
    ? Math.ceil((new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) / 86400000)
    : 0;

  const due = (booking?.pricing?.total || 0) - (booking?.advancePayment || 0);

  const handlePaymentUpdate = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Enter valid amount');
      return;
    }

    setPaymentLoading(true);
    try {
      await apiRequest(`/bookings/${booking._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(paymentAmount) }),
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

    try {
      await apiRequest(`/bookings/${booking._id}/checkout`, { method: 'POST' });
      const res = await apiRequest(`/bookings/${id}`);
      setBooking(res.data.booking);
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };


const handleDownloadPDF = () => {
  router.push(`/hotel-admin/bookings/${id}/invoice`);
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20 text-red-600">
        Booking not found or failed to load
      </div>
    );
  }

 const idProofImage = booking.guest?.idProof?.image?.url;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-bold text-teal-600">#{booking.bookingNumber}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-2 text-lg text-teal-600">
            Guest: <span className="font-semibold text-gray-900">{booking.guest?.name}</span>
          </p>
          {/* NEW: Booking Source */}
          <p className="mt-1 text-base text-gray-600 flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-600" />
            Booked via: <span className="font-medium text-gray-900">{booking.source || 'Direct'}</span>
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="text-black flex items-center gap-2 px-6 py-3 bg-gray-400 hover:bg-gray-500 rounded-2xl font-medium"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>

          {booking.status === 'checked_out' && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-3 bg-teal-600 text-white font-semibold px-8 py-3 rounded-2xl hover:bg-teal-700 shadow-lg"
            >
              <Download className="h-5 w-5" /> Download Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Guest */}
          <Section title="Guest Information" icon={<User className="h-6 w-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Info label="Name" value={booking.guest?.name} />
              <Info label="Phone" value={booking.guest?.phone} icon={<Phone className="h-4 w-4" />} />
              <Info label="Email" value={booking.guest?.email || '—'} icon={<Mail className="h-4 w-4" />} />
              
              {booking.guest?.idProof && (
                <div className="space-y-2">
                  <Info 
                    label="ID Proof" 
                    value={`${booking.guest.idProof.type.toUpperCase()} - ${booking.guest.idProof.number}`} 
                  />
                 {idProofImage ? (
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Uploaded ID Proof Photo</p>
        <div 
          className="relative w-64 h-40 rounded-xl overflow-hidden border border-gray-300 shadow-md cursor-pointer group"
          onClick={() => setShowIdProofModal(true)}
        >
          <img
            src={idProofImage}
            alt={`${booking.guest.idProof.type} document`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-white text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              View Full Size
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="mt-3 p-4 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm flex items-center gap-2">
        <ImageIcon className="h-5 w-5" /> No image uploaded
      </div>
    )}
                </div>
              )}
            </div>

            {booking.specialRequests && (
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-sm font-medium text-amber-800">Special Requests</p>
                <p className="mt-2 text-amber-900">{booking.specialRequests}</p>
              </div>
            )}
          </Section>

          {/* Room & Stay */}
          <Section title="Room & Stay Details" icon={<DoorOpen className="h-6 w-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <Info label="Room" value={`Room ${booking.room?.roomNumber} - ${booking.room?.roomType}`} />
                <Info label="Nights" value={nights} />
              </div>

              <div className="space-y-4">
                <Info label="Planned Check-in" value={new Date(booking.dates.checkIn).toLocaleString('en-IN')} />
                <Info label="Planned Check-out" value={new Date(booking.dates.checkOut).toLocaleString('en-IN')} />

                {booking.dates.actualCheckIn && (
                  <Info 
                    label="Actual Check-in" 
                    value={
                      <>
                        {new Date(booking.dates.actualCheckIn).toLocaleString('en-IN')}
                        {booking.checkedInBy?.name && <span className="text-teal-600 ml-2">by {booking.checkedInBy.name}</span>}
                      </>
                    } 
                  />
                )}

                {booking.dates.actualCheckOut && (
                  <Info 
                    label="Actual Check-out" 
                    value={
                      <>
                        {new Date(booking.dates.actualCheckOut).toLocaleString('en-IN')}
                        {booking.checkedOutBy?.name && <span className="text-teal-600 ml-2">by {booking.checkedOutBy.name}</span>}
                      </>
                    } 
                  />
                )}

                <Info 
                  label="Created By" 
                  value={booking.createdBy?.name || 'System'} 
                  icon={<UserCheck className="h-4 w-4" />}
                />
              </div>
            </div>
          </Section>

          {/* Pricing Breakdown */}
          <Section title="Pricing Details" icon={<CreditCard className="h-6 w-6" />}>
            <div className="text-black space-y-4 text-lg">
              <div className="flex justify-between"><span>Room Charges</span><span className="font-medium">₹{booking.pricing?.roomCharges || 0}</span></div>
              {booking.pricing?.extraCharges > 0 && <div className="flex justify-between text-teal-600"><span>Extra Guests</span><span>+₹{booking.pricing.extraCharges}</span></div>}
              <div className="flex justify-between"><span>GST (5%)</span><span>₹{booking.pricing?.tax || 0}</span></div>
              <div className="border-t pt-4 flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-teal-600">₹{booking.pricing?.total || 0}</span>
              </div>
            </div>
          </Section>
        </div>

        {/* Right - Actions */}
        <div className="space-y-8">
          <Section title="Payment Status" icon={<CreditCard className="h-6 w-6" />}>
            <div className="text-center">
              <PaymentBadge status={booking.paymentStatus} />
              <div className="mt-6 text-4xl font-bold text-gray-900">₹{booking.advancePayment || 0}</div>
              <p className="text-sm text-gray-500 mt-2">Paid Amount</p>

              {due > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                  <p className="text-orange-700 font-semibold">Due Amount</p>
                  <p className="text-3xl font-bold text-orange-600">₹{due}</p>
                </div>
              )}

              <button
                onClick={() => setShowPayment(true)}
                className="mt-6 w-full bg-teal-600 text-white py-4 rounded-2xl font-semibold hover:bg-teal-700"
              >
                Update Payment
              </button>

              {booking.status === 'checked_in' && booking.paymentStatus === 'paid' && (
                <button
                  onClick={handleCheckout}
                  className="mt-4 w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" /> Check-out Guest
                </button>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Payment Modal - unchanged */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-black">Add Payment</h3>
              <button onClick={() => setShowPayment(false)}><X className="h-6 w-6" /></button>
            </div>

            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full text-4xl font-bold p-6 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-black"
              autoFocus
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium text-black"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentUpdate}
                disabled={paymentLoading || !paymentAmount}
                className="flex-1 bg-teal-600 text-black py-4 rounded-2xl font-semibold hover:bg-teal-700 disabled:opacity-90"
              >
                {paymentLoading ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: ID Proof Image Modal */}
      {showIdProofModal && idProofImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowIdProofModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white bg-gray-800/50 p-3 rounded-full hover:bg-gray-700"
              onClick={() => setShowIdProofModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={idProofImage}
              alt="ID Proof Full Size"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* UI Components - unchanged except minor tweaks */
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
        <div className="text-teal-600">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="font-medium text-gray-900 text-lg">{value || '—'}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-teal-100 text-teal-700',
    reserved: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-emerald-100 text-emerald-700',
    checked_out: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-6 py-2 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
    </span>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-100 text-emerald-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    pending: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-6 py-3 text-lg font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
    </span>
  );
}