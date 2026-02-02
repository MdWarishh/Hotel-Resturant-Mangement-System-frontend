'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Lock, UserCog, Loader2, AlertCircle } from 'lucide-react';

export default function CreateStaffPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          hotel: user.hotel,
        }),
      });

      router.push('/hotel-admin/staff');
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Add Staff</h2>
          <p className="mt-1 text-sm text-[rgb(57,62,70)]">
            Create a new staff member account
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 rounded-lg bg-[rgb(238,238,238)] px-4 py-2 text-sm font-medium text-[rgb(34,40,49)] transition-all duration-200 hover:bg-[rgb(57,62,70)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 animate-[shake_0.4s_ease-in-out]">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-8 shadow-lg"
      >
        {/* PERSONAL INFO */}
        <FormSection title="Personal Information" icon={<User className="h-5 w-5" />}>
          <Input
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            icon={<User className="h-5 w-5" />}
            placeholder="John Doe"
          />
          <Input
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            icon={<Phone className="h-5 w-5" />}
            placeholder="+91 1234567890"
          />
        </FormSection>

        {/* ACCOUNT DETAILS */}
        <FormSection title="Account Details" icon={<Mail className="h-5 w-5" />}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            icon={<Mail className="h-5 w-5" />}
            placeholder="staff@example.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            icon={<Lock className="h-5 w-5" />}
            placeholder="••••••••"
          />
        </FormSection>

        {/* ROLE */}
        <FormSection title="Role & Permissions" icon={<UserCog className="h-5 w-5" />}>
          <Select
            label="Staff Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            icon={<UserCog className="h-5 w-5" />}
          >
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="kitchen_staff">Kitchen Staff</option>
          </Select>
        </FormSection>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[rgb(0,173,181)] py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Staff...
            </span>
          ) : (
            'Create Staff'
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

/* -------------------- FORM SECTION -------------------- */
function FormSection({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[rgb(57,62,70)]/10 pb-2">
        <div className="text-[rgb(0,173,181)]">{icon}</div>
        <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/* -------------------- INPUT -------------------- */
function Input({ label, icon, ...props }) {
  return (
    <div className="group">
      <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]">
            {icon}
          </div>
        )}
        <input
          {...props}
          required
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 ${
            icon ? 'pl-11' : 'pl-4'
          }`}
        />
      </div>
    </div>
  );
}

/* -------------------- SELECT -------------------- */
function Select({ label, icon, children, ...props }) {
  return (
    <div className="group col-span-2">
      <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 ${
            icon ? 'pl-11' : 'pl-4'
          }`}
        >
          {children}
        </select>
      </div>
    </div>
  );
}