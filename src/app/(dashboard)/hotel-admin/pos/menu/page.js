'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Plus, UtensilsCrossed, Search, AlertCircle, Layers, Upload } from 'lucide-react'
import Link from 'next/link'

export default function MenuOverviewPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Authorization
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>
  }

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use the full menu endpoint that groups items by category
      const res = await apiRequest('/pos/menu')
      setCategories(res.data?.menu || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load menu categories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalCategories = categories.length
  const totalItems = categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)
  const activeItems = categories.reduce(
    (sum, cat) => sum + (cat.items?.filter(item => item.isAvailable)?.length || 0),
    0
  )

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Menu Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage categories and items for your restaurant
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/hotel-admin/pos/menu/categories/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition"
          >
            <Plus className="h-5 w-5" />
            New Category
          </Link>
          <Link
            href="/hotel-admin/pos/menu/bulk-upload"
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition"
          >
            <Upload className="h-5 w-5" />
            Bulk Upload
          </Link>
          <Link
            href="/hotel-admin/pos/menu/items/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(0,173,181)] hover:bg-[rgb(0,173,181)]/90 text-white rounded-lg shadow transition"
          >
            <Plus className="h-5 w-5" />
            New Menu Item
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Categories" value={totalCategories} icon={<Layers className="h-8 w-8" />} color="bg-blue-50 dark:bg-blue-950/30" />
        <StatCard title="Total Menu Items" value={totalItems} icon={<UtensilsCrossed className="h-8 w-8" />} color="bg-green-50 dark:bg-green-950/30" />
        <StatCard title="Active Items" value={activeItems} icon={<UtensilsCrossed className="h-8 w-8" />} color="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories or items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[rgb(0,173,181)]" />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadMenuData}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <UtensilsCrossed className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No menu categories yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start by adding your first category
          </p>
          <Link
            href="/hotel-admin/pos/menu/categories/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((group) => (
            <CategoryCard key={group.category._id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}

// Stat Card
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`rounded-xl p-6 shadow border ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  )
}

// Category Card
function CategoryCard({ group }) {
  const { category, items } = group
  const router = useRouter()

  const activeItemsCount = items?.filter(i => i.isAvailable).length || 0

  return (
    <div
      onClick={() => router.push(`/hotel-admin/pos/menu/categories/${category._id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-[rgb(0,173,181)]/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[rgb(0,173,181)] transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
        {!category.isActive && (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs rounded-full font-medium">
            Inactive
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{items?.length || 0} items</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600 dark:text-green-400 font-medium">{activeItemsCount} active</span>
          </div>
        </div>
        <span className="text-[rgb(0,173,181)] group-hover:underline flex items-center gap-1">
          View & Edit <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  )
}