'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, DollarSign, BedDouble, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'

export default function ReportsOverviewPage() {
  const { user } = useAuth()

  const [stats, setStats] = useState({
    totalRevenue: 0,
    occupancyRate: 0,
    totalSales: 0,
    totalTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchSummaryStats()
    }
  }, [user])

  const fetchSummaryStats = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch revenue summary
      const revenueRes = await apiRequest('/reports/revenue')
      const occupancyRes = await apiRequest('/reports/occupancy')
      const salesRes = await apiRequest('/reports/sales')
      const inventoryRes = await apiRequest('/reports/inventory')

      setStats({
        totalRevenue: revenueRes.data?.totals?.totalRevenue || 0,
        occupancyRate: occupancyRes.data?.averageOccupancy || 0,
        totalSales: salesRes.data?.totals?.totalSales || 0,
        totalTransactions: inventoryRes.data?.summary?.totalTransactions || 0,
      })
    } catch (err) {
      setError('Failed to load summary statistics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchSummaryStats}
            className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reports Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Key metrics and access to detailed reports
            </p>
          </div>

          <button
            onClick={fetchSummaryStats}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-8 w-8 text-green-600" />}
          />
          <StatCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate}%`}
            icon={<BedDouble className="h-8 w-8 text-blue-600" />}
          />
          <StatCard
            title="POS Sales"
            value={`₹${stats.totalSales.toLocaleString()}`}
            icon={<ShoppingCart className="h-8 w-8 text-purple-600" />}
          />
          <StatCard
            title="Inventory Transactions"
            value={stats.totalTransactions}
            icon={<Package className="h-8 w-8 text-orange-600" />}
          />
        </div>

        {/* Report Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard
            title="Revenue Report"
            description="Detailed breakdown of revenue sources, trends, and totals"
            href="/hotel-admin/reports/revenue"
            color="bg-green-600"
          />
          <ReportCard
            title="Occupancy Report"
            description="Room utilization, ADR, RevPAR, and occupancy trends"
            href="/hotel-admin/reports/occupancy"
            color="bg-blue-600"
          />
          <ReportCard
            title="Sales Report"
            description="POS sales analysis, top items, and order metrics"
            href="/hotel-admin/reports/sales"
            color="bg-purple-600"
          />
          <ReportCard
            title="Inventory Report"
            description="Stock movements, costs, and transaction history"
            href="/hotel-admin/reports/inventory"
            color="bg-orange-600"
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}

// Report Card Component
function ReportCard({ title, description, href, color }) {
  return (
    <Link href={href} className={`block rounded-xl p-6 shadow-lg text-white ${color} hover:opacity-90 transition-opacity`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/90 mb-4">{description}</p>
      <span className="font-medium">View Report →</span>
    </Link>
  )
}