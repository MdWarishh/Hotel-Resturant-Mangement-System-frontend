'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format } from 'date-fns'

export default function CashierBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // 🔥 Pagination state
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)

  const hotelId = user?.hotel?._id

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 🔥 FIX: proper URL with pagination + filters (server-side)
      let url = `/bookings?page=${page}&limit=${limit}`
      if (hotelId)                    url += `&hotel=${hotelId}`
      if (searchQuery)                url += `&search=${encodeURIComponent(searchQuery)}`
      if (statusFilter !== 'all')     url += `&status=${statusFilter}`
      if (dateFilter)                 url += `&checkInFrom=${dateFilter}`

      const res = await apiRequest(url)

      // 🔥 FIX: backend sends res.data (array) + res.pagination.totalItems
      const data = Array.isArray(res.data) ? res.data : []
      setBookings(data)
      setTotal(res.pagination?.totalItems ?? res.pagination?.total ?? data.length)
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [hotelId, page, limit, searchQuery, statusFilter, dateFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, dateFilter])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchBookings, 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('')
    setPage(1)
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter

  const handleCheckIn = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Confirm check-in for this guest?')) return
    setActionLoading(id)
    try {
      await apiRequest(`/bookings/${id}/checkin`, { method: 'POST' })
      fetchBookings()
    } catch (err) {
      alert(err.message || 'Check-in failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckOut = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Confirm check-out for this guest?')) return
    setActionLoading(id)
    try {
      await apiRequest(`/bookings/${id}/checkout`, { method: 'POST' })
      fetchBookings()
    } catch (err) {
      alert(err.message || 'Check-out failed')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchBookings} className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-black text-3xl font-bold">Bookings</h1>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            <RefreshCw className="h-5 w-5" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search guest name or room #"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-black w-full pl-10 p-3 border rounded-lg"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-black p-3 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="reserved">Reserved</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-black p-3 border rounded-lg"
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition"
            >
              <X className="h-4 w-4" /> Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden border text-black">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[rgb(0,173,181)]" />
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Guest</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Room</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Dates</th>
                    <th className="px-6 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    bookings.map(booking => (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/cashier/bookings/${booking._id}`)}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium">{booking.guest?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{booking.guest?.phone || 'No Phone'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium">{booking.room?.roomNumber}</p>
                          <p className="text-xs text-gray-500">{booking.room?.roomType}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {booking.dates?.checkIn && booking.dates?.checkOut ? (
                            <>
                              {format(new Date(booking.dates.checkIn), 'dd MMM')} —{' '}
                              {format(new Date(booking.dates.checkOut), 'dd MMM')}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Dates not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'   ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'reserved'    ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'checked_in'  ? 'bg-teal-100 text-teal-800' :
                            booking.status === 'checked_out' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled'   ? 'bg-red-100 text-red-800' :
                            booking.status === 'no_show'     ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {(booking.status === 'confirmed' || booking.status === 'reserved') && (
                              <button
                                onClick={(e) => handleCheckIn(e, booking._id)}
                                disabled={actionLoading === booking._id}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === booking._id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check-In'}
                              </button>
                            )}
                            {booking.status === 'checked_in' && (
                              <button
                                onClick={(e) => handleCheckOut(e, booking._id)}
                                disabled={actionLoading === booking._id}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === booking._id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check-Out'}
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/cashier/bookings/${booking._id}`)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* 🔥 Pagination */}
              {total > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between text-sm text-black">
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
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition text-sm font-medium"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>
                    <span className="font-semibold text-gray-900 px-2">
                      Page {page} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition text-sm font-medium"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating New Booking Button */}
        <button
          onClick={() => router.push('/cashier/bookings/create')}
          className="fixed bottom-6 right-6 bg-[rgb(0,173,181)] text-white p-4 rounded-full shadow-lg hover:bg-[rgb(0,173,181)]/90 transition"
        >
          <Plus className="h-6 w-6" />
        </button>

      </div>
    </div>
  )
}