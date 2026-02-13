// app/super-admin/reports/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { USER_ROLES } from '@/utils/constants'
import { Loader2, AlertCircle, DollarSign, BedDouble, ShoppingCart, Package, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminReportsOverview() {
  const { user } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalRevenue: 0,
    averageOccupancy: 0,
    totalSales: 0,
    totalInventoryTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && user.role === USER_ROLES.SUPER_ADMIN) {
      fetchStats()
    } else {
      router.push('/login')
    }
  }, [user])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest('/reports/dashboard')
      const data = res.data?.stats || {}

      setStats({
        totalRevenue: data.system?.totalRevenue || 0,
        averageOccupancy: data.system?.averageOccupancy || 0,
        totalSales: data.system?.totalSales || 0,
        totalInventoryTransactions: data.inventory?.totalTransactions || 0,
      })
    } catch (err) {
      setError('Failed to load stats')
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
      <div className="p-6 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchStats}
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
        <h1 className="text-3xl font-bold mb-8">System Reports Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign />} color="text-green-600" />
          <StatCard title="Avg Occupancy" value={`${stats.averageOccupancy}%`} icon={<BedDouble />} color="text-blue-600" />
          <StatCard title="Total POS Sales" value={`₹${stats.totalSales.toLocaleString()}`} icon={<ShoppingCart />} color="text-purple-600" />
          <StatCard title="Inventory Transactions" value={stats.totalInventoryTransactions.toLocaleString()} icon={<Package />} color="text-orange-600" />
        </div>

        {/* Detailed Reports Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard title="Revenue Report" description="System-wide revenue trends" href="/super-admin/reports/revenue" color="bg-green-600" />
          <ReportCard title="Occupancy Report" description="Occupancy across all hotels" href="/super-admin/reports/occupancy" color="bg-blue-600" />
          <ReportCard title="Sales Report" description="POS sales analytics" href="/super-admin/reports/sales" color="bg-purple-600" />
          <ReportCard title="Inventory Report" description="Stock movements & costs" href="/super-admin/reports/inventory" color="bg-orange-600" />
        </div>
      </div>
    </div>
  )
}

// Reusable Stat Card
function StatCard({ title, value, icon, color }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{icon}</div>
      </div>
    </div>
  )
}

// Reusable Report Card
function ReportCard({ title, description, href, color }) {
  return (
    <Link href={href} className={`p-6 text-white rounded-xl shadow-lg ${color} hover:opacity-90 transition`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="mb-4">{description}</p>
      <span className="flex items-center gap-2 text-sm font-medium">
        View Report <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}