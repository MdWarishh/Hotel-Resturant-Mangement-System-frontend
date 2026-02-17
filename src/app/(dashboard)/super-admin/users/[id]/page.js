'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { ArrowLeft, UserCog, Loader2, Save, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Password reset state
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]         = useState('');
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSaving, setPwdSaving]           = useState(false);
  const [pwdError, setPwdError]             = useState('');
  const [pwdSuccess, setPwdSuccess]         = useState('');

  // ─── Fetch user ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest(`/users/${id}`);
        // handle both res.data.user and res.data shapes
        const userData = res?.data?.user ?? res?.data ?? res;
        setUser(userData);
      } catch (err) {
        setError('Failed to load user. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Update user info (name, phone, status, role)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest(`/users/${id}`, {
        method: 'PUT',
        // headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:   user.name,
          phone:  user.phone,
          status: user.status,
          role:   user.role,
        }),
      });

      setSuccess('User updated successfully!');
      setTimeout(() => router.push('/super-admin/users'), 1500);
    } catch (err) {
      setError(err?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      return setPwdError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPwd) {
      return setPwdError('Passwords do not match');
    }

    setPwdSaving(true);
    try {
      await apiRequest(`/users/${id}/reset-password`, {
        method: 'POST',
        // headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      setPwdSuccess('Password reset successfully!');
      setNewPassword('');
      setConfirmPwd('');
      setTimeout(() => { setPwdSuccess(''); setShowPwdSection(false); }, 2500);
    } catch (err) {
      setPwdError(err?.message || 'Password reset failed. Please try again.');
    } finally {
      setPwdSaving(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
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
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[#3a3f46] rounded-lg text-[#cccccc] hover:text-[#00adb5] transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222831] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
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
              <p className="text-[#8a8f99] text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* ── Edit Info Card ── */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="p-6 sm:p-8">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 rounded-lg bg-red-900/30 border border-red-800/50 p-4 text-sm text-red-300 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  key="suc"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 rounded-lg bg-green-900/30 border border-green-800/50 p-4 text-sm text-green-300 text-center flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <Field label="Full Name">
                <input
                  name="name"
                  value={user.name || ''}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className={inputClass}
                />
              </Field>

              {/* Email (read-only) */}
              <Field label="Email Address">
                <input
                  value={user.email || ''}
                  disabled
                  className={disabledClass}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone Number">
                <input
                  name="phone"
                  value={user.phone || ''}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={inputClass}
                />
              </Field>

              {/* Role */}
              <Field label="Role">
                <select
                  name="role"
                  value={user.role || 'cashier'}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="hotel_admin">Hotel Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                </select>
              </Field>

              {/* Status */}
              <Field label="Account Status">
                <select
                  name="status"
                  value={user.status || 'active'}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⛔ Inactive</option>
                  <option value="suspended">🔒 Suspended</option>
                </select>
              </Field>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-[#00adb5] text-[#222831] font-semibold rounded-xl shadow-lg shadow-[#00adb5]/20 hover:bg-[#00c4d1] focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={20} className="animate-spin" /> Saving Changes...</>
                ) : (
                  <><Save size={18} /> Update User</>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        {/* ── Password Reset Card ── */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          {/* Toggle Header */}
          <button
            type="button"
            onClick={() => { setShowPwdSection((v) => !v); setPwdError(''); setPwdSuccess(''); }}
            className="w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left hover:bg-[#2d333b]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyRound size={22} className="text-[#00adb5]" />
              <div>
                <p className="text-[#eeeeee] font-semibold">Reset Password</p>
                <p className="text-[#8a8f99] text-xs mt-0.5">Set a new password for this user</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showPwdSection ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-[#8a8f99] text-lg leading-none"
            >
              ▾
            </motion.span>
          </button>

          {/* Password Form */}
          <AnimatePresence>
            {showPwdSection && (
              <motion.div
                key="pwd"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-6 sm:px-8 pb-8 border-t border-[#222831]/60">
                  <form onSubmit={handlePasswordReset} className="space-y-5 pt-6">

                    {/* Pwd Error */}
                    <AnimatePresence>
                      {pwdError && (
                        <motion.div
                          key="pe"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-lg bg-red-900/30 border border-red-800/50 p-4 text-sm text-red-300 text-center"
                        >
                          {pwdError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pwd Success */}
                    <AnimatePresence>
                      {pwdSuccess && (
                        <motion.div
                          key="ps"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-lg bg-green-900/30 border border-green-800/50 p-4 text-sm text-green-300 text-center flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} /> {pwdSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* New Password */}
                    <Field label="New Password">
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className={inputClass + ' pr-12'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8f99] hover:text-[#00adb5] transition-colors"
                        >
                          {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>

                    {/* Confirm Password */}
                    <Field label="Confirm New Password">
                      <div className="relative">
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className={inputClass + ' pr-12'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8f99] hover:text-[#00adb5] transition-colors"
                        >
                          {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>

                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                newPassword.length >= lvl * 2
                                  ? lvl <= 1 ? 'bg-red-500'
                                  : lvl <= 2 ? 'bg-yellow-500'
                                  : lvl <= 3 ? 'bg-blue-500'
                                  : 'bg-green-500'
                                  : 'bg-[#4a5058]'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[#8a8f99]">
                          {newPassword.length < 2 ? 'Too short'
                            : newPassword.length < 4 ? 'Weak'
                            : newPassword.length < 6 ? 'Fair'
                            : newPassword.length < 8 ? 'Good'
                            : 'Strong'}
                        </p>
                      </div>
                    )}

                    {/* Match indicator */}
                    {confirmPwd && (
                      <p className={`text-xs ${newPassword === confirmPwd ? 'text-green-400' : 'text-red-400'}`}>
                        {newPassword === confirmPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={pwdSaving}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {pwdSaving ? (
                        <><Loader2 size={20} className="animate-spin" /> Resetting...</>
                      ) : (
                        <><KeyRound size={18} /> Reset Password</>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-[#8a8f99]">
          Changes will take effect immediately
        </p>
      </motion.div>
    </div>
  );
}

/* ── Reusable helpers ── */
const inputClass =
  'w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] placeholder-[#8a8f99] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200';

const disabledClass =
  'w-full px-4 py-3 bg-[#2d333b]/70 border border-[#4a5058] rounded-lg text-[#8a8f99] cursor-not-allowed';

const selectClass =
  'w-full px-4 py-3 bg-[#2d333b] border border-[#4a5058] rounded-lg text-[#eeeeee] focus:outline-none focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/30 transition-all duration-200 appearance-none';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#cccccc] mb-1.5">{label}</label>
      {children}
    </div>
  );
}