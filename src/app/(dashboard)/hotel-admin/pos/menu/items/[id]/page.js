'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import { Loader2, Save, AlertCircle, ArrowLeft, Edit, Trash2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const ITEM_TYPES = ['veg', 'non-veg', 'vegan', 'beverage']
const CUISINES = ['indian', 'chinese', 'continental', 'italian', 'mexican', 'thai', 'other']
const SPICY_LEVELS = ['none', 'mild', 'medium', 'hot', 'extra-hot']

export default function MenuItemDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // ── Load item ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    loadItem()
  }, [id])

  const loadItem = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest(`/pos/items/${id}`)
      const data = res.data?.menuItem || null

      if (!data) throw new Error('Menu item not found')

      setItem(data)
      setForm({
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        type: data.type || 'veg',
        cuisine: data.cuisine || 'indian',
        spicyLevel: data.spicyLevel || 'none',
        preparationTime: data.preparationTime?.toString() || '15',
        tags: data.tags || [],
        images: data.images || [''],
        variants: data.variants?.length ? data.variants : [{ name: '', price: '' }],
        isAvailable: data.isAvailable ?? true,
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load menu item')
    } finally {
      setLoading(false)
    }
  }

  // ── Form handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // Variants
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

  // Tags
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

  // Images
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

    if (!form.name.trim()) errs.name = 'Name is required'
    else if (form.name.trim().length < 2 || form.name.trim().length > 100) {
      errs.name = 'Name must be 2–100 characters'
    }

    const priceNum = Number(form.price)
    if (!form.price || isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Valid non-negative price required'
    }

    form.variants.forEach((v, i) => {
      if (v.name.trim() && !v.price) errs[`vPrice${i}`] = 'Price required'
      if (!v.name.trim() && v.price) errs[`vName${i}`] = 'Name required'
    })

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const cleanVariants = form.variants.filter(v => v.name.trim() && v.price)
      const cleanImages = form.images.filter(url => url.trim())

      const payload = {
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
        isAvailable: form.isAvailable,
      }

      const res = await apiRequest(`/pos/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (res.data?.menuItem) {
        setSaveSuccess(true)
        setIsEditing(false)
        await loadItem() // refresh
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update item'
      setSaveError(msg)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    try {
      const res = await apiRequest(`/pos/items/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !form.isAvailable }),
      })

      if (res.data?.menuItem) {
        setForm(prev => ({ ...prev, isAvailable: res.data.menuItem.isAvailable }))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2500)
      }
    } catch (err) {
      setSaveError('Failed to toggle availability')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this menu item? This action cannot be undone.')) return

    try {
      await apiRequest(`/pos/items/${id}`, { method: 'DELETE' })
      router.push('/hotel-admin/pos/menu')
    } catch (err) {
      alert('Failed to delete item: ' + (err.response?.data?.message || err.message))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Item not found'}</p>
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
                {item.name}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                  (₹{item.price})
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  item.type === 'veg' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                  item.type === 'non-veg' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                }`}>
                  {item.type}
                </span>

                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  item.isAvailable
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 shadow-sm"
              >
                <Edit className="h-5 w-5" />
                Edit Item
              </button>

              <button
                onClick={handleToggleAvailability}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-sm text-white ${
                  form.isAvailable
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {form.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
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
            Item updated successfully
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
                    Name <span className="text-red-500">*</span>
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

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                      formErrors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.price && <p className="mt-1.5 text-sm text-red-600">{formErrors.price}</p>}
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

                {/* Prep Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Preparation Time (min)
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

                {/* Availability Toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available for ordering
                  </label>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                    className="h-5 w-5 text-[rgb(0,173,181)] rounded border-gray-300 dark:border-gray-600 focus:ring-[rgb(0,173,181)]"
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
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.tags.map((tag, i) => (
                      <div
                        key={i}
                        className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700">
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
                      placeholder="e.g. bestseller, gluten-free"
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    />
                    <button type="button" onClick={addTag} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg">
                      Add
                    </button>
                  </div>
                </div>

                {/* Variants */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Variants
                    </label>
                    <button type="button" onClick={addVariant} className="text-sm text-[rgb(0,173,181)] hover:underline flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Add Variant
                    </button>
                  </div>

                  {form.variants.map((v, i) => (
                    <div key={i} className="flex gap-3 mb-3 items-end">
                      <div className="flex-1">
                        <input
                          placeholder="e.g. Half, Full, Large"
                          value={v.name}
                          onChange={e => handleVariantChange(i, 'name', e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            formErrors[`vName${i}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {formErrors[`vName${i}`] && <p className="mt-1 text-xs text-red-600">{formErrors[`vName${i}`]}</p>}
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Price"
                          value={v.price}
                          onChange={e => handleVariantChange(i, 'price', e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            formErrors[`vPrice${i}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {formErrors[`vPrice${i}`] && <p className="mt-1 text-xs text-red-600">{formErrors[`vPrice${i}`]}</p>}
                      </div>
                      <button type="button" onClick={() => removeVariant(i)} className="p-2.5 text-red-600 hover:text-red-800">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Images */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Images
                    </label>
                    <button type="button" onClick={addImageField} className="text-sm text-[rgb(0,173,181)] hover:underline flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Add Image URL
                    </button>
                  </div>

                  {form.images.map((url, i) => (
                    <div key={i} className="flex gap-3 mb-3 items-center">
                      <input
                        type="url"
                        value={url}
                        onChange={e => handleImageChange(i, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                      />
                      <button type="button" onClick={() => removeImageField(i)} className="p-2.5 text-red-600 hover:text-red-800">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setFormErrors({}); setSaveError(null) }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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

                {/* Images */}
                {item.images?.length > 0 && (
                  <div className="md:col-span-3 lg:col-span-1">
                    <div className="grid grid-cols-2 gap-3">
                      {item.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                          <Image
                            src={img}
                            alt={`${item.name} image ${i + 1}`}
                            fill
                            className="object-cover"
                            onError={e => { e.target.src = '/placeholder-food.jpg' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic info cards */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.name}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Price</h3>
                  <p className="text-2xl font-bold text-[rgb(0,173,181)]">₹{item.price}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</h3>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                    item.isAvailable
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Type, Cuisine, Spice */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Type</h3>
                  <p className="text-lg font-semibold capitalize">{item.type}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cuisine</h3>
                  <p className="text-lg font-semibold capitalize">{item.cuisine}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Spice Level</h3>
                  <p className="text-lg font-semibold capitalize">{item.spicyLevel}</p>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</h3>
                    <p className="text-gray-900 dark:text-gray-300 whitespace-pre-line">{item.description}</p>
                  </div>
                )}

                {/* Variants */}
                {item.variants?.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Variants</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {item.variants.map((v, i) => (
                        <div key={i} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="font-medium">{v.name}</div>
                          <div className="text-[rgb(0,173,181)]">₹{v.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {item.tags?.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
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