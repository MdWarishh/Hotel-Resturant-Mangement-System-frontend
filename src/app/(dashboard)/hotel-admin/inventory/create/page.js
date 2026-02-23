'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, PackagePlus, Loader2, CheckCircle2, AlertCircle,
  UserPlus, DollarSign, Scale, Archive, ToggleLeft, ToggleRight
} from 'lucide-react';

const CATEGORIES = [
  'food',
  'beverage',
  'linen',
  'toiletries',
  'cleaning',
  'amenities',
  'other',
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'packet', 'bottle', 'can'];

export default function CreateInventoryItemPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: '0',
    minStock: '',
    maxStock: '',  // ✅ Add this
    reorderPoint: '',  // ✅ Add this
    purchasePrice: '',
    supplierName: '',  // ✅ Change from 'supplier'
    supplierContact: '',  // ✅ Add this
    supplierEmail: '',  // ✅ Add this
    storageLocation: '',  // ✅ Add this
    storageConditions: 'room-temp',  // ✅ Add this
    description: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!form.name.trim()) return setError('Item name is required');
    if (!form.category) return setError('Please select a category');
    if (!form.unit) return setError('Please select a unit');
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0) {
      return setError('Valid purchase price is required');
    }

    try {
    await apiRequest('/inventory', {
  method: 'POST',
  body: JSON.stringify({
    hotel: user.hotel._id,
    name: form.name.trim(),
    category: form.category,
    unit: form.unit,
    quantity: {
      current: Number(form.currentStock) || 0,
      minimum: Number(form.minStock) || 0,
      maximum: Number(form.maxStock) || null,
    },
    pricing: {
      purchasePrice: Number(form.purchasePrice),
    },
    supplier: form.supplierName.trim() ? {
      name: form.supplierName.trim(),
      contact: form.supplierContact.trim(),
      email: form.supplierEmail.trim(),
    } : undefined,
    storage: {
      location: form.storageLocation.trim(),
      conditions: form.storageConditions,
    },
    reorderPoint: Number(form.reorderPoint) || Number(form.minStock) || 0,
    description: form.description.trim() || undefined,
    isActive: form.isActive,
  }),
});

      setSuccess(true);
      setTimeout(() => {
        router.push('/hotel-admin/inventory');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-teal-100 p-4 rounded-2xl">
            <PackagePlus className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Add New Inventory Item</h1>
            <p className="text-gray-600 mt-1">Create stock item for hotel/restaurant</p>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="flex text-black items-center gap-2 px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-2xl font-medium transition-all w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl">
          <CheckCircle2 className="h-6 w-6" />
          <span>Item created successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-10">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border text-black border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              placeholder="e.g. Tomato, Rice, Cleaning Liquid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 text-black border border-gray-200 rounded-2xl focus:border-teal-600 outline-none bg-white"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock & Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              required
              className="w-full px-5 text-black py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none bg-white"
            >
              <option value="">Select Unit</option>
              {UNITS.map(u => (
                <option key={u} value={u}>{u.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
            <input
              type="number"
              name="currentStock"
              value={form.currentStock}
              onChange={handleChange}
              min="0"
              className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level *</label>
            <input
              type="number"
              name="minStock"
              value={form.minStock}
              onChange={handleChange}
              required
              min="0"
              className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              placeholder="e.g. 10"
            />
          </div>
        </div>

        {/* Pricing & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (₹) *</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full text-black pl-12 pr-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier (optional)</label>
            <input
              type="text"
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              placeholder="e.g. Local Vendor"
            />
          </div>
        </div>

        {/* Storage Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
            <input
              type="text"
              name="storageLocation"
              value={form.storageLocation}
              onChange={handleChange}
              className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              placeholder="e.g., Store Room A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Storage Conditions</label>
            <select
              name="storageConditions"
              value={form.storageConditions}
              onChange={handleChange}
              className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none bg-white"
            >
              <option value="room-temp">Room Temperature</option>
              <option value="refrigerated">Refrigerated</option>
              <option value="frozen">Frozen</option>
              <option value="dry">Dry</option>
              <option value="cool">Cool</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full text-black px-5 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none resize-none"
            placeholder="Additional details about the item..."
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`w-14 h-8 flex items-center rounded-full cursor-pointer transition-all duration-300 ${form.isActive ? 'bg-teal-600' : 'bg-gray-300'
              }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 ${form.isActive ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {form.isActive ? 'Item is Active' : 'Item is Inactive'}
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all shadow-lg flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-6 w-6" />
              Creating Item...
            </>
          ) : (
            <>
              <PackagePlus className="h-6 w-6" />
              Create Inventory Item
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        New item will start with 0 current stock. You can adjust stock later.
      </p>
    </div>
  );
}