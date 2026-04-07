// frontend/src/app/(dashboard)/hotel-admin/bookings/gst-report/page.js

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function BookingsGSTReportPage() {
  const { user } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [exporting, setExporting] = useState(false);

  const setQuickFilter = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        end   = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end   = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        end   = new Date().toISOString().split('T')[0];
        break;
      default: return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) { setError('Please select start and end dates'); return; }
    if (new Date(startDate) > new Date(endDate)) { setError('Start date cannot be after end date'); return; }

    try {
      setLoading(true);
      setError('');
      const token    = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/gst/bookings?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch report');
      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!startDate || !endDate) { setError('Please select dates first'); return; }
    try {
      setExporting(true);
      const token    = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/gst/bookings/excel?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GST_Report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookings GST Report</h1>
        <p className="text-gray-500 text-sm">Generate GST reports for room bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {['today', 'week', 'month', 'year'].map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm capitalize"
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 Days' : f === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchReport} disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
      </div>

      {/* Report */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings',  value: reportData.summary.totalBookings, prefix: '',  color: 'text-blue-600',   emoji: '📋' },
              { label: 'Taxable Revenue', value: fmt(reportData.summary.totalRevenue), prefix: '₹', color: 'text-green-600',  emoji: '💰' },
              { label: 'Total GST',       value: fmt(reportData.summary.totalGST),     prefix: '₹', color: 'text-purple-600', emoji: '🧾' },
              { label: 'Grand Total',     value: fmt(reportData.summary.totalNet),     prefix: '₹', color: 'text-orange-600', emoji: '💵' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <span className="text-xl">{card.emoji}</span>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.prefix}{card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button onClick={exportToExcel} disabled={exporting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Bookings', 'Taxable Revenue', 'GST', 'Grand Total'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{day.bookings}</td>
                      <td className="px-5 py-3 text-gray-700">₹{fmt(day.revenue)}</td>
                      <td className="px-5 py-3 text-gray-700">₹{fmt(day.gst)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">₹{fmt(day.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="px-5 py-3 text-gray-900">TOTAL</td>
                    <td className="px-5 py-3 text-gray-900">{reportData.summary.totalBookings}</td>
                    <td className="px-5 py-3 text-gray-900">₹{fmt(reportData.summary.totalRevenue)}</td>
                    <td className="px-5 py-3 text-gray-900">₹{fmt(reportData.summary.totalGST)}</td>
                    <td className="px-5 py-3 text-gray-900">₹{fmt(reportData.summary.totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed GST Table — matches your Excel columns exactly */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed GST Breakup</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {[
                      'Booking #', 'Invoice #', 'Invoice Date', 'Guest Name', 'Room',
                      'Check-in', 'Check-out', 'Nights',
                      'Room Charges', 'Discount', 'Taxable Amt',
                      'CGST %', 'CGST', 'SGST %', 'SGST',
                      'Total GST', 'Final Amt',
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.bookings.map((b, i) => (
                    <tr key={b.bookingId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{b.bookingId}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.invoiceNumber}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmtDate(b.invoiceDate)}</td>
                      <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{b.guestName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.roomNumber}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmtDate(b.checkIn)}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmtDate(b.checkOut)}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{b.nights}</td>
                      <td className="px-3 py-2 text-right text-gray-700">₹{fmt(b.roomCharges)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">₹{fmt(b.discount)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">₹{fmt(b.taxableAmount)}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{(b.gstRate / 2).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-right text-gray-700">₹{fmt(b.cgst)}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{(b.gstRate / 2).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-right text-gray-700">₹{fmt(b.sgst)}</td>
                      {/* <td className="px-3 py-2 text-center text-gray-600">0%</td>
                      <td className="px-3 py-2 text-right text-gray-700">₹{fmt(b.igst)}</td> */}
                      <td className="px-3 py-2 text-right text-purple-700 font-medium">₹{fmt(b.totalGST)}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-700">₹{fmt(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 font-bold text-gray-900 border-t-2 border-blue-200">
                  <tr>
                    <td className="px-3 py-3" colSpan={8}>TOTAL</td>
                    <td className="px-3 py-3 text-right">₹{fmt(reportData.summary.totalRevenue)}</td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right">₹{fmt(reportData.summary.totalRevenue)}</td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right">
                      ₹{fmt(reportData.bookings.reduce((s, b) => s + (b.cgst || 0), 0))}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right">
                      ₹{fmt(reportData.bookings.reduce((s, b) => s + (b.sgst || 0), 0))}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right">₹0.00</td>
                    <td className="px-3 py-3 text-right text-purple-700">₹{fmt(reportData.summary.totalGST)}</td>
                    <td className="px-3 py-3 text-right text-green-700">₹{fmt(reportData.summary.totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-500">Select a date range and click "Generate Report" to view GST data</p>
        </div>
      )}
    </div>
  );
}