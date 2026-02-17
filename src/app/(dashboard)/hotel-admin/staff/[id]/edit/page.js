'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import {
  ArrowLeft, Loader2, Save, KeyRound, AlertCircle,
  CheckCircle2, Download, FileText, Upload, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ✅ Build correct CV download URL
// DB stores:  "uploads/cv/1700000-123456.pdf"
// API_URL =   "http://localhost:5000/api"
// We need:    "http://localhost:5000/uploads/cv/1700000-123456.pdf"
const getCvDownloadUrl = (cvUrl) => {
  if (!cvUrl) return null;
  const apiUrl  = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  // Remove /api suffix to get base server URL
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  // Ensure single slash between base and path
  const cleanPath = cvUrl.startsWith('/') ? cvUrl : `/${cvUrl}`;
  return `${baseUrl}${cleanPath}`;
};

export default function StaffDetailsPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { token } = useAuth();

  const [staff, setStaff]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [resetting, setResetting]     = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [newCv, setNewCv]             = useState(null);

  const [form, setForm] = useState({ name: '', phone: '', role: '', status: 'active' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setError(''); setTimeout(() => setSuccessMsg(''), 3000); };

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res  = await apiRequest(`/users/${id}`);
        const data = res?.data?.user ?? res?.data;
        setStaff(data);
        setForm({ name: data.name || '', phone: data.phone || '', role: data.role || 'cashier', status: data.status || 'active' });
      } catch (err) {
        setError('Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  const handleChange         = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccessMsg('');
    try {
      await apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(form) });
      showSuccess('Staff updated successfully!');
      const res = await apiRequest(`/users/${id}`);
      setStaff(res?.data?.user ?? res?.data);
    } catch (err) { setError(err.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setError('Passwords do not match');
    if (passwordForm.newPassword.length < 6) return setError('Password must be at least 6 characters');
    setResetting(true); setError('');
    try {
      await apiRequest(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword: passwordForm.newPassword }) });
      showSuccess('Password reset successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) { setError(err.message || 'Failed to reset password'); } finally { setResetting(false); }
  };

  const handleCvUpload = async () => {
    if (!newCv) return;
    setUploadingCv(true); setError('');
    try {
      const formData = new FormData();
      formData.append('cv', newCv);
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/users/${id}/cv`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'CV upload failed'); }
      const refreshed = await apiRequest(`/users/${id}`);
      setStaff(refreshed?.data?.user ?? refreshed?.data);
      setNewCv(null);
      showSuccess('CV updated successfully!');
    } catch (err) { setError(err.message || 'CV upload failed'); } finally { setUploadingCv(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /></div>;

  const cvDownloadUrl = getCvDownloadUrl(staff?.cvUrl);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{staff?.name}</h1>
          <p className="text-gray-500 mt-1 text-sm font-mono">ID: {staff?._id}</p>
        </div>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-black px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-2xl font-medium">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
      </div>

      {error      && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3"><AlertCircle className="h-5 w-5 flex-shrink-0" />{error}</div>}
      {successMsg && <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3"><CheckCircle2 className="h-5 w-5 flex-shrink-0" />{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none">
                  <option value="cashier">Cashier</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none">
                  <option value="active">✅ Active</option>
                  <option value="inactive">⛔ Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
              {saving ? <><Loader2 className="animate-spin h-5 w-5" />Saving...</> : <><Save className="h-5 w-5" />Save Changes</>}
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-4 space-y-8">

          {/* Info + CV */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
            <h3 className="text-gray-900 font-semibold text-xl">Staff Information</h3>

            <div className="text-sm">
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900 mt-1">{staff?.email}</p>
            </div>

            {/* CV */}
            <div className="text-sm">
              <p className="text-gray-500 mb-2">CV / Resume</p>

              {/* ✅ Existing CV with working download */}
              {staff?.cvUrl ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="bg-teal-100 p-1.5 rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium truncate">
                      {staff.cvUrl.split('/').pop()}
                    </span>
                  </div>
                  <a
                    href={cvDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 p-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl transition-colors"
                    title="Download CV"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <p className="text-gray-400 italic text-xs mb-3">No CV uploaded yet</p>
              )}

              {/* Upload / Replace */}
              {newCv ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <FileText className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span className="text-xs text-teal-700 truncate flex-1">{newCv.name}</span>
                    <button type="button" onClick={() => setNewCv(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                  <button type="button" onClick={handleCvUpload} disabled={uploadingCv}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                    {uploadingCv ? <><Loader2 className="animate-spin h-3.5 w-3.5" />Uploading...</> : <><Upload className="h-3.5 w-3.5" />Upload</>}
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-teal-600 hover:text-teal-800 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  {staff?.cvUrl ? 'Replace CV' : 'Upload CV'}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) { setError('File too large (max 5MB)'); return; }
                      setNewCv(f);
                    }} />
                </label>
              )}
            </div>

            <div className="text-sm">
              <p className="text-gray-500">Joined On</p>
              <p className="font-medium text-gray-900 mt-1">{staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN') : '—'}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-500">Created By</p>
              <p className="font-medium text-gray-900 mt-1">{staff?.createdBy?.name || 'System'}</p>
            </div>
          </div>

          {/* Reset Password */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="font-semibold text-xl mb-5 text-gray-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-teal-600" /> Reset Password
            </h3>
            <div className="space-y-4">
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange}
                placeholder="New Password (min 6)" className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none" />
              <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange}
                placeholder="Confirm Password" className="text-gray-900 w-full border border-gray-200 rounded-2xl px-5 py-4 focus:border-teal-600 outline-none" />
              {passwordForm.confirmPassword && (
                <p className={`text-xs ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                </p>
              )}
              <button type="button" onClick={handleResetPassword}
                disabled={resetting || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {resetting ? <><Loader2 className="animate-spin h-5 w-5" />Resetting...</> : 'Reset Password'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}