'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, Calendar, Download, RefreshCw, Package, ArrowUpDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

export default function InventoryReportPage() {
  const { user } = useAuth()

  const [report, setReport] = useState([])
  const [summary, setSummary] = useState({ totalTransactions: 0, totalCost: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionType, setTransactionType] = useState('') // all, in, out, adjust, etc.

  useEffect(() => {
    fetchInventoryReport()
  }, [startDate, endDate, transactionType])

  const fetchInventoryReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })
      if (transactionType) params.append('transactionType', transactionType)

      const res = await apiRequest(`/reports/inventory?${params.toString()}`)

      // Format data for charts & table
      const formattedReport = res.data.report.map(item => ({
        item: item._id.item,
        type: item._id.type,
        totalQuantity: item.totalQuantity,
        totalCost: item.totalCost,
        transactionCount: item.transactionCount,
      }))

      setReport(formattedReport)
      setSummary(res.data.summary || { totalTransactions: 0, totalCost: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load inventory report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (report.length === 0) return

    const headers = ['Item Name', 'Transaction Type', 'Total Quantity', 'Total Cost (₹)', 'Transaction Count']
    const rows = report.map(r => [
      r.item,
      r.type,
      r.totalQuantity,
      r.totalCost,
      r.transactionCount
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${startDate}-to-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Prepare data for pie chart (total cost by transaction type)
  const pieData = Object.entries(
    report.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.totalCost
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inventory Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stock movements, transaction types, quantities and costs
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
              onClick={fetchInventoryReport}
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
                Transaction Type
              </label>
              <select
                value={transactionType}
                onChange={e => setTransactionType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              >
                <option value="">All Types</option>
                <option value="in">In (Purchase/Receive)</option>
                <option value="out">Out (Issue/Consume)</option>
                <option value="adjust">Adjustment</option>
                {/* Add more types if your system has them */}
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
              onClick={fetchInventoryReport}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : report.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No inventory transactions found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting the date range or transaction type filter
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <SummaryCard
                title="Total Transactions"
                value={summary.totalTransactions.toLocaleString()}
                color="text-blue-600"
              />
              <SummaryCard
                title="Total Cost"
                value={`₹${summary.totalCost?.toLocaleString() || '0'}`}
                color="text-green-600"
              />
              <SummaryCard
                title="Items Tracked"
                value={new Set(report.map(r => r.item)).size}
                color="text-purple-600"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Transaction Volume by Type - Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Transaction Volume by Type
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(
                      report.reduce((acc, item) => {
                        acc[item.type] = (acc[item.type] || 0) + item.transactionCount
                        return acc
                      }, {})
                    ).map(([type, count]) => ({ type, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="type" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="Transaction Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Distribution by Type - Pie Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Cost Distribution by Transaction Type
                </h3>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Cost']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Item Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Type</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Quantity</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total Cost (₹)</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {row.item}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            row.type === 'in' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                            row.type === 'out' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.totalQuantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{row.totalCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {row.transactionCount}
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

// Helper
function SummaryCard({ title, value, color = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}