'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { ArrowLeft, User, Phone, UserCog, Shield, Loader2 } from 'lucide-react';

export default function EditStaffPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: '',
    status: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiRequest(`/users/${id}`);
        setForm({
          name: res.data.name,
          phone: res.data.phone,
          role: res.data.role,
          status: res.data.status,
        });
      } catch (err) {
        console.error('Failed to fetch staff', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });

      router.push('/hotel-admin/staff');
    } catch (err) {
      alert(err.message || 'Failed to update staff');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Edit Staff</h2>
          <p className="mt-1 text-sm text-[rgb(57,62,70)]">
            Update staff member information
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

      {/* FORM */}
      <form
        className="space-y-6 rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-8 shadow-lg"
        onSubmit={handleSubmit}
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

        {/* ROLE & STATUS */}
        <FormSection title="Role & Access" icon={<UserCog className="h-5 w-5" />}>
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

          <Select
            label="Account Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            icon={<Shield className="h-5 w-5" />}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FormSection>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[rgb(0,173,181)] py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Updating Staff...
            </span>
          ) : (
            'Update Staff'
          )}
        </button>
      </form>
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