'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Save, AlertCircle, ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'

export default function NewCategoryPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Basic role guard
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>
  }

  const [form, setForm] = useState({
    name: '',
    description: '',
    displayOrder: '0',
    image: '', // optional URL or future file upload field
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Category name is required'
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
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : 0,
        image: form.image.trim() || undefined,
      }

      const res = await apiRequest('/pos/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      // Assuming your successResponse returns { success: true, data: { category: {...} } }
      if (res.data?.category) {
        setSubmitSuccess(true)

        // Optional: small delay so user sees success message
        setTimeout(() => {
          router.push('/hotel-admin/pos/menu')
          // or router.push(`/hotel-admin/pos/menu/categories/${res.data.category._id}`)
        }, 1400)
      }
    } catch (err) {
      console.error(err)

      let message = 'Failed to create category'

      if (err.response?.data?.message) {
        message = err.response.data.message

        // Handle specific backend errors nicely
        if (message.includes('already exists') || message.includes('duplicate')) {
          setErrors(prev => ({
            ...prev,
            name: 'A category with this name already exists',
          }))
          return
        }
      }

      setSubmitError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/hotel-admin/pos/menu"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Create New Category
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new menu category (Starters, Main Course, Beverages, etc.)
            </p>
          </div>
        </div>

        {/* Success message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
            <Save className="h-5 w-5" />
            <span>Category created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="space-y-6">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Starters, Main Course, Desserts, Beverages"
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
                placeholder="Brief description of this category (shown on POS / menu)..."
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
                Lower numbers appear first in the menu
              </p>
              {errors.displayOrder && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.displayOrder}</p>
              )}
            </div>

            {/* Image URL (optional – can be replaced with upload later) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category Image URL (optional)
              </label>
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/images/starters.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Paste a direct image link (future: file upload support planned)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/hotel-admin/pos/menu"
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
                  Create Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}