// /src/app/(dashboard)/hotel-admin/settings/page.js

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
  Store,
  Clock,
} from 'lucide-react';

export default function HotelSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Delivery Settings
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  // Hotel Timings
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiRequest(`/hotels/${user?.hotel?._id}`);
        const hotel = res.data?.hotel;
        const settings = hotel?.settings;

        setDeliveryEnabled(settings?.deliveryEnabled || false);
        setDeliveryCharge(settings?.deliveryCharge || 0);
        setCheckInTime(settings?.checkInTime || '14:00');
        setCheckOutTime(settings?.checkOutTime || '11:00');
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.hotel?._id) fetchSettings();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await apiRequest(`/hotels/${user?.hotel?._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          settings: {
            deliveryEnabled,
            deliveryCharge: Number(deliveryCharge),
            checkInTime,
            checkOutTime,
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

      {/* Delivery Settings Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
          <Truck className="h-5 w-5 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">Delivery Settings</h3>
        </div>

        <div className="p-8 space-y-6">
          {/* Enable Delivery Toggle */}
          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
            <div>
              <p className="font-semibold text-gray-900 text-lg">Enable Delivery Orders</p>
              <p className="text-sm text-gray-500 mt-1">
                Allow customers to place delivery orders from your menu
              </p>
            </div>
            <button
              onClick={() => setDeliveryEnabled(!deliveryEnabled)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                deliveryEnabled ? 'bg-teal-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  deliveryEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Delivery Charge — only show if delivery enabled */}
          {deliveryEnabled && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Charge (₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-bold text-xl"
                />
              </div>
              <p className="text-sm mt-2 font-medium">
                {Number(deliveryCharge) === 0 ? (
                  <span className="text-green-600">🎉 Free delivery for customers</span>
                ) : (
                  <span className="text-gray-600">
                    Customers will pay <strong>₹{deliveryCharge}</strong> extra for delivery
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hotel Timings Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 bg-gray-50 border-b flex items-center gap-3">
          <Clock className="h-5 w-5 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">Check-in / Check-out Timings</h3>
        </div>

        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-in Time
            </label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-semibold text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-out Time
            </label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none text-gray-900 font-semibold text-lg"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-12 py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {success && (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {error && (
          <p className="text-red-600 font-semibold">{error}</p>
        )}
      </div>
    </div>
  );
}