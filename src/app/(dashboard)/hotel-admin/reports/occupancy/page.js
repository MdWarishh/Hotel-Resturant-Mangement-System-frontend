'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Calendar, Download, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

export default function OccupancyReportPage() {
  const { user } = useAuth()

  const [report, setReport] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Default: last 30 days
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchOccupancyReport()
  }, [startDate, endDate])

  // src/app/hotel-admin/reports/occupancy/page.js

const fetchOccupancyReport = async () => {
  setLoading(true)
  setError(null)

  try {
    const params = new URLSearchParams({ startDate, endDate })
    const res = await apiRequest(`/reports/occupancy?${params.toString()}`)

    // Use optional chaining and default values to prevent crashes
    const formattedData = (res.data.report || []).map(item => ({
      date: item.date,
      occupancyRate: Number((item.occupancyRate || 0).toFixed(1)),
      totalRoomNights: item.totalRoomNights || 0,
      availableRoomNights: item.availableRoomNights || 0,
      occupiedRooms: item.occupiedRooms || 0,
      adr: Number((item.adr || 0).toFixed(2)),
      revpar: Number((item.revpar || 0).toFixed(2)),
    }))

    setReport(formattedData)
    
    // Ensure summary has default values so the SummaryCard doesn't break
    setSummary({
      averageOccupancy: res.data.summary?.averageOccupancy || 0,
      totalRoomNights: res.data.summary?.totalRoomNights || 0,
      adr: res.data.summary?.adr || 0,
      revpar: res.data.summary?.revpar || 0,
    })
  } catch (err) {
    setError(err.message || 'Failed to load occupancy report')
  } finally {
    setLoading(false)
  }
}

  const handleExport = () => {
    if (report.length === 0) return

    const headers = [
      'Date',
      'Occupancy Rate (%)',
      'Room Nights Sold',
      'Available Room Nights',
      'Occupied Rooms',
      'ADR (₹)',
      'RevPAR (₹)'
    ]

    const rows = report.map(r => [
      r.date,
      r.occupancyRate,
      r.totalRoomNights,
      r.availableRoomNights,
      r.occupiedRooms,
      r.adr,
      r.revpar
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `occupancy-report-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Occupancy Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Room utilization, ADR, RevPAR and occupancy trends
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={loading || report.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={fetchOccupancyReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchOccupancyReport}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchOccupancyReport}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : report.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No occupancy data found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting the date range or check if rooms/bookings exist
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <SummaryCard
                title="Average Occupancy"
                value={`${summary.averageOccupancy || 0}%`}
                color="text-blue-600"
              />
              <SummaryCard
                title="Total Room Nights Sold"
                value={summary.totalRoomNights || 0}
                color="text-green-600"
              />
              <SummaryCard
                title="Average Daily Rate (ADR)"
                value={`₹${summary.adr?.toLocaleString() || '0'}`}
                color="text-purple-600"
              />
              <SummaryCard
                title="Revenue Per Available Room (RevPAR)"
                value={`₹${summary.revpar?.toLocaleString() || '0'}`}
                color="text-orange-600"
              />
            </div>

            {/* Occupancy Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Occupancy Rate Trend
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value) => [`${value}%`, 'Occupancy']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="occupancyRate"
                      name="Occupancy Rate"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Date</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Occupancy (%)</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Room Nights Sold</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Available Nights</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Occupied Rooms</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">ADR (₹)</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">RevPAR (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {row.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                          {row.occupancyRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.totalRoomNights}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.availableRoomNights}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.occupiedRooms}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.adr.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.revpar.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Helper Components
function SummaryCard({ title, value, color = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}