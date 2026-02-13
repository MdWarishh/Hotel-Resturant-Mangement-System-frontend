'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { 
  ArrowLeft, User, Phone, Mail, UserCog, Shield, 
  Loader2, Save, KeyRound, AlertCircle, CheckCircle2, 
  Download,
  FileText
} from 'lucide-react';

export default function StaffDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: '',
    status: 'active',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch staff details
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiRequest(`/users/${id}`);
        const data = res.data.user || res.data;

        setStaff(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          role: data.role || 'RECEPTIONIST',
          status: data.status || 'active',
        });
      } catch (err) {
        setError('Failed to load staff details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });

      setSuccessMsg('Staff updated successfully!');
      // Refresh data
      const res = await apiRequest(`/users/${id}`);
      setStaff(res.data.user || res.data);
    } catch (err) {
      setError(err.message || 'Failed to update staff');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setResetting(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiRequest(`/users/${id}/reset-password`, {  // ← Yeh endpoint backend mein add karna padega
        method: 'POST',
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      setSuccessMsg('Password reset successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{staff?.name}</h1>
          <p className="text-gray-600 mt-2">Staff ID: {staff?._id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-2xl font-medium"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Staff List
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left - Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
                >
                  {/* <option value="MANAGER">Manager</option>
                  <option value="RECEPTIONIST">Receptionist</option> */}
                  <option value="CASHIER">Cashier</option>
                  <option value="KITCHEN">Kitchen Staff</option>
                  {/* <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="WAITER">Waiter / Service</option> */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className=" text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              {saving ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right - Info + Password Reset */}
        <div className="lg:col-span-4 space-y-8">
          {/* Staff Info Card */}
        {/* Staff Info Card */}
<div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
  <h3 className=" text-gray-900 font-semibold text-xl mb-6">Staff Information</h3>
  
  <div className="space-y-6 text-sm">
    <div>
      <span className="text-gray-500">Email</span>
      <p className="font-medium text-gray-900 mt-1">{staff?.email}</p>
    </div>
    
    {/* --- CV SECTION START --- */}
    <div>
      <span className="text-gray-500">Curriculum Vitae (CV)</span>
      {staff?.cvUrl ? (
        <div className="mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-teal-600" />
            </div>
            <span className="text-gray-700 font-medium truncate max-w-[120px]">
              {staff.cvUrl.split('/').pop()} 
            </span>
          </div>
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL}/${staff.cvUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            download
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            title="Download CV"
          >
            <Download className="h-5 w-5" />
          </a>
        </div>
      ) : (
        <p className="text-gray-400 italic mt-1 text-xs">No CV uploaded</p>
      )}
    </div>
    {/* --- CV SECTION END --- */}

    <div>
      <span className="text-gray-500">Joined On</span>
      <p className="font-medium text-gray-900 mt-1">
        {staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN') : '—'}
      </p>
    </div>
    <div>
      <span className="text-gray-500">Created By</span>
      <p className="font-medium text-gray-900 mt-1">{staff?.createdBy?.name || 'System'}</p>
    </div>
  </div>
</div>

          {/* Reset Password Card */}
          <div className="text-gray-900 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-teal-600" /> Reset Password
            </h3>

            <div className="space-y-5">
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="New Password"
                className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
              />
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none"
              />

              <button
                onClick={handleResetPassword}
                disabled={resetting || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}