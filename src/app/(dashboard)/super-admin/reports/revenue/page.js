// app/super-admin/reports/revenue/page.js

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { USER_ROLES } from '@/utils/constants'
import { Loader2, AlertCircle, Calendar, Download, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts'

export default function SuperAdminRevenueReport() {
  const { user } = useAuth()

  const [report, setReport] = useState([])
  const [totals, setTotals] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [groupBy, setGroupBy] = useState('day')

  useEffect(() => {
    if (user && user.role === USER_ROLES.SUPER_ADMIN) {
      fetchRevenue()
    }
  }, [startDate, endDate, groupBy, user])

  const fetchRevenue = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy,
      })

      const res = await apiRequest(`/reports/revenue?${params.toString()}`)

      const formatted = res.data?.report?.map(item => ({
        period: item._id,
        totalRevenue: item.totalRevenue || 0,
        roomRevenue: item.roomRevenue || 0,
        foodRevenue: item.foodRevenue || 0,
        taxCollected: item.taxCollected || 0,
        invoiceCount: item.invoiceCount || 0,
      })) || []

      setReport(formatted)
      setTotals(res.data?.totals || {})
    } catch (err) {
      setError('Failed to load revenue report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (report.length === 0) return

    const headers = ['Period', 'Total Revenue', 'Room Revenue', 'Food Revenue', 'Tax', 'Invoices']
    const rows = report.map(r => [
      r.period,
      r.totalRevenue,
      r.roomRevenue,
      r.foodRevenue,
      r.taxCollected,
      r.invoiceCount
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${startDate}-to-${endDate}.csv`
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
              Revenue Report (System-Wide)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Aggregated revenue across all hotels
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={loading || report.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={fetchRevenue}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
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
              onClick={fetchRevenue}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : report.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No revenue data</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try changing the date range or check if bookings/orders exist
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              <SummaryCard title="Total Revenue" value={`₹${totals.totalRevenue?.toLocaleString() || '0'}`} color="text-green-600" />
              <SummaryCard title="Room Revenue" value={`₹${totals.roomRevenue?.toLocaleString() || '0'}`} color="text-blue-600" />
              <SummaryCard title="Food Revenue" value={`₹${totals.foodRevenue?.toLocaleString() || '0'}`} color="text-purple-600" />
              <SummaryCard title="Tax Collected" value={`₹${totals.taxCollected?.toLocaleString() || '0'}`} color="text-orange-600" />
              <SummaryCard title="Invoices" value={totals.invoiceCount || 0} color="text-gray-900 dark:text-white" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Revenue Trend - Line Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Revenue Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                      <Legend />
                      <Line type="monotone" dataKey="totalRevenue" name="Total" stroke="#10B981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="roomRevenue" name="Room" stroke="#3B82F6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="foodRevenue" name="Food" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Breakdown - Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Revenue Breakdown
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
                      <Legend />
                      <Bar dataKey="roomRevenue" name="Room" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="foodRevenue" name="Food" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="taxCollected" name="Tax" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Period</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total Revenue</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Room Revenue</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Food Revenue</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Tax</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {row.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{row.totalRevenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.roomRevenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.foodRevenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.taxCollected.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.invoiceCount}
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

// Reusable Summary Card
function SummaryCard({ title, value, color }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}