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
    if (!booking) return

    const hotelName = booking.hotel?.name || 'Hotel'
    const hotelAddress = booking.hotel?.address
      ? `${booking.hotel.address.street || ''}, ${booking.hotel.address.city || ''}, ${booking.hotel.address.state || ''} ${booking.hotel.address.pincode || ''}`
      : ''
    const hotelPhone = booking.hotel?.contact?.phone || ''
    const hotelEmail = booking.hotel?.contact?.email || ''
    const hotelGstin = booking.hotel?.gstin || ''  // ✅ GSTIN add kiya

    const checkIn = booking.dates?.checkIn ? new Date(booking.dates.checkIn).toLocaleDateString('en-IN') : 'N/A'
    const checkOut = booking.dates?.checkOut ? new Date(booking.dates.checkOut).toLocaleDateString('en-IN') : 'N/A'
    const actualCheckIn = booking.dates?.actualCheckIn ? new Date(booking.dates.actualCheckIn).toLocaleString('en-IN') : null
    const actualCheckOut = booking.dates?.actualCheckOut ? new Date(booking.dates.actualCheckOut).toLocaleString('en-IN') : null

    const nightsCount = booking.dates?.checkIn && booking.dates?.checkOut
      ? Math.ceil((new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) / 86400000)
      : 0

    const roomCharges = booking.pricing?.roomCharges || 0
    const extraCharges = booking.pricing?.extraCharges || 0
    const tax = booking.pricing?.tax || 0
    const total = booking.pricing?.total || 0
    const advancePaid = booking.advancePayment || 0
    const dueAmount = total - advancePaid

    const payStatus = booking.paymentStatus || 'pending'
    const paidColor = payStatus === 'paid' ? '#065f46' : payStatus === 'partially_paid' ? '#92400e' : '#991b1b'
    const paidBg = payStatus === 'paid' ? '#d1fae5' : payStatus === 'partially_paid' ? '#fef3c7' : '#fee2e2'
    const payLabel = payStatus === 'paid' ? 'PAID' : payStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'PENDING'

    const invoiceHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Booking Invoice - ${booking.bookingNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; background:#fff; color:#111; padding:40px; max-width:820px; margin:0 auto; }

  /* ── HEADER ── */
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:20px; border-bottom:3px solid #111; }
  .hotel-info h1 { font-size:22px; font-weight:900; color:#111; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .hotel-info p { font-size:12px; color:#444; line-height:1.7; }
  .hotel-info .gstin { font-size:12px; font-weight:800; color:#111; background:#f5f5f5; padding:2px 8px; border-left:3px solid #c0392b; margin-top:4px; display:inline-block; }
  .invoice-title { text-align:right; }
  .invoice-title h2 { font-size:32px; font-weight:900; color:#c0392b; letter-spacing:2px; font-style:italic; }
  .invoice-title .num { font-size:14px; color:#111; font-weight:700; margin-top:4px; letter-spacing:1px; }
  .invoice-title .date { font-size:11px; color:#666; margin-top:4px; }

  /* ── INFO SECTION ── */
  .info-section { display:flex; justify-content:space-between; gap:24px; margin-bottom:28px; }
  .col { flex:1; border:1.5px solid #111; padding:14px 16px; }
  .section-label { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#c0392b; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #c0392b; }
  .info-row { display:flex; gap:8px; margin-bottom:6px; font-size:12.5px; }
  .info-label { color:#666; font-weight:500; min-width:110px; }
  .info-value { color:#111; font-weight:700; }
  .badge { display:inline-block; padding:2px 10px; border-radius:2px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; background:${paidBg}; color:${paidColor}; border:1px solid ${paidColor}; }

  /* ── TABLE ── */
  table { width:100%; border-collapse:collapse; margin-bottom:20px; border:1.5px solid #111; }
  thead tr { background:#111; }
  thead th { padding:11px 12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#fff; text-align:left; }
  thead th:last-child { text-align:right; padding-right:12px; }
  tbody tr:nth-child(even) { background:#f7f7f7; }
  tbody td { padding:11px 12px; font-size:13px; color:#111; border-bottom:1px solid #e5e5e5; }
  tbody td:last-child { text-align:right; font-weight:700; padding-right:12px; }

  /* ── TOTALS ── */
  .totals-section { display:flex; justify-content:flex-end; margin-bottom:28px; }
  .totals-box { width:300px; border:1.5px solid #111; }
  .totals-row { display:flex; justify-content:space-between; padding:9px 14px; font-size:13px; border-bottom:1px solid #ddd; }
  .totals-row:last-child { border-bottom:none; }
  .totals-row .lbl { color:#555; }
  .totals-row .val { font-weight:700; color:#111; }
  .grand { background:#111; padding:13px 14px; }
  .grand .lbl { color:#fff; font-size:14px; font-weight:800; }
  .grand .val { color:#c0392b; font-size:16px; font-weight:900; }
  .due-row { background:#fff0f0; padding:12px 14px; }
  .due-row .lbl { color:#c0392b; font-weight:800; }
  .due-row .val { color:#c0392b; font-weight:900; }

  /* ── FOOTER ── */
  .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:3px double #111; }
  .footer .ty { font-size:15px; font-weight:900; color:#c0392b; margin-bottom:4px; text-transform:uppercase; letter-spacing:2px; }
  .footer p { font-size:11px; color:#666; line-height:1.8; }

  @media print {
    body { padding:20px; }
    @page { margin:0.5cm; size:A4; }
  }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="hotel-info">
    <h1>${hotelName}</h1>
    ${hotelAddress ? `<p>${hotelAddress}</p>` : ''}
    ${hotelPhone ? `<p>Phone: ${hotelPhone}</p>` : ''}
    ${hotelEmail ? `<p>Email: ${hotelEmail}</p>` : ''}
    ${hotelGstin ? `<p class="gstin">GSTIN: ${hotelGstin}</p>` : ''}
  </div>
  <div class="invoice-title">
    <h2>Booking Invoice</h2>
    <div class="num"># ${booking.bookingNumber}</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-IN')}</div>
  </div>
</div>

<!-- Guest + Booking Info -->
<div class="info-section">
  <div class="col">
    <div class="section-label">Guest Details</div>
    <div class="info-row"><span class="info-label">Name</span><span class="info-value">${booking.guest?.name || 'N/A'}</span></div>
    ${booking.guest?.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${booking.guest.phone}</span></div>` : ''}
    ${booking.guest?.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${booking.guest.email}</span></div>` : ''}
    ${booking.guest?.idProof?.type ? `<div class="info-row"><span class="info-label">ID Proof</span><span class="info-value">${booking.guest.idProof.type.toUpperCase()} - ${booking.guest.idProof.number || ''}</span></div>` : ''}
    ${booking.source ? `<div class="info-row"><span class="info-label">Booked Via</span><span class="info-value">${booking.source}</span></div>` : ''}
  </div>
  <div class="col">
    <div class="section-label">Booking Info</div>
    <div class="info-row"><span class="info-label">Booking No</span><span class="info-value">${booking.bookingNumber}</span></div>
    <div class="info-row"><span class="info-label">Room</span><span class="info-value">Room ${booking.room?.roomNumber || 'N/A'} - ${booking.room?.roomType || ''}</span></div>
    <div class="info-row"><span class="info-label">Nights</span><span class="info-value">${nightsCount} Night${nightsCount !== 1 ? 's' : ''}</span></div>
    <div class="info-row"><span class="info-label">Check-in</span><span class="info-value">${actualCheckIn || checkIn}</span></div>
    <div class="info-row"><span class="info-label">Check-out</span><span class="info-value">${actualCheckOut || checkOut}</span></div>
    <div class="info-row"><span class="info-label">Status</span><span class="info-value">${(booking.status || '').replace('_', ' ').toUpperCase()}</span></div>
    <div class="info-row"><span class="info-label">Payment</span><span class="badge">${payLabel}</span></div>
  </div>
</div>

<!-- Charges Table -->
<table>
  <thead>
    <tr>
      <th>Description</th>
      <th>Nights</th>
      <th style="text-align:right;padding-right:12px;">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Room ${booking.room?.roomNumber || ''} - ${booking.room?.roomType || 'Room'} Charges</td>
      <td>${nightsCount} Night${nightsCount !== 1 ? 's' : ''}</td>
      <td>&#8377;${roomCharges.toLocaleString('en-IN')}</td>
    </tr>
    ${extraCharges > 0 ? `
    <tr>
      <td>Extra Guest Charges</td>
      <td>—</td>
      <td>&#8377;${extraCharges.toLocaleString('en-IN')}</td>
    </tr>` : ''}
    ${booking.specialRequests ? `
    <tr style="background:#fff8f8;">
      <td colspan="3" style="font-size:12px;color:#c0392b;padding:8px 12px;border-left:3px solid #c0392b;">
        <strong>Special Requests:</strong> ${booking.specialRequests}
      </td>
    </tr>` : ''}
  </tbody>
</table>

<!-- Totals -->
<div class="totals-section">
  <div class="totals-box">
    <div class="totals-row"><span class="lbl">Room Charges</span><span class="val">&#8377;${roomCharges.toLocaleString('en-IN')}</span></div>
    ${extraCharges > 0 ? `<div class="totals-row"><span class="lbl">Extra Charges</span><span class="val">&#8377;${extraCharges.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="totals-row"><span class="lbl">GST (5%)</span><span class="val">&#8377;${tax.toLocaleString('en-IN')}</span></div>
    <div class="totals-row grand"><span class="lbl">Total Amount</span><span class="val">&#8377;${total.toLocaleString('en-IN')}</span></div>
    <div class="totals-row" style="background:#f0fdf4;border-bottom:1px solid #ddd;">
      <span class="lbl" style="color:#166534;font-weight:700;">Advance Paid</span>
      <span class="val" style="color:#166534;">&#8377;${advancePaid.toLocaleString('en-IN')}</span>
    </div>
    ${dueAmount > 0 ? `<div class="totals-row due-row"><span class="lbl">Balance Due</span><span class="val">&#8377;${dueAmount.toLocaleString('en-IN')}</span></div>` : ''}
  </div>
</div>

<!-- Footer -->
<div class="footer">
  <p class="ty">Thank you for staying with us!</p>
  <p>This is a computer-generated invoice and does not require a signature.</p>
  ${booking.createdBy?.name ? `<p>Booking created by: ${booking.createdBy.name}</p>` : ''}
  ${hotelGstin ? `<p>GSTIN: ${hotelGstin}</p>` : ''}
  ${hotelPhone || hotelEmail ? `<p>${hotelPhone ? 'Ph: ' + hotelPhone : ''} ${hotelEmail ? '| ' + hotelEmail : ''}</p>` : ''}
</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(invoiceHTML)
    w.document.close()
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

          <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-3 bg-teal-600 text-white font-semibold px-8 py-3 rounded-2xl hover:bg-teal-700 shadow-lg"
            >
              <Download className="h-5 w-5" /> Download Invoice
            </button>
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