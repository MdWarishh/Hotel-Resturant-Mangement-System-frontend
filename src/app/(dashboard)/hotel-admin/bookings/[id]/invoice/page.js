'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { Printer, Loader2, Download, Mail, Phone, MapPin, Building2, Calendar } from 'lucide-react';

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

  const handleDownloadPDF = () => {
    window.print();
  };

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

  // Calculate duration
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

  // Generate Invoice Number
  const getInvoiceNumber = () => {
    if (booking.invoiceNumber) {
      return booking.invoiceNumber;
    }
    const bookingNum = booking.bookingNumber.replace(/[^0-9]/g, '');
    const invoiceNum = parseInt(bookingNum) || 1;
    return `INV-${invoiceNum.toString().padStart(4, '0')}`;
  };

  const invoiceNumber = getInvoiceNumber();
  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
          >
            <Printer className="h-5 w-5" />
            Print Invoice
          </button>
        </div>

        {/* Invoice Container */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white px-10 py-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" 
                   style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'}}>
              </div>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left - Invoice Info */}
              <div>
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-teal-100 text-sm font-medium mb-4">
                  Tax Invoice
                </div>
                <h1 className="text-5xl font-bold tracking-tight mb-3">INVOICE</h1>
                <div className="flex items-center gap-2 text-teal-100 text-lg mb-2">
                  <span className="font-mono font-semibold">#{invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-teal-200 text-sm">
                  <span>Booking: {booking.bookingNumber}</span>
                </div>
                <div className="mt-6 space-y-2 text-teal-100">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Invoice Date: {new Date().toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                  </div>
                </div>
              </div>

              {/* Right - Hotel Info */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-3 mb-2">
                  <Building2 className="h-8 w-8" />
                  <h2 className="text-3xl font-bold">{booking.hotel?.name}</h2>
                </div>
                <div className="space-y-1.5 text-teal-100 text-sm">
                  {booking.hotel?.address && (
                    <div className="flex items-start justify-end gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {booking.hotel.address.street}, {booking.hotel.address.city}<br/>
                        {booking.hotel.address.state} - {booking.hotel.address.zipCode}
                      </span>
                    </div>
                  )}
                 {booking.hotel?.contact?.phone && (
  <div className="flex items-center justify-end gap-2">
    <Phone className="h-4 w-4" />
    <span>+91 {booking.hotel.contact.phone}</span>
  </div>
)}

{booking.hotel?.contact?.email && (
  <div className="flex items-center justify-end gap-2">
    <Mail className="h-4 w-4" />
    <span>{booking.hotel.contact.email}</span>
  </div>
)}

{booking.hotel?.contact?.website && (
  <div className="flex items-center justify-end gap-2">
    <span>{booking.hotel.contact.website}</span>
  </div>
)}
                  {booking.hotel?.email && (
                    <div className="flex items-center justify-end gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{booking.hotel.email}</span>
                    </div>
                  )}
                  {booking.hotel?.gstNumber && (
                    <div className="mt-3 pt-3 border-t border-teal-500/30">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold">GSTIN:</span>
                        <span className="font-mono">{booking.hotel.gstNumber}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guest & Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-gray-50">
            {/* Bill To */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Billed To
              </div>
              <div className="space-y-2">
                <div className="text-xl font-bold text-gray-900">{booking.guest?.name}</div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{booking.guest?.phone}</span>
                </div>
                {booking.guest?.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{booking.guest.email}</span>
                  </div>
                )}
                {booking.guest?.idProof && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <span className="font-semibold">ID Proof:</span> {booking.guest.idProof.type.toUpperCase()} - {booking.guest.idProof.number}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Booking Details
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Booking Type:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {booking.bookingType === 'hourly' ? 'Hourly Stay' : 'Daily Stay'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Room:</span>
                  <span className="font-semibold text-gray-900">{booking.room?.roomNumber} ({booking.room?.roomType})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Check-in:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.dates.checkIn).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Check-out:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.dates.checkOut).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600 text-sm">Duration:</span>
                  <span className="font-bold text-teal-700">
                    {duration} {isHourly ? (duration === 1 ? 'Hour' : 'Hours') : (duration === 1 ? 'Night' : 'Nights')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Booking Source:</span>
                  <span className="font-semibold text-gray-900">{booking.source}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="px-10 py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Charge Details</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-center py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-gray-900">
                      {isHourly ? 'Hourly Room Charges' : 'Room Charges'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Room {booking.room?.roomNumber} - {booking.room?.roomType}
                    </div>
                  </td>
                  <td className="py-4 text-center font-medium text-gray-700">{duration}</td>
                  <td className="py-4 text-right font-medium text-gray-700">
                    {formatCurrency(Math.round(subtotal / duration))}
                  </td>
                  <td className="py-4 text-right font-semibold text-gray-900">{formatCurrency(subtotal)}</td>
                </tr>

                {extra > 0 && (
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-teal-700">Extra Guest Charges</div>
                      <div className="text-sm text-gray-500">Additional charges for extra guests</div>
                    </td>
                    <td className="py-4 text-center">-</td>
                    <td className="py-4 text-right">-</td>
                    <td className="py-4 text-right font-semibold text-teal-700">{formatCurrency(extra)}</td>
                  </tr>
                )}

                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-gray-900">GST (5%)</div>
                    <div className="text-sm text-gray-500">Goods and Services Tax</div>
                  </td>
                  <td className="py-4 text-center">-</td>
                  <td className="py-4 text-right">-</td>
                  <td className="py-4 text-right font-semibold text-gray-900">{formatCurrency(tax)}</td>
                </tr>

                <tr className="bg-gradient-to-r from-teal-50 to-teal-100 font-bold border-t-2 border-teal-200">
                  <td className="py-5 text-lg" colSpan="3">
                    <span className="text-gray-900">Total Amount</span>
                  </td>
                  <td className="py-5 text-right text-2xl text-teal-700">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-10 py-8 border-t-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Payment Status
                </div>
                <div className={`text-2xl font-bold capitalize ${
                  booking.paymentStatus === 'paid' ? 'text-green-600' :
                  booking.paymentStatus === 'partial' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {booking.paymentStatus.replace('_', ' ')}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Amount Paid
                </div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paid)}</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Balance Due
                </div>
                <div className={`text-2xl font-bold ${due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(due)}
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="px-10 py-6 bg-gray-50 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check-in time: 2:00 PM | Check-out time: 12:00 PM</li>
              <li>• Late check-out may be subject to additional charges</li>
              <li>• Payment is due at the time of booking unless otherwise arranged</li>
              <li>• Cancellation policy as per hotel terms</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-10 py-6 text-center">
            <p className="text-sm">
              Thank you for choosing <span className="font-bold">{booking.hotel?.name}</span>
            </p>
            <p className="text-xs text-teal-200 mt-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
           {booking.hotel?.contact?.website && (
  <p className="text-xs text-teal-200 mt-1">
    Visit us at: <span className="font-semibold">{booking.hotel.contact.website}</span>
  </p>
)}
          </div>

        </div>

        {/* Print Tip */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p>💡 Tip: Click "Download PDF" and select "Save as PDF" in the print dialog</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            margin: 0;
            size: A4;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}