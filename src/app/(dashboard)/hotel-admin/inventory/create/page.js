'use client';

// app/hotel-admin/inventory/create/page.js  (or your exact path)


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, PackagePlus, Loader2, Check } from 'lucide-react';

const CATEGORIES = [
  'food',
  'beverage',
  'supplies',
  'cleaning',
  'amenities',
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'packet', 'bottle', 'can'];

export default function CreateInventoryItemPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    minStock: '',
    purchasePrice: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* -------- HANDLE CHANGE -------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /* -------- SUBMIT -------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          hotel: user.hotel._id,        // ✅ REQUIRED
          name: form.name,
          category: form.category,
          unit: form.unit,
          quantity: {
            current: 0,                // ✅ REQUIRED
            minimum: Number(form.minStock),
          },
          pricing: {
            purchasePrice: Number(form.purchasePrice), // ✅ REQUIRED
          },
          isActive: form.isActive,
        }),
      });

      router.push('/hotel-admin/inventory');
    } catch (err) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#222831] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-[#cccccc] hover:text-[#00adb5] transition-colors p-2 rounded-lg hover:bg-[#3a3f46]"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <PackagePlus size={28} className="text-[#00adb5]" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
              Add Inventory Item
            </h2>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-lg bg-red-900/30 border border-red-800/50 p-4 text-sm text-red-300 text-center"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAME */}
              <Input
                label="Item Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Toilet Paper Rolls"
                required
              />

              {/* CATEGORY */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* UNIT */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Unit
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                >
                  <option value="">Select unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* PURCHASE PRICE */}
              <Input
                label="Purchase Price (₹)"
                type="number"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />

              {/* MIN STOCK */}
              <Input
                label="Minimum Stock Level (Alert)"
                type="number"
                name="minStock"
                value={form.minStock}
                onChange={handleChange}
                placeholder="e.g., 50"
                min="0"
                required
              />

              {/* ACTIVE CHECKBOX */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-[#4a5058] bg-[#2d333b] text-[#00adb5] focus:ring-[#00adb5]/30 checked:bg-[#00adb5] checked:border-[#00adb5] transition-all duration-200 cursor-pointer"
                  />
                  {form.isActive && (
                    <Check
                      size={16}
                      className="absolute inset-0 m-auto text-[#222831] pointer-events-none"
                    />
                  )}
                </div>
                <label className="text-sm text-[#eeeeee] cursor-pointer">
                  Item is active and available for use
                </label>
              </div>

              {/* SUBMIT */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-[#00adb5] text-[#222831] font-semibold rounded-xl shadow-xl shadow-[#00adb5]/20 hover:bg-[#00c4d1] focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Item...
                  </>
                ) : (
                  'Create Inventory Item'
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8a8f99]">
          New items start with zero current stock
        </p>
      </motion.div>
    </div>
  );
}

/* ---------- INPUT ---------- */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
      />
    </div>
  );
}