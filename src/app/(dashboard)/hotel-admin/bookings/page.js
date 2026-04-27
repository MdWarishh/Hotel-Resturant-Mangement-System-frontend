'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, Loader2, Search, RefreshCw, X, 
  ChevronLeft, ChevronRight, Calendar, 
  FileText,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const hotelId = user?.hotel?._id;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 🔥 FIX 1: was 20 → now 10 per page
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    totalBookings: 0,
    checkedInToday: 0,
    pendingPayments: 0,
  });

  const [showGSTModal, setShowGSTModal] = useState(false);
  const [gstDateFrom, setGstDateFrom] = useState('');
  const [gstDateTo, setGstDateTo] = useState('');
  const [gstDownloading, setGstDownloading] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);

    let url = `/bookings?hotel=${hotelId}&page=${page}&limit=${limit}`;
    if (searchTerm)    url += `&search=${encodeURIComponent(searchTerm)}`;
    if (statusFilter)  url += `&status=${statusFilter}`;
    if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
    if (dateFrom)      url += `&checkInFrom=${dateFrom}`;
    if (dateTo)        url += `&checkInTo=${dateTo}`;

    // Stats — always full DB counts (no filters)
    const today = new Date().toISOString().split('T')[0];
    const statsCheckedInUrl = `/bookings?hotel=${hotelId}&status=checked_in&checkInFrom=${today}&checkInTo=${today}&page=1&limit=1`;
    const statsPendingUrl   = `/bookings?hotel=${hotelId}&paymentStatus=pending&page=1&limit=1`;
    const statsPartialUrl   = `/bookings?hotel=${hotelId}&paymentStatus=partially_paid&page=1&limit=1`;
    const statsTotalUrl     = `/bookings?hotel=${hotelId}&page=1&limit=1`;

    try {
      const [res, resCheckedIn, resPending, resPartial, resTotal] = await Promise.all([
        apiRequest(url),
        apiRequest(statsCheckedInUrl),
        apiRequest(statsPendingUrl),
        apiRequest(statsPartialUrl),
        apiRequest(statsTotalUrl),
      ]);

      const data = Array.isArray(res.data) ? res.data : [];
      setBookings(data);

      // 🔥 FIX 2: backend sends totalItems — fallback to total for safety
      const totalItems = res.pagination?.totalItems ?? res.pagination?.total ?? data.length;
      setTotal(totalItems);

      setStats({
        totalBookings:   resTotal.pagination?.totalItems    ?? resTotal.pagination?.total    ?? 0,
        checkedInToday:  resCheckedIn.pagination?.totalItems ?? resCheckedIn.pagination?.total ?? 0,
        pendingPayments: (resPending.pagination?.totalItems  ?? resPending.pagination?.total  ?? 0)
                       + (resPartial.pagination?.totalItems  ?? resPartial.pagination?.total  ?? 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hotelId, page, limit, searchTerm, statusFilter, paymentFilter, dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, paymentFilter, dateFrom, dateTo]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchBookings, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleCheckIn = async (id) => {
    setActionLoading(id);
    try { await apiRequest(`/bookings/${id}/checkin`, { method: 'POST' }); fetchBookings(); }
    catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCheckOut = async (id) => {
    if (!confirm('Confirm check-out?')) return;
    setActionLoading(id);
    try { await apiRequest(`/bookings/${id}/checkout`, { method: 'POST' }); fetchBookings(); }
    catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel booking?')) return;
    try { await apiRequest(`/bookings/${id}/cancel`, { method: 'POST' }); fetchBookings(); }
    catch (e) { alert(e.message); }
  };

  const handleNoShow = async (id) => {
    if (!confirm('Mark as no-show?')) return;
    try { await apiRequest(`/bookings/${id}/no-show`, { method: 'POST' }); fetchBookings(); }
    catch (e) { alert(e.message); }
  };

  const handleDelete = async (id, bookingNumber) => {
    if (!confirm(`Delete booking ${bookingNumber}? This cannot be undone.`)) return;
    setActionLoading(id);
    try { await apiRequest(`/bookings/${id}`, { method: 'DELETE' }); fetchBookings(); }
    catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const clearFilters = () => {
    setSearchTerm(''); setStatusFilter(''); setPaymentFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  // GST helpers
  const populateFinancialYear = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    if (m >= 3) { setGstDateFrom(`${y}-04-01`); setGstDateTo(`${y + 1}-03-31`); }
    else        { setGstDateFrom(`${y - 1}-04-01`); setGstDateTo(`${y}-03-31`); }
  };

  const handleGSTReportDownload = async (format) => {
    if (!gstDateFrom || !gstDateTo) { alert('Please select both start and end dates'); return; }
    if (new Date(gstDateFrom) > new Date(gstDateTo)) { alert('Start date cannot be after end date'); return; }
    setGstDownloading(true);
    try {
      const url = `/reports/gst?hotelId=${hotelId}&dateFrom=${gstDateFrom}&dateTo=${gstDateTo}&format=${format}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}${url}`,
        { method: 'GET', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!response.ok) {
        const errText = await response.text();
        try { throw new Error(JSON.parse(errText).message); } catch { throw new Error(errText || 'Failed'); }
      }
      const blob = await response.blob();
      if (blob.type === 'application/json') {
        const json = JSON.parse(await blob.text());
        throw new Error(json.message || 'Server error');
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GST_Report_${gstDateFrom}_to_${gstDateTo}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      alert('✅ GST Report downloaded successfully!');
      setShowGSTModal(false);
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setGstDownloading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Real-time overview of all reservations • {user?.hotel?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/hotel-admin/bookings/gst-report">
            <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium transition-all shadow-sm">
              <FileText className="h-4 w-4" /> GST Report
            </button>
          </Link>
          <button onClick={fetchBookings}
            className="text-black flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-all">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link href="/hotel-admin/bookings/create"
            className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-7 py-3 rounded-2xl shadow-lg transition-all active:scale-95">
            <Plus className="h-5 w-5" /> New Booking
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium">TOTAL BOOKINGS</div>
          <div className="text-6xl font-bold text-gray-900 mt-4">{stats.totalBookings}</div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium">CHECKED-IN TODAY</div>
          <div className="text-6xl font-bold text-teal-600 mt-4">{stats.checkedInToday}</div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium">PENDING PAYMENT</div>
          <div className="text-6xl font-bold text-orange-600 mt-4">{stats.pendingPayments}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-black">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-5 top-4 h-5 w-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search booking, guest name or phone..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent focus:border-teal-500 rounded-2xl text-base outline-none" />
            </div>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-transparent focus:border-teal-500 rounded-2xl text-sm outline-none min-w-[160px]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="reserved">Reserved</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-transparent focus:border-teal-500 rounded-2xl text-sm outline-none min-w-[160px]">
            <option value="">All Payment</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-transparent focus:border-teal-500 rounded-2xl text-sm outline-none" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-transparent focus:border-teal-500 rounded-2xl text-sm outline-none" />
          {(searchTerm || statusFilter || paymentFilter || dateFrom || dateTo) && (
            <button onClick={clearFilters}
              className="px-6 py-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-2xl text-sm font-medium transition-all flex items-center gap-2">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium">No bookings found</p>
            <p className="text-sm mt-2">Try adjusting your filters or create a new booking</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Booking #','Guest','Room','Dates','Amount','Status','Payment','Actions'].map(h => (
                      <th key={h} className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <Link href={`/hotel-admin/bookings/${b._id}`} className="text-teal-600 hover:text-teal-700 font-mono font-medium">
                          {b.bookingNumber}
                        </Link>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-medium text-gray-900">{b.guest?.name}</div>
                        <div className="text-sm text-gray-500">{b.guest?.phone}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-medium text-gray-900">{b.room?.roomNumber}</div>
                        <div className="text-xs text-gray-500">{b.room?.roomType}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-gray-900">{new Date(b.dates?.checkIn).toLocaleDateString('en-GB')}</div>
                        <div className="text-xs text-gray-500">to {new Date(b.dates?.checkOut).toLocaleDateString('en-GB')}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-semibold text-gray-900">₹{b.pricing?.total?.toLocaleString()}</div>
                        {b.advancePayment > 0 && (
                          <div className="text-xs text-emerald-600">Paid: ₹{b.advancePayment?.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-8 py-6"><StatusBadge status={b.status} /></td>
                      <td className="px-8 py-6"><PaymentBadge status={b.paymentStatus} /></td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {b.status === 'confirmed' && (
                            <button onClick={() => handleCheckIn(b._id)} disabled={actionLoading === b._id}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-xl transition disabled:opacity-50">
                              {actionLoading === b._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check-In'}
                            </button>
                          )}
                          {b.status === 'checked_in' && (
                            <button onClick={() => handleCheckOut(b._id)} disabled={actionLoading === b._id}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-xl transition disabled:opacity-50">
                              {actionLoading === b._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check-Out'}
                            </button>
                          )}
                          <Link href={`/hotel-admin/bookings/${b._id}`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition">
                            View
                          </Link>
                          <button onClick={() => handleDelete(b._id, b.bookingNumber)} disabled={actionLoading === b._id}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition disabled:opacity-50" title="Delete Booking">
                            {actionLoading === b._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 FIX 3: total > 0 instead of totalPages > 1 — always visible */}
            {total > 0 && (
              <div className="px-8 py-6 bg-gray-50 border-t flex items-center justify-between text-sm text-black">
                <div className="text-gray-600">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span>
                  {' '}–{' '}
                  <span className="font-semibold text-gray-900">{Math.min(page * limit, total)}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-900">{total}</span> bookings
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-all text-sm font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="font-semibold text-gray-900 px-2">
                    Page {page} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-all text-sm font-medium"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* GST Modal */}
      {showGSTModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">GST Revenue Report</h2>
                <p className="text-sm text-gray-600 mt-1">Download tax report for filing</p>
              </div>
              <button onClick={() => { setShowGSTModal(false); setGstDateFrom(''); setGstDateTo(''); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Report includes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Checked-out bookings only</li>
                    <li>Based on checkout date</li>
                    <li>GST breakdown (CGST, SGST, IGST)</li>
                    <li>Suitable for GST filing</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date <span className="text-red-500">*</span></label>
                <input type="date" value={gstDateFrom} onChange={(e) => setGstDateFrom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-emerald-600 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date <span className="text-red-500">*</span></label>
                <input type="date" value={gstDateTo} onChange={(e) => setGstDateTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-emerald-600 outline-none text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mb-6">
              {[
                { label: 'Current FY', fn: populateFinancialYear },
                { label: 'This Month', fn: () => { const t = new Date(); setGstDateFrom(new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split('T')[0]); setGstDateTo(new Date(t.getFullYear(), t.getMonth()+1, 0).toISOString().split('T')[0]); }},
                { label: 'Last Month', fn: () => { const t = new Date(); setGstDateFrom(new Date(t.getFullYear(), t.getMonth()-1, 1).toISOString().split('T')[0]); setGstDateTo(new Date(t.getFullYear(), t.getMonth(), 0).toISOString().split('T')[0]); }},
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleGSTReportDownload('pdf')} disabled={gstDownloading || !gstDateFrom || !gstDateTo}
                className="flex items-center justify-center gap-3 py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {gstDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                Download PDF
              </button>
              <button onClick={() => handleGSTReportDownload('excel')} disabled={gstDownloading || !gstDateFrom || !gstDateTo}
                className="flex items-center justify-center gap-3 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {gstDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:     'bg-gray-100 text-gray-700',
    confirmed:   'bg-teal-100 text-teal-700 border border-teal-200',
    reserved:    'bg-blue-100 text-blue-700 border border-blue-200',
    checked_in:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    checked_out: 'bg-zinc-100 text-zinc-700',
    cancelled:   'bg-red-100 text-red-700',
    no_show:     'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-block px-4 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${map[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PaymentBadge({ status }) {
  const map = {
    pending:        'bg-orange-100 text-orange-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    paid:           'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return (
    <span className={`inline-block px-4 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${map[status] || 'bg-gray-100'}`}>
      {status?.replace('_', ' ') || 'Pending'}
    </span>
  );
}