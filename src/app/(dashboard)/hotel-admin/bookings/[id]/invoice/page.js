'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { Loader2 } from 'lucide-react';

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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 40, height: 40, color: '#0d9488' }} className="animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return <div style={{ textAlign: 'center', padding: '80px', color: '#dc2626' }}>Invoice not found</div>;
  }

  const isHourly = booking.bookingType === 'hourly';
  const duration = isHourly
    ? booking.hours
    : Math.ceil((new Date(booking.dates.checkOut) - new Date(booking.dates.checkIn)) / 86400000);

  const subtotal = booking.pricing?.roomCharges || 0;
  const extra = booking.pricing?.extraCharges || 0;
  const tax = booking.pricing?.tax || 0;
  const total = booking.pricing?.total || 0;
  const paid = booking.advancePayment || 0;
  const due = total - paid;

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const contact = booking.hotel?.contact || {};

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif; }

        .page-wrapper {
          min-height: 100vh;
          background: #f3f4f6;
          padding: 32px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .action-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          justify-content: flex-end;
          width: 100%;
          max-width: 794px;
        }

        .btn {
          padding: 10px 22px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.88; }
        .btn-print { background: #0d9488; color: #fff; }
        .btn-download { background: #2563eb; color: #fff; }

        /* A4 invoice */
        .invoice {
          width: 794px;
          background: #fff;
          box-shadow: 0 4px 32px rgba(0,0,0,0.13);
        }

        /* HEADER */
        .inv-header {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%);
          color: #fff;
          padding: 36px 40px 28px;
          position: relative;
          overflow: hidden;
        }
        .inv-header::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
        }
        .inv-header::after {
          content: '';
          position: absolute;
          bottom: -60px; left: 40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .inv-header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          position: relative;
          z-index: 1;
        }
        .inv-tag {
          display: inline-block;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px;
          padding: 3px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
          color: #ccfbf1;
        }
        .inv-title {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1;
          margin-bottom: 8px;
        }
        .inv-number {
          font-family: monospace;
          font-size: 15px;
          font-weight: 600;
          color: #99f6e4;
          margin-bottom: 14px;
        }
        .inv-date-row {
          font-size: 12px;
          color: #ccfbf1;
        }

        .hotel-side {
          text-align: right;
        }
        .hotel-name {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
          line-height: 1.2;
        }
        .hotel-detail {
          font-size: 12px;
          color: #ccfbf1;
          margin-bottom: 5px;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 6px;
          line-height: 1.4;
        }

        /* STATUS STRIP */
        .status-strip {
          background: #f0fdf4;
          border-top: 3px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 8px 40px;
          gap: 8px;
        }
        .status-badge {
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-partial { background: #fef3c7; color: #b45309; }
        .badge-unpaid { background: #fee2e2; color: #b91c1c; }

        /* BODY */
        .inv-body {
          padding: 28px 40px;
        }

        /* 2-col info */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .info-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px 18px;
          background: #fafafa;
        }
        .info-card-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .guest-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: #374151;
          margin-bottom: 4px;
        }
        .info-icon {
          width: 14px;
          height: 14px;
          color: #6b7280;
          flex-shrink: 0;
        }
        .id-proof {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e5e7eb;
          font-size: 11px;
          color: #6b7280;
        }

        .booking-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 5px 0;
          border-bottom: 1px dotted #f3f4f6;
        }
        .booking-row:last-child { border-bottom: none; }
        .booking-row-label { color: #6b7280; }
        .booking-row-value { font-weight: 600; color: #111827; }
        .booking-row-duration { color: #0d9488; font-weight: 700; }

        /* TABLE */
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #0d9488;
          display: inline-block;
        }
        .charges-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .charges-table thead tr {
          background: #f0fdfa;
          border-bottom: 2px solid #0d9488;
        }
        .charges-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #0f766e;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .charges-table th:last-child,
        .charges-table td:last-child { text-align: right; }
        .charges-table th:nth-child(2),
        .charges-table td:nth-child(2),
        .charges-table th:nth-child(3),
        .charges-table td:nth-child(3) { text-align: center; }
        .charges-table tbody tr { border-bottom: 1px solid #f3f4f6; }
        .charges-table tbody tr:hover { background: #f9fafb; }
        .charges-table td {
          padding: 10px 12px;
          color: #374151;
          vertical-align: middle;
        }
        .row-main { font-weight: 600; color: #111827; font-size: 13px; }
        .row-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .extra-label { color: #0f766e; font-weight: 600; }
        .total-row {
          background: linear-gradient(90deg, #f0fdfa, #ccfbf1);
          font-weight: 700;
        }
        .total-row td {
          padding: 14px 12px;
          font-size: 14px;
          color: #0f766e;
          border-top: 2px solid #0d9488;
        }
        .total-amount { font-size: 20px; font-weight: 800; color: #0f766e; }

        /* PAYMENT SUMMARY */
        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
          background: #f0fdfa;
          border: 1px solid #99f6e4;
          border-radius: 10px;
          padding: 16px;
        }
        .pay-card {
          text-align: center;
        }
        .pay-card + .pay-card {
          border-left: 1px solid #99f6e4;
        }
        .pay-label {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 4px;
        }
        .pay-value { font-size: 20px; font-weight: 800; }
        .pay-total { color: #0f766e; }
        .pay-paid { color: #15803d; }
        .pay-due-green { color: #15803d; }
        .pay-due-orange { color: #b45309; }

        /* TERMS */
        .terms {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 0;
        }
        .terms-title {
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
        }
        .terms-list {
          list-style: none;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.8;
        }
        .terms-list li::before { content: '✦ '; color: #0d9488; }

        /* FOOTER */
        .inv-footer {
          background: linear-gradient(135deg, #0f766e, #0d9488);
          color: #fff;
          text-align: center;
          padding: 18px 40px;
        }
        .inv-footer p { font-size: 12px; color: #ccfbf1; margin-top: 4px; }
        .inv-footer .thank-you {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
        }

        /* Divider line */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 20px 0;
        }

        @media print {
          html, body { background: #fff !important; }
          .page-wrapper { background: #fff !important; padding: 0 !important; }
          .action-bar { display: none !important; }
          .invoice {
            box-shadow: none !important;
            width: 100% !important;
            page-break-inside: avoid;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="page-wrapper">
        {/* Action Buttons */}
        <div className="action-bar">
          <button className="btn btn-download" onClick={() => window.print()}>
            ⬇ Download PDF
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            🖨 Print Invoice
          </button>
        </div>

        {/* INVOICE */}
        <div className="invoice">

          {/* HEADER */}
          <div className="inv-header">
            <div className="inv-header-grid">
              {/* Left */}
              <div>
                <div className="inv-tag">Tax Invoice</div>
                <div className="inv-title">INVOICE</div>
                <div className="inv-number">#{booking.bookingNumber}</div>
                <div className="inv-date-row">📅 Invoice Date: {today}</div>
              </div>
              {/* Right */}
              <div className="hotel-side">
                <div className="hotel-name">{booking.hotel?.name}</div>
                {booking.hotel?.address && (
                  <div className="hotel-detail">
                    <span>
                      {booking.hotel.address.street}, {booking.hotel.address.city}<br />
                      {booking.hotel.address.state} - {booking.hotel.address.zipCode}
                    </span>
                    <span>📍</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="hotel-detail">
                    <span>+91 {contact.phone}</span>
                    <span>📞</span>
                  </div>
                )}
                {contact.email && (
                  <div className="hotel-detail">
                    <span>{contact.email}</span>
                    <span>✉</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STATUS STRIP */}
          <div className="status-strip">
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Payment Status:</span>
            <span className={`status-badge ${
              booking.paymentStatus === 'paid' ? 'badge-paid' :
              booking.paymentStatus === 'partial' ? 'badge-partial' : 'badge-unpaid'
            }`}>
              {booking.paymentStatus?.replace('_', ' ')}
            </span>
          </div>

          {/* BODY */}
          <div className="inv-body">

            {/* Guest & Booking Info */}
            <div className="info-grid">
              {/* Bill To */}
              <div className="info-card">
                <div className="info-card-label">Billed To</div>
                <div className="guest-name">{booking.guest?.name}</div>
                {booking.guest?.phone && (
                  <div className="info-row">
                    <span className="info-icon">📞</span>
                    <span>{booking.guest.phone}</span>
                  </div>
                )}
                {booking.guest?.email && (
                  <div className="info-row">
                    <span className="info-icon">✉</span>
                    <span>{booking.guest.email}</span>
                  </div>
                )}
                {booking.guest?.idProof && (
                  <div className="id-proof">
                    <strong>ID:</strong> {booking.guest.idProof.type?.toUpperCase()} — {booking.guest.idProof.number}
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="info-card">
                <div className="info-card-label">Booking Details</div>
                <div className="booking-row">
                  <span className="booking-row-label">Booking Type</span>
                  <span className="booking-row-value" style={{ textTransform: 'capitalize' }}>{booking.bookingType?.replace('-', ' ')}</span>
                </div>
                <div className="booking-row">
                  <span className="booking-row-label">Room</span>
                  <span className="booking-row-value">{booking.room?.roomNumber} ({booking.room?.roomType})</span>
                </div>
                <div className="booking-row">
                  <span className="booking-row-label">Check-in</span>
                  <span className="booking-row-value" style={{ fontSize: 12 }}>{fmtDate(booking.dates.checkIn)}</span>
                </div>
                <div className="booking-row">
                  <span className="booking-row-label">Check-out</span>
                  <span className="booking-row-value" style={{ fontSize: 12 }}>{fmtDate(booking.dates.checkOut)}</span>
                </div>
                <div className="booking-row" style={{ marginTop: 4 }}>
                  <span className="booking-row-label">Duration</span>
                  <span className="booking-row-duration">
                    {duration} {isHourly ? (duration === 1 ? 'Hour' : 'Hours') : (duration === 1 ? 'Night' : 'Nights')}
                  </span>
                </div>
              </div>
            </div>

            {/* Charges Table */}
            <div className="section-title">Charge Details</div>
            <table className="charges-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="row-main">{isHourly ? 'Hourly Room Charges' : 'Room Charges'}</div>
                    <div className="row-sub">Room {booking.room?.roomNumber} — {booking.room?.roomType}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{duration}</td>
                  <td style={{ textAlign: 'center' }}>{fmt(Math.round(subtotal / duration))}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(subtotal)}</td>
                </tr>

                {extra > 0 && (
                  <tr>
                    <td>
                      <div className="row-main extra-label">Extra Guest Charges</div>
                      <div className="row-sub">Additional charges for extra guests</div>
                    </td>
                    <td style={{ textAlign: 'center', color: '#9ca3af' }}>—</td>
                    <td style={{ textAlign: 'center', color: '#9ca3af' }}>—</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f766e' }}>{fmt(extra)}</td>
                  </tr>
                )}

                <tr>
                  <td>
                    <div className="row-main">GST (5%)</div>
                    <div className="row-sub">Goods &amp; Services Tax</div>
                  </td>
                  <td style={{ textAlign: 'center', color: '#9ca3af' }}>—</td>
                  <td style={{ textAlign: 'center', color: '#9ca3af' }}>—</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(tax)}</td>
                </tr>

                <tr className="total-row">
                  <td colSpan="3" style={{ fontWeight: 700, fontSize: 14 }}>Total Amount</td>
                  <td style={{ textAlign: 'right' }}><span className="total-amount">{fmt(total)}</span></td>
                </tr>
              </tbody>
            </table>

            {/* Payment Summary */}
            <div className="payment-grid">
              <div className="pay-card">
                <div className="pay-label">Total Amount</div>
                <div className={`pay-value pay-total`}>{fmt(total)}</div>
              </div>
              <div className="pay-card">
                <div className="pay-label">Amount Paid</div>
                <div className="pay-value pay-paid">{fmt(paid)}</div>
              </div>
              <div className="pay-card">
                <div className="pay-label">Balance Due</div>
                <div className={`pay-value ${due > 0 ? 'pay-due-orange' : 'pay-due-green'}`}>{fmt(due)}</div>
              </div>
            </div>

            {/* Terms */}
            <div className="terms">
              <div className="terms-title">Terms &amp; Conditions</div>
              <ul className="terms-list">
                <li>Check-in time: 2:00 PM &nbsp;|&nbsp; Check-out time: 12:00 PM</li>
                <li>Late check-out may be subject to additional charges</li>
                <li>Payment is due at the time of booking unless otherwise arranged</li>
                <li>Cancellation policy as per hotel terms</li>
              </ul>
            </div>
          </div>

          {/* FOOTER */}
          <div className="inv-footer">
            <div className="thank-you">Thank you for choosing {booking.hotel?.name}!</div>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            {contact.website && <p>🌐 {contact.website}</p>}
          </div>

        </div>

        {/* Print tip */}
        <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          💡 Click "Download PDF" → select "Save as PDF" in the print dialog
        </div>
      </div>
    </>
  );
}