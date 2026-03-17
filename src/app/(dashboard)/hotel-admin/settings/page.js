'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Truck,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

// ─── Small reusable components ───────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
        value ? 'bg-teal-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
          value ? 'translate-x-9' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SlabEditor({ slabs, onChange }) {
  const addSlab = () =>
    onChange([...slabs, { minOrder: 0, maxOrder: '', charge: 0 }]);

  const removeSlab = (i) => onChange(slabs.filter((_, idx) => idx !== i));

  const update = (i, field, val) => {
    const updated = slabs.map((s, idx) =>
      idx === i ? { ...s, [field]: val } : s
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3 mt-3">
      {slabs.length === 0 && (
        <p className="text-sm text-gray-400 italic">No slabs added yet. Click + to add.</p>
      )}
      {slabs.map((slab, i) => (
        <div
          key={i}
          className="flex items-center gap-3 flex-wrap bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Min Order (₹)</label>
            <input
              type="number"
              min={0}
              value={slab.minOrder}
              onChange={(e) => update(i, 'minOrder', Number(e.target.value))}
              className="w-28 px-3 py-2 text-black border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Max Order (₹) <span className="text-gray-400">(blank = no limit)</span></label>
            <input
              type="number"
              min={0}
              value={slab.maxOrder === null ? '' : slab.maxOrder}
              placeholder="No limit"
              onChange={(e) =>
                update(i, 'maxOrder', e.target.value === '' ? null : Number(e.target.value))
              }
              className="w-32 px-3 py-2 text-black border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Charge (₹)</label>
            <input
              type="number"
              min={0}
              value={slab.charge}
              onChange={(e) => update(i, 'charge', Number(e.target.value))}
              className="w-24 px-3 py-2 text-black border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-semibold"
            />
          </div>
          <button
            type="button"
            onClick={() => removeSlab(i)}
            className="mt-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSlab}
        className="flex items-center gap-2 text-sm text-teal-600 font-semibold hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Slab
      </button>
    </div>
  );
}

const ORDER_TYPE_LABELS = {
  delivery: 'Delivery',
  takeaway: 'Takeaway',
  'dine-in': 'Dine-in',
  'room-service': 'Room Service',
};

// ─── Main Page ────────────────────────────────────────────────

export default function HotelSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Hotel Timings
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  // ── Delivery ──
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryChargeType, setDeliveryChargeType] = useState('fixed'); // 'fixed' | 'slab'
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliverySlabs, setDeliverySlabs] = useState([]);

  // ── Packaging ──
  const [packagingEnabled, setPackagingEnabled] = useState(false);
  const [packagingApplicableOn, setPackagingApplicableOn] = useState(['delivery', 'takeaway']);
  const [packagingChargeType, setPackagingChargeType] = useState('fixed');
  const [packagingCharge, setPackagingCharge] = useState(0);
  const [packagingSlabs, setPackagingSlabs] = useState([]);

  // ── Fetch ──
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiRequest(`/hotels/${user?.hotel?._id}`);
        const s = res.data?.hotel?.settings || {};

        setCheckInTime(s.checkInTime || '14:00');
        setCheckOutTime(s.checkOutTime || '11:00');

        setDeliveryEnabled(s.deliveryEnabled || false);
        setDeliveryChargeType(s.deliveryChargeType || 'fixed');
        setDeliveryCharge(s.deliveryCharge || 0);
        setDeliverySlabs(s.deliverySlabs || []);

        setPackagingEnabled(s.packagingEnabled || false);
        setPackagingApplicableOn(s.packagingApplicableOn || ['delivery', 'takeaway']);
        setPackagingChargeType(s.packagingChargeType || 'fixed');
        setPackagingCharge(s.packagingCharge || 0);
        setPackagingSlabs(s.packagingSlabs || []);
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    if (user?.hotel?._id) fetchSettings();
  }, [user]);

  // ── Toggle applicable order type for packaging ──
  const toggleApplicableType = (type) => {
    setPackagingApplicableOn((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await apiRequest(`/hotels/${user?.hotel?._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          settings: {
            checkInTime,
            checkOutTime,
            deliveryEnabled,
            deliveryChargeType,
            deliveryCharge: Number(deliveryCharge),
            deliverySlabs,
            packagingEnabled,
            packagingApplicableOn,
            packagingChargeType,
            packagingCharge: Number(packagingCharge),
            packagingSlabs,
          },
        }),
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-teal-100 p-3 rounded-2xl">
          <Settings className="h-7 w-7 text-teal-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your hotel preferences</p>
        </div>
      </div>

      {/* ── Delivery Settings ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
          <Truck className="h-5 w-5 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">Delivery Settings</h3>
        </div>

        <div className="p-8 space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
            <div>
              <p className="font-semibold text-gray-900 text-lg">Enable Delivery Orders</p>
              <p className="text-sm text-gray-500 mt-1">
                Allow customers to place delivery orders
              </p>
            </div>
            <Toggle value={deliveryEnabled} onChange={setDeliveryEnabled} />
          </div>

          {deliveryEnabled && (
            <>
              {/* Charge type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Delivery Charge Type
                </label>
                <div className="flex gap-3">
                  {['fixed', 'slab'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeliveryChargeType(type)}
                      className={`px-6 py-3 rounded-2xl font-semibold text-sm border-2 transition-all ${
                        deliveryChargeType === type
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      {type === 'fixed' ? '📌 Fixed Amount' : '📊 Slab Based'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed input */}
              {deliveryChargeType === 'fixed' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Charge (₹)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-bold text-xl"
                    />
                  </div>
                  <p className="text-sm mt-2 font-medium">
                    {Number(deliveryCharge) === 0 ? (
                      <span className="text-black">🎉 Free delivery for customers</span>
                    ) : (
                      <span className="text-gray-600">
                        Customers will pay <strong>₹{deliveryCharge}</strong> for delivery
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Slab editor */}
              {deliveryChargeType === 'slab' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Delivery Charge Slabs
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    e.g. Order ₹0–₹299 → ₹50 charge | ₹300+ → Free
                  </p>
                  <SlabEditor slabs={deliverySlabs} onChange={setDeliverySlabs} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Packaging Settings ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
          <Package className="h-5 w-5 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">Packaging Charge</h3>
        </div>

        <div className="p-8 space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
            <div>
              <p className="font-semibold text-gray-900 text-lg">Enable Packaging Charge</p>
              <p className="text-sm text-gray-500 mt-1">
                Add packaging fee on selected order types
              </p>
            </div>
            <Toggle value={packagingEnabled} onChange={setPackagingEnabled} />
          </div>

          {packagingEnabled && (
            <>
              {/* Applicable on */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Apply Packaging Charge On
                </label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(ORDER_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleApplicableType(key)}
                      className={`px-5 py-2.5 rounded-2xl font-semibold text-sm border-2 transition-all ${
                        packagingApplicableOn.includes(key)
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-500 hover:border-teal-300'
                      }`}
                    >
                      {packagingApplicableOn.includes(key) ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charge type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Packaging Charge Type
                </label>
                <div className="flex gap-3">
                  {['fixed', 'slab'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPackagingChargeType(type)}
                      className={`px-6 py-3 rounded-2xl font-semibold text-sm border-2 transition-all ${
                        packagingChargeType === type
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      {type === 'fixed' ? '📌 Fixed Amount' : '📊 Slab Based'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed input */}
              {packagingChargeType === 'fixed' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Packaging Charge (₹)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      value={packagingCharge}
                      onChange={(e) => setPackagingCharge(Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-bold text-xl"
                    />
                  </div>
                </div>
              )}

              {/* Slab editor */}
              {packagingChargeType === 'slab' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Packaging Charge Slabs
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    e.g. Order ₹0–₹199 → ₹20 | ₹200+ → ₹10
                  </p>
                  <SlabEditor slabs={packagingSlabs} onChange={setPackagingSlabs} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Hotel Timings ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
          <Clock className="h-5 w-5 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">Check-in / Check-out Timings</h3>
        </div>
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Time</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-semibold text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Time</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-semibold text-lg"
            />
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-12 py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {success && (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="h-5 w-5" /> {success}
          </div>
        )}
        {error && <p className="text-red-600 font-semibold">{error}</p>}
      </div>
    </div>
  );
}