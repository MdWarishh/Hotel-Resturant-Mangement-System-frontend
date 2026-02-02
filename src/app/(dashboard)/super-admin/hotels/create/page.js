// app/super-admin/hotels/create/page.js

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { ArrowLeft, Building2, Plus, Loader2, Save } from 'lucide-react';

export default function CreateHotelPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    gst: {
      number: '',
      name: '',
    },
    settings: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      taxRate: '5',
    },
    amenities: [],
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');

    if (child) {
      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setForm((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      await apiRequest('/hotels', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      router.push('/super-admin/hotels');
    } catch (err) {
      if (err?.errors && Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors([err.message || 'Failed to create hotel']);
      }
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
        className="max-w-4xl mx-auto"
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
            <Building2 size={28} className="text-[#00adb5]" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
              Create New Hotel
            </h2>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-lg bg-red-900/30 border border-red-800/50 p-4 text-sm text-red-300"
              >
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Hotel Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Grand Palace Hotel"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Hotel Code * (3-10 alphanumeric)
                  </label>
                  <input
                    name="code"
                    value={form.code.toUpperCase()}
                    onChange={(e) => handleChange({ target: { name: 'code', value: e.target.value.toUpperCase() } })}
                    placeholder="e.g. DEL001"
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 uppercase"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short description of the hotel..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Street Address *
                  </label>
                  <input
                    name="address.street"
                    value={form.address.street}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    City *
                  </label>
                  <input
                    name="address.city"
                    value={form.address.city}
                    onChange={handleChange}
                    placeholder="Delhi"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    State *
                  </label>
                  <input
                    name="address.state"
                    value={form.address.state}
                    onChange={handleChange}
                    placeholder="Delhi"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Pincode * (6 digits)
                  </label>
                  <input
                    name="address.pincode"
                    value={form.address.pincode}
                    onChange={handleChange}
                    placeholder="110001"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Phone * (10 digits)
                  </label>
                  <input
                    name="contact.phone"
                    value={form.contact.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Email *
                  </label>
                  <input
                    name="contact.email"
                    type="email"
                    value={form.contact.email}
                    onChange={handleChange}
                    placeholder="contact@hotel.com"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Website
                  </label>
                  <input
                    name="contact.website"
                    value={form.contact.website}
                    onChange={handleChange}
                    placeholder="https://www.hotel.com"
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* GST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    GST Number * (format: 22AAAAA0000A1Z5)
                  </label>
                  <input
                    name="gst.number"
                    value={form.gst.number.toUpperCase()}
                    onChange={(e) => handleChange({ target: { name: 'gst.number', value: e.target.value.toUpperCase() } })}
                    placeholder="07AAACD1234F1Z5"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Business Name (GST) *
                  </label>
                  <input
                    name="gst.name"
                    value={form.gst.name}
                    onChange={handleChange}
                    placeholder="Hotel Name Pvt Ltd"
                    required
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Check-in Time
                  </label>
                  <input
                    name="settings.checkInTime"
                    type="time"
                    value={form.settings.checkInTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Check-out Time
                  </label>
                  <input
                    name="settings.checkOutTime"
                    type="time"
                    value={form.settings.checkOutTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    name="settings.taxRate"
                    type="number"
                    value={form.settings.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Amenities
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="e.g. Free WiFi"
                    className="flex-1 px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-5 py-3 bg-[#00adb5]/20 text-[#00adb5] rounded-lg hover:bg-[#00adb5]/30 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2d333b] rounded-lg text-[#eeeeee] border border-[#4a5058]"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="text-[#ff6b6b] hover:text-[#ff8787] transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-[#00adb5] text-[#222831] font-semibold rounded-xl shadow-xl shadow-[#00adb5]/20 hover:bg-[#00c4d1] focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Hotel...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Hotel
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8a8f99]">
          All fields marked * are required. Hotel code & GST must be unique.
        </p>
      </motion.div>
    </div>
  );
}