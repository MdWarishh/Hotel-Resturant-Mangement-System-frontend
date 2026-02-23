'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Save, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewSubCategoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const categoryId = params?.id  // ✅ FIX: params key is 'id' not 'categoryId'

  console.log('📌 Params:', params)
  console.log('📌 Category ID:', categoryId)

  // Basic role guard
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>
  }

  const [category, setCategory] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    displayOrder: '0',
    image: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [fetchingCategory, setFetchingCategory] = useState(true)

  // Fetch parent category details
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        console.log('🔄 Fetching category:', categoryId)
        const res = await apiRequest(`/pos/categories/${categoryId}`)
        console.log('✅ Category fetched:', res)
        if (res.data?.category) {
          setCategory(res.data.category)
        }
      } catch (err) {
        console.error('❌ Failed to fetch category:', err)
        setSubmitError('Failed to load parent category')
      } finally {
        setFetchingCategory(false)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Sub-category name is required'
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (form.name.trim().length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters'
    }

    if (form.description && form.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters'
    }

    if (form.displayOrder !== '') {
      const order = Number(form.displayOrder)
      if (isNaN(order) || order < 0) {
        newErrors.displayOrder = 'Display order must be a non-negative number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const payload = {
        category: categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : 0,
        image: form.image.trim() || undefined,
      }

      console.log('📤 Sending payload:', payload)

      const res = await apiRequest('/pos/subcategories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      console.log('✅ Response:', res)

      if (res.data?.subCategory) {
        setSubmitSuccess(true)

        // Redirect back to category detail page
        setTimeout(() => {
          // ✅ FIX: Correct path with (dashboard)
          router.push(`/(dashboard)/hotel-admin/pos/menu/categories/${categoryId}`)
        }, 1400)
      }
    } catch (err) {
      console.error('❌ Error:', err)

      let message = 'Failed to create sub-category'

      if (err.response?.data?.message) {
        message = err.response.data.message

        if (message.includes('already exists') || message.includes('duplicate')) {
          setErrors(prev => ({
            ...prev,
            name: 'A sub-category with this name already exists',
          }))
          return
        }

        if (message.includes('Unauthorized') || message.includes('unauthorized')) {
          setSubmitError('❌ Authorization failed. Please login again.')
          return
        }
      }

      setSubmitError(message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          {/* ✅ FIX: Correct path with (dashboard) */}
          <Link
            href={`/hotel-admin/pos/menu/categories/${categoryId}`}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Create Sub-Category
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {category && `Under "${category.name}" category`}
            </p>
          </div>
        </div>

        {/* Success message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
            <Save className="h-5 w-5" />
            <span>Sub-category created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{submitError}</p>
              <p className="text-sm mt-1">
                💡 Tip: Make sure you're logged in and the token is valid.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="space-y-6">

            {/* Parent Category Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Parent Category:</strong> {category?.name || 'Loading...'}
              </p>
            </div>

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
                placeholder="e.g. Fried Starters, Steamed Items, etc."
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of this sub-category..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] resize-y"
                maxLength={200}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 text-right">
                {form.description.length} / 200
              </p>
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Display Order (optional)
              </label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className={`w-full sm:w-1/3 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.displayOrder ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Lower numbers appear first
              </p>
              {errors.displayOrder && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.displayOrder}</p>
              )}
            </div>

            {/* Image URL (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sub-Category Image URL (optional)
              </label>
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/images/fried-starters.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Paste a direct image link
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
            {/* ✅ FIX: Correct path with (dashboard) */}
            <Link
              href={`/(dashboard)/hotel-admin/pos/menu/categories/${categoryId}`}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-center transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || submitSuccess}
              className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-medium flex items-center justify-center gap-2 shadow disabled:opacity-60 min-w-[180px] transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Sub-Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}