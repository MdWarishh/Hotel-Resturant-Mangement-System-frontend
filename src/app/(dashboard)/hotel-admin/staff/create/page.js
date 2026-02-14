'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, User, Mail, Phone, Lock, UserCog, Loader2, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';


export default function CreateStaffPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'receptionist',
    cv: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
 const { token } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };


 const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Optional: Add a size check (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setForm({ ...form, cv: file });
    setError('');
  }
};
 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validations
  if (form.password !== form.confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (!form.cv) {
    setError('Please upload a CV');
    setLoading(false);
    return;
  }

  try {
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('password', form.password);
    formData.append('role', form.role);
    formData.append('cv', form.cv); // This must match upload.single('cv') in backend

    // Use your apiRequest helper
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // Use the token from your useAuth() hook
      },
      body: formData,
    }); 

if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create staff');
    }

    setSuccess(true);
    setTimeout(() => router.push('/hotel-admin/staff'), 1500);
  } catch (err) {
    setError(err.message || 'Failed to create staff member');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Add New Staff</h1>
          <p className="text-gray-600 mt-2">Create account for hotel team member</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-black flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-2xl font-medium transition-all"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl">
          <CheckCircle2 className="h-6 w-6" />
          Staff member created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 space-y-10">
        
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="text-gray-900 w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                required
                className="text-gray-900 w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="9876543210"
              />
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="text-gray-900 w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="staff@hotel.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="text-gray-900 w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="text-gray-900  w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Staff Role</label>
          <div className="relative">
            <UserCog className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="text-gray-900 w-full pl-12 pr-6 py-4 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none bg-white"
            >
            {/* <option value="manager">Manager</option> */}
  {/* <option value="receptionist">Receptionist / Front Desk</option> */}
  <option value="cashier">Cashier</option>
  <option value="kitchen_staff">Kitchen Staff</option> {/* Changed from kitchen */}
  {/* <option value="housekeeping">Housekeeping</option> */}
  {/* <option value="waiter">Waiter / Restaurant Service</option> */}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-2">Hotel Admin can only create these roles</p>
        </div>


        {/* CV Upload Section */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Staff CV (PDF or Doc)</label>
  <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${form.cv ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}>
    <input
      type="file"
      name="cv"
      accept=".pdf,.doc,.docx"
      onChange={handleFileChange}
      required
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`p-3 rounded-full mb-3 ${form.cv ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
        <ArrowLeft className={`h-6 w-6 rotate-90 ${form.cv ? 'text-teal-600' : 'text-gray-400'}`} />
      </div>
      {form.cv ? (
        <p className="text-teal-700 font-medium">Selected: {form.cv.name}</p>
      ) : (
        <>
          <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
          <p className="text-gray-500 text-sm mt-1">PDF, DOC up to 5MB</p>
        </>
      )}
    </div>
  </div>
</div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all shadow-lg flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-6 w-6" />
              Creating Staff Member...
            </>
          ) : (
            'Create Staff Member'
          )}
        </button>
      </form>
    </div>
  );
}