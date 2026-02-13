'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Calendar, Download, RefreshCw, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts'

export default function SalesReportPage() {
  const { user } = useAuth()

  const [report, setReport] = useState([])
  const [topItems, setTopItems] = useState([])
  const [totals, setTotals] = useState({
    totalSales: 0,
    orderCount: 0,
    avgOrderValue: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Default: last 30 days
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [groupBy, setGroupBy] = useState('day')

  useEffect(() => {
    fetchSalesReport()
  }, [startDate, endDate, groupBy])

  const fetchSalesReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy,
      })

      const res = await apiRequest(`/reports/sales?${params.toString()}`)

      // Format main report data for charts/table
      const formattedReport = res.data.report.map(item => ({
        period: item._id,
        totalSales: item.totalSales,
        orderCount: item.orderCount,
        avgOrderValue: item.avgOrderValue,
      }))

      setReport(formattedReport)
      setTopItems(res.data.topItems || [])
      setTotals(res.data.totals || {
        totalSales: 0,
        orderCount: 0,
        avgOrderValue: 0,
      })
    } catch (err) {
      setError(err.message || 'Failed to load sales report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (report.length === 0) return

    const headers = ['Period', 'Total Sales (₹)', 'Order Count', 'Avg Order Value (₹)']
    const rows = report.map(r => [
      r.period,
      r.totalSales,
      r.orderCount,
      r.avgOrderValue.toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${startDate}-to-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sales Report (POS)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              POS order volume, revenue, average check and top-selling items
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
              onClick={fetchSalesReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-8">
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
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
              onClick={fetchSalesReport}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : report.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sales data found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try changing the date range or check if any orders exist
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <SummaryCard
                title="Total Sales"
                value={`₹${totals.totalSales?.toLocaleString() || '0'}`}
                color="text-green-600"
              />
              <SummaryCard
                title="Total Orders"
                value={totals.orderCount?.toLocaleString() || '0'}
                color="text-blue-600"
              />
              <SummaryCard
                title="Average Order Value"
                value={`₹${totals.avgOrderValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}`}
                color="text-purple-600"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Sales Trend - Line Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Sales Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalSales"
                        name="Total Sales"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgOrderValue"
                        name="Avg Order Value"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Items - Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Top 10 Selling Items
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="_id" stroke="#9CA3AF" width={150} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                        formatter={(value, name) => [value, name === 'quantity' ? 'Quantity' : 'Revenue']}
                      />
                      <Legend />
                      <Bar dataKey="quantity" name="Quantity Sold" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="revenue" name="Revenue (₹)" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Period</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total Sales (₹)</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Orders</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Avg Order Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {row.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{row.totalSales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          ₹{row.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Items Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top 10 Selling Items
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Item Name</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Quantity Sold</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{item.revenue.toLocaleString()}
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

// Helper Component
function SummaryCard({ title, value, color = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}