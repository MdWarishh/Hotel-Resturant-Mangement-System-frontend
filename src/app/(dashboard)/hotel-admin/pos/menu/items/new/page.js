'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Save, AlertCircle, ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

const ITEM_TYPES = ['veg', 'non-veg', 'vegan', 'beverage']
const CUISINES = ['indian', 'chinese', 'continental', 'italian', 'mexican', 'thai', 'other']
const SPICY_LEVELS = ['none', 'mild', 'medium', 'hot', 'extra-hot']

export default function NewMenuItemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-select category if coming from category detail page
  const preSelectedCategory = searchParams.get('category') || ''

  // Authorization
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>
  }

  const [form, setForm] = useState({
    category: preSelectedCategory,
    subCategory: '',
    name: '',
    description: '',
    price: '',
    type: 'veg',
    cuisine: 'indian',
    spicyLevel: 'none',
    preparationTime: '15',
    tags: [],
    images: [''],
    variants: [{ name: '', price: '' }],
    allergens: [],
  })

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Subcategory states
  const [subCategories, setSubCategories] = useState([])
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)

  const [errors, setErrors] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Load categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiRequest('/pos/categories')
        setCategories(res.data?.categories || [])
      } catch (err) {
        console.error('Failed to load categories', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.category) {
      setSubCategories([])
      setForm(prev => ({ ...prev, subCategory: '' }))
      return
    }

    const loadSubCategories = async () => {
      setLoadingSubCategories(true)
      try {
        const res = await apiRequest(`/pos/subcategories?category=${form.category}`)
        setSubCategories(res.data?.subCategories || [])
      } catch (err) {
        console.error('Failed to load subcategories', err)
        setSubCategories([])
      } finally {
        setLoadingSubCategories(false)
      }
    }

    loadSubCategories()
    // Reset subcategory selection when category changes
    setForm(prev => ({ ...prev, subCategory: '' }))
  }, [form.category])

  // If preSelectedCategory is set on mount, load its subcategories too
  useEffect(() => {
    if (preSelectedCategory) {
      const loadInitialSubCategories = async () => {
        setLoadingSubCategories(true)
        try {
          const res = await apiRequest(`/pos/subcategories?category=${preSelectedCategory}`)
          setSubCategories(res.data?.subCategories || [])
        } catch (err) {
          console.error('Failed to load subcategories', err)
        } finally {
          setLoadingSubCategories(false)
        }
      }
      loadInitialSubCategories()
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  // ── Variants management ───────────────────────────────────────────────
  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '' }],
    }))
  }

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const handleVariantChange = (index, field, value) => {
    setForm(prev => {
      const newVariants = [...prev.variants]
      newVariants[index] = { ...newVariants[index], [field]: value }
      return { ...prev, variants: newVariants }
    })
  }

  // ── Tags management ──────────────────────────────────────────────────
  const [newTag, setNewTag] = useState('')
  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  // ── Images URL management ────────────────────────────────────────────
  const addImageField = () => {
    setForm(prev => ({ ...prev, images: [...prev.images, ''] }))
  }

  const removeImageField = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleImageChange = (index, value) => {
    setForm(prev => {
      const newImages = [...prev.images]
      newImages[index] = value
      return { ...prev, images: newImages }
    })
  }

  const validateForm = () => {
    const errs = {}

    if (!form.category) {
      errs.category = 'Please select a category'
    }

    if (!form.name.trim()) {
      errs.name = 'Item name is required'
    } else if (form.name.trim().length < 2 || form.name.trim().length > 100) {
      errs.name = 'Name must be 2–100 characters'
    }

    const priceNum = Number(form.price)
    if (!form.price || isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Valid non-negative price is required'
    }

    // Variants validation (at least name & price if any)
    form.variants.forEach((v, i) => {
      if (v.name.trim() && !v.price) {
        errs[`variantPrice${i}`] = 'Price required for this variant'
      }
      if (!v.name.trim() && v.price) {
        errs[`variantName${i}`] = 'Name required for this variant'
      }
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // Clean up empty variants & images
      const cleanVariants = form.variants.filter(v => v.name.trim() && v.price)
      const cleanImages = form.images.filter(url => url.trim())

      const payload = {
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        type: form.type,
        cuisine: form.cuisine,
        spicyLevel: form.spicyLevel,
        preparationTime: Number(form.preparationTime) || 15,
        tags: form.tags.length ? form.tags : undefined,
        images: cleanImages.length ? cleanImages : undefined,
        variants: cleanVariants.length ? cleanVariants : undefined,
        // subCategory is optional — only send if selected
        subCategory: form.subCategory || undefined,
      }

      const res = await apiRequest('/pos/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res.data?.menuItem) {
        setSubmitSuccess(true)
        setTimeout(() => {
          // Redirect to category detail if we came from there
          if (preSelectedCategory) {
            router.push(`/hotel-admin/pos/menu/categories/${preSelectedCategory}`)
          } else {
            router.push('/hotel-admin/pos/menu')
          }
        }, 1400)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create menu item'
      setSubmitError(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={preSelectedCategory ? `/hotel-admin/pos/menu/categories/${preSelectedCategory}` : '/hotel-admin/pos/menu'}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Add New Menu Item
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create a new dish or beverage for your menu
            </p>
          </div>
        </div>

        {/* Messages */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
            <Save className="h-5 w-5" />
            <span>Menu item created successfully! Redirecting...</span>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                    errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category && <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* Sub Category — appears only when category is selected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sub-Category
                <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              {!form.category ? (
                <div className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-sm">
                  Select a category first
                </div>
              ) : loadingSubCategories ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading sub-categories...
                </div>
              ) : subCategories.length === 0 ? (
                <div className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-sm">
                  No sub-categories for this category
                </div>
              ) : (
                <select
                  name="subCategory"
                  value={form.subCategory}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                >
                  <option value="">None (no sub-category)</option>
                  {subCategories.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Butter Chicken, Masala Dosa, Fresh Lime Soda"
                className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="240.00"
                className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                  errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.price && <p className="mt-1.5 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              >
                {ITEM_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Cuisine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cuisine
              </label>
              <select
                name="cuisine"
                value={form.cuisine}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              >
                {CUISINES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Spicy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Spice Level
              </label>
              <select
                name="spicyLevel"
                value={form.spicyLevel}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
              >
                {SPICY_LEVELS.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Preparation Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                name="preparationTime"
                value={form.preparationTime}
                onChange={handleChange}
                min="1"
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
                rows={3}
                placeholder="Short description, ingredients highlights, serving suggestion..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] resize-y"
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tags / Keywords
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="e.g. spicy, gluten-free, bestseller"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Variants */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Variants / Portions
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm text-[rgb(0,173,181)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Variant
                </button>
              </div>

              {form.variants.map((variant, index) => (
                <div key={index} className="flex gap-3 mb-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Variant name (e.g. Half, Full, Large)"
                      value={variant.name}
                      onChange={e => handleVariantChange(index, 'name', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors[`variantName${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`variantName${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variantName${index}`]}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={e => handleVariantChange(index, 'price', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors[`variantPrice${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`variantPrice${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variantPrice${index}`]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2.5 text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image URLs
                </label>
                <button
                  type="button"
                  onClick={addImageField}
                  className="text-sm text-[rgb(0,173,181)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Image URL
                </button>
              </div>

              {form.images.map((url, index) => (
                <div key={index} className="flex gap-3 mb-3 items-center">
                  <input
                    type="url"
                    value={url}
                    onChange={e => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="p-2.5 text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href={preSelectedCategory ? `/hotel-admin/pos/menu/categories/${preSelectedCategory}` : '/hotel-admin/pos/menu'}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitLoading || submitSuccess}
              className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-medium flex items-center justify-center gap-2 shadow disabled:opacity-60 min-w-[180px]"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Menu Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}