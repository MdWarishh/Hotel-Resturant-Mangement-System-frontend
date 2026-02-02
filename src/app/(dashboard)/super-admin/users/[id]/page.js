// app/super-admin/users/[id]/page.js  (or your exact path)

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { ArrowLeft, UserCog, Loader2, Save } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 🔹 Fetch user by ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest(`/users/${id}`);
        setUser(res.data);
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          status: user.status,
        }),
      });

      router.push('/super-admin/users');
    } catch (err) {
      setError(err.message || 'Update failed');
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
          Loading user details...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-red-900/30 border border-red-800/50 p-6 text-center text-red-300 max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2">User Not Found</h3>
          <p>The requested user could not be loaded.</p>
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
            <UserCog size={28} className="text-[#00adb5]" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
                Edit User
              </h2>
              <p className="text-[#8a8f99]">{user.email}</p>
            </div>
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  value={user.name || ''}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                />
              </div>

              {/* Email (disabled/read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Email Address
                </label>
                <input
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-[#2d333b]/70 border border-[#4a5058] rounded-lg text-[#8a8f99] cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={user.phone || ''}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1.5">
                  Account Status
                </label>
                <select
                  name="status"
                  value={user.status || 'active'}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-[#00adb5] text-[#222831] font-semibold rounded-xl shadow-xl shadow-[#00adb5]/20 hover:bg-[#00c4d1] focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update User
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8a8f99]">
          Changes will take effect immediately
        </p>
      </motion.div>
    </div>
  );
}