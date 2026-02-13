'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Plus, Search, RefreshCw, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function CashierBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest('/bookings') // Assume endpoint returns all bookings for hotel
      setBookings(res.data?.bookings || res.data || [])
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // Filtered bookings
const filteredBookings = bookings.filter(booking => {
  // Correct paths based on Booking.model.js
  const guestName = booking.guest?.name || ''; 
  const roomNumber = booking.room?.roomNumber?.toString() || '';

  const matchesSearch = guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        roomNumber.includes(searchQuery);

  const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

  // Correct date path
  const matchesDate = dateFilter === 'all' || 
                      (booking.dates?.checkIn && new Date(booking.dates.checkIn) >= new Date(dateFilter));

  return matchesSearch && matchesStatus && matchesDate;
});

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
        >
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
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="reserved">Reserved</option>
            <option value="checked-in">Checked-In</option>
            <option value="checked-out">Checked-Out</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-black p-3 border rounded-lg"
          />
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-xl overflow-hidden border text-black">
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/cashier/bookings/${booking._id}`)}>
                  <td className="px-6 py-4">
  <p className="font-medium">{booking.guest?.name || 'Unknown'}</p>
  <p className="text-sm text-gray-500">{booking.guest?.phone || 'No Phone'}</p>
</td>
                    <td className="px-6 py-4 text-sm">
                      {booking.room.roomNumber} ({booking.room.type})
                    </td>
                  {/* Dates Column */}
<td className="px-6 py-4 text-sm">
  {booking.dates?.checkIn && booking.dates?.checkOut ? (
    <>
      {format(new Date(booking.dates.checkIn), 'dd MMM')} - {format(new Date(booking.dates.checkOut), 'dd MMM')}
    </>
  ) : (
    <span className="text-gray-400 italic">Dates not set</span>
  )}
</td>
                   <td className="px-6 py-4 text-center">
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
    booking.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
    booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
    booking.status === 'checked_out' ? 'bg-green-100 text-green-800' :
    'bg-red-100 text-red-800'
  }`}>
    {booking.status.replace('_', ' ').toUpperCase()}
  </span>
</td>
                    <td className="px-6 py-4 text-center text-sm text-[rgb(0,173,181)] font-medium hover:underline">
                      View Details
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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