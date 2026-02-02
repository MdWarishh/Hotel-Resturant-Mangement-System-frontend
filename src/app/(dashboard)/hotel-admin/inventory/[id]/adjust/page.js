// app/hotel-admin/inventory/[id]/adjust/page.js  (or your exact path)

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { ArrowLeft, Package, PlusCircle, MinusCircle, Loader2 } from 'lucide-react';

export default function AdjustStockPage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'add',
    quantity: '',
    reason: 'purchase',
    unitPrice: '',
  });

  /* ---------- FETCH ITEM ---------- */
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await apiRequest(`/inventory/${id}`);
        setItem(res.data);
      } catch (err) {
        console.error('Failed to fetch item', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItem();
  }, [id]);

  /* ---------- HANDLE CHANGE ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && value === 'deduct' && prev.reason === 'purchase'
        ? { reason: 'usage' }
        : {}),
    }));
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const qty = Number(form.quantity);
      const price = Number(form.unitPrice || 0);

      await apiRequest(`/inventory/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          quantity: qty,
          reason: form.reason,
          cost: {
            unitPrice: price,
            totalPrice: price * qty,
          },
        }),
      });

      router.push(`/hotel-admin/inventory/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[#8a8f99] text-lg"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#00adb5]" />
          Loading item...
        </motion.div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-red-900/30 border border-red-800/50 p-6 text-center text-red-300 max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2">Item Not Found</h3>
          <p>The inventory item could not be loaded.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222831] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto"
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
            <Package size={28} className="text-[#00adb5]" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
                Adjust Stock
              </h2>
              <p className="text-[#8a8f99]">{item.name}</p>
            </div>
          </div>
        </div>

        {/* Current Stock Banner */}
        <div className="mb-6 bg-[#3a3f46] rounded-xl p-5 border border-[#4a5058] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#8a8f99]">Current Stock</p>
              <p className="text-2xl font-semibold text-[#eeeeee]">
                {item.quantity?.current} {item.unit}
              </p>
            </div>
            {item.quantity?.current <= (item.quantity?.minimum || 0) && (
              <span className="text-sm px-3 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30">
                Below minimum
              </span>
            )}
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
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setForm({ ...form, type: 'add', reason: 'purchase' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      form.type === 'add'
                        ? 'bg-[#00adb5]/20 border-[#00adb5] text-[#00adb5]'
                        : 'border-[#4a5058] text-[#cccccc] hover:border-[#00adb5]/50 hover:bg-[#2d333b]'
                    }`}
                  >
                    <PlusCircle size={24} />
                    <span className="font-medium">Add Stock</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setForm({ ...form, type: 'deduct', reason: 'usage' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      form.type === 'deduct'
                        ? 'bg-[#ff6b6b]/10 border-[#ff6b6b] text-[#ff6b6b]'
                        : 'border-[#4a5058] text-[#cccccc] hover:border-[#ff6b6b]/50 hover:bg-[#2d333b]'
                    }`}
                  >
                    <MinusCircle size={24} />
                    <span className="font-medium">Deduct Stock</span>
                  </motion.button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="1"
                  required
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Reason
                </label>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                >
                  {form.type === 'add' ? (
                    <>
                      <option value="purchase">Purchase / Restock</option>
                      <option value="return">Return / Refund</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="usage">Daily Usage / Consumption</option>
                      <option value="wastage">Wastage / Spoilage</option>
                      <option value="damage">Damage / Loss</option>
                      <option value="theft">Theft</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Unit Price (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Unit Price (₹) — optional
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving || !form.quantity || Number(form.quantity) <= 0}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-[#00adb5] text-[#222831] font-semibold rounded-xl shadow-xl shadow-[#00adb5]/20 hover:bg-[#00c4d1] focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Updating Stock...
                  </>
                ) : (
                  'Update Stock'
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8a8f99]">
          Changes will be recorded in transaction history
        </p>
      </motion.div>
    </div>
  );
}