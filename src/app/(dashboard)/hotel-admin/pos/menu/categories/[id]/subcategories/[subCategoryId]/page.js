'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, AlertCircle, ArrowLeft, Edit, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SubCategoryDetailPage() {
  const { id: categoryId, subCategoryId } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [category, setCategory] = useState(null)
  const [subCategory, setSubCategory] = useState(null)
  const [items, setItems] = useState([])
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

  useEffect(() => {
    if (!categoryId || !subCategoryId) return
    loadData()
  }, [categoryId, subCategoryId])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get parent category
      const catRes = await apiRequest(`/pos/categories/${categoryId}`)
      const catData = catRes.data?.category || null

      if (!catData) {
        throw new Error('Category not found')
      }

      setCategory(catData)

      // Get sub-category details
      const subCatRes = await apiRequest(`/pos/subcategories/${subCategoryId}`)
      const subCatData = subCatRes.data?.subCategory || null

      if (!subCatData) {
        throw new Error('Sub-category not found')
      }

      setSubCategory(subCatData)
      setForm({
        name: subCatData.name || '',
        description: subCatData.description || '',
        displayOrder: subCatData.displayOrder?.toString() || '0',
        image: subCatData.image || '',
      })

      // Get items in this sub-category
      const itemsRes = await apiRequest(`/pos/items?subCategory=${subCategoryId}`)
      setItems(itemsRes.data?.items || itemsRes.data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load sub-category details')
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
      errs.name = 'Sub-category name is required'
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

      const res = await apiRequest(`/pos/subcategories/${subCategoryId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (res.data?.subCategory) {
        setSaveSuccess(true)
        setIsEditing(false)
        await loadData()
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      let msg = err.response?.data?.message || 'Failed to update sub-category'
      setSaveError(msg)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this sub-category? Items will remain in the category.')) {
      return
    }

    try {
      await apiRequest(`/pos/subcategories/${subCategoryId}`, { method: 'DELETE' })
      router.push(`/hotel-admin/pos/categories/${categoryId}`)
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

  if (error || !subCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Sub-category not found'}</p>
          <Link
            href={`/hotel-admin/pos/categories/${categoryId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Category
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/hotel-admin/pos/menu/categories/${categoryId}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{category?.name}</span>
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {subCategory.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Sub-category Details
              </p>
            </div>

            {!isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit sub-category"
                >
                  <Edit className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete sub-category"
                >
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          {isEditing ? (
            // ── EDIT MODE ──────────────────────────────────────────────────────
            <form className="p-6 md:p-8">
              {saveSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Loader2 className="h-5 w-5" />
                  Sub-category updated successfully!
                </div>
              )}

              {saveError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {saveError}
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Sub-Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                    )}
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
                      Sub-Category Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      value={form.image}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                    />
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
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // ── VIEW MODE ───────────────────────────────────────────────────────
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Basic info */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{subCategory.name}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Display Order</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{subCategory.displayOrder || 0}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Items in Sub-Category</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {items.length} <span className="text-sm font-normal opacity-70">total</span>
                  </p>
                </div>

                {/* Description - full width if long */}
                {subCategory.description && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</h3>
                    <p className="text-gray-900 dark:text-gray-300 whitespace-pre-line">
                      {subCategory.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu Items
                  </h3>
                  <Link
                    href={`/hotel-admin/pos/menu/items/new?category=${categoryId}&subCategory=${subCategoryId}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Link>
                </div>

                {items.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl text-center text-gray-500 dark:text-gray-400">
                    No items in this sub-category yet
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