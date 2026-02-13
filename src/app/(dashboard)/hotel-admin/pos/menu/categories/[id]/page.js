'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Save, AlertCircle, ArrowLeft, Edit, Trash2, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CategoryDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])           // we'll fetch items separately
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Authorization guard
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>
  }

  // ── Fetch category + items ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    loadCategory()
  }, [id])

  const loadCategory = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get category details
      const catRes = await apiRequest(`/pos/categories/${id}`)
      const catData = catRes.data?.category || null

      if (!catData) {
        throw new Error('Category not found')
      }

      setCategory(catData)
      setForm({
        name: catData.name || '',
        description: catData.description || '',
        displayOrder: catData.displayOrder?.toString() || '0',
        image: catData.image || '',
      })

      // Get items in this category (using items endpoint with filter)
      const itemsRes = await apiRequest(`/pos/items?category=${id}`)
      setItems(itemsRes.data?.items || itemsRes.data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load category details')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const errs = {}

    if (!form.name.trim()) {
      errs.name = 'Category name is required'
    } else if (form.name.trim().length < 2 || form.name.trim().length > 50) {
      errs.name = 'Name must be 2–50 characters'
    }

    if (form.description && form.description.length > 200) {
      errs.description = 'Description max 200 characters'
    }

    if (form.displayOrder !== '') {
      const num = Number(form.displayOrder)
      if (isNaN(num) || num < 0) {
        errs.displayOrder = 'Must be non-negative number'
      }
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : 0,
        image: form.image.trim() || undefined,
      }

      const res = await apiRequest(`/pos/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (res.data?.category) {
        setSaveSuccess(true)
        setIsEditing(false)

        // Refresh data
        await loadCategory()

        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      let msg = err.response?.data?.message || 'Failed to update category'

      if (msg.includes('already exists') || msg.includes('duplicate')) {
        setFormErrors(prev => ({
          ...prev,
          name: 'Another category with this name already exists',
        }))
      } else {
        setSaveError(msg)
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this category? Items will remain but become uncategorized.')) {
      return
    }

    try {
      await apiRequest(`/pos/categories/${id}`, { method: 'DELETE' })
      router.push('/hotel-admin/pos/menu')
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Category not found'}</p>
          <Link
            href="/hotel-admin/pos/menu"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/hotel-admin/pos/menu"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Layers className="h-8 w-8 text-[rgb(0,173,181)]" />
                {category.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {items.length} items • Display order: {category.displayOrder || 0}
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 shadow-sm"
              >
                <Edit className="h-5 w-5" />
                Edit Category
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
            <Save className="h-5 w-5" />
            Category updated successfully
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isEditing ? (
            // ── EDIT FORM ─────────────────────────────────────────────────────
            <form className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.name && <p className="mt-1.5 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                      formErrors.displayOrder ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.displayOrder && (
                    <p className="mt-1.5 text-sm text-red-600">{formErrors.displayOrder}</p>
                  )}
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Category Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  />
                  {form.image && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
                      <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={form.image}
                          alt="Category preview"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg' // fallback
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] resize-y"
                    maxLength={200}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 text-right">
                    {form.description.length} / 200
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormErrors({})
                    setSaveError(null)
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-60"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // ── VIEW MODE ─────────────────────────────────────────────────────
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Image (if exists) */}
                {category.image && (
                  <div className="md:col-span-3 lg:col-span-1">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                        onError={(e) => (e.target.src = '/placeholder-category.jpg')}
                      />
                    </div>
                  </div>
                )}

                {/* Basic info */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Display Order</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{category.displayOrder || 0}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Items in Category</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {items.length} <span className="text-sm font-normal opacity-70">total</span>
                  </p>
                </div>

                {/* Description - full width if long */}
                {category.description && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</h3>
                    <p className="text-gray-900 dark:text-gray-300 whitespace-pre-line">
                      {category.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu Items in this Category
                  </h3>
                  <Link
                    href={`/hotel-admin/pos/menu/items/new?category=${id}`}
                    className="text-[rgb(0,173,181)] hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    + Add New Item
                  </Link>
                </div>

                {items.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl text-center text-gray-500 dark:text-gray-400">
                    No items in this category yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                      <Link
                        key={item._id}
                        href={`/hotel-admin/pos/menu/items/${item._id}`}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-[rgb(0,173,181)]/40 transition-all"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          ₹{item.price} • {item.type}
                        </div>
                        {item.isAvailable === false && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs rounded-full">
                            Unavailable
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}