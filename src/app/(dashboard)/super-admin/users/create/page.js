// app/super-admin/users/create/page.js  (or your exact path)

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { USER_ROLES } from '@/utils/constants';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: USER_ROLES.HOTEL_ADMIN,
    hotel: '',
  });

  const [hotels, setHotels] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch hotels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await apiRequest('/hotels');
        setHotels(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      }
    };

    fetchHotels();
  }, []);

  // Auto-select hotel if only one exists
  useEffect(() => {
    if (hotels.length === 1) {
      setForm((prev) => ({ ...prev, hotel: hotels[0]._id }));
    }
  }, [hotels]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/super-admin/users');
    } catch (err) {
      if (err?.errors && Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors([err.message || 'Something went wrong']);
      }
    } finally {
      setLoading(false);
    }
  };

  const isHotelRequired = form.role !== USER_ROLES.SUPER_ADMIN;

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
            <UserPlus size={28} className="text-[#00adb5]" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
              Create New User
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
                  {errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              {/* Phone */}
              <Input
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Role
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                >
                  <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                  <option value={USER_ROLES.HOTEL_ADMIN}>Hotel Admin</option>
                  <option value={USER_ROLES.MANAGER}>Manager</option>
                  <option value={USER_ROLES.CASHIER}>Cashier</option>
                  <option value={USER_ROLES.KITCHEN_STAFF}>Kitchen Staff</option>
                </select>
              </div>

              {/* Hotel - only if required */}
              {isHotelRequired && (
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                    Assign to Hotel
                  </label>
                  {hotels.length === 0 ? (
                    <p className="text-sm text-[#ff6b6b]">
                      No hotels available. Please create a hotel first.
                    </p>
                  ) : (
                    <select
                      name="hotel"
                      value={form.hotel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                    >
                      <option value="">Select Hotel</option>
                      {hotels.map((hotel) => (
                        <option key={hotel._id} value={hotel._id}>
                          {hotel.name} ({hotel.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Submit */}
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
                    Creating User...
                  </>
                ) : (
                  'Create User'
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8a8f99]">
          New user will receive login credentials via email
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