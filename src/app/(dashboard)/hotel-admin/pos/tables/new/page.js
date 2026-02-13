'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { Loader2, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTablePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Only allow hotel_admin, manager, super_admin
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>;
  }

  const [form, setForm] = useState({
    tableNumber: '',
    capacity: '',
    status: 'available',
    section: '',
    shape: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    } else if (form.tableNumber.length > 12) {
      newErrors.tableNumber = 'Table number is too long (max 12 characters)';
    }

    if (!form.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else {
      const cap = Number(form.capacity);
      if (isNaN(cap) || cap < 1 || cap > 30) {
        newErrors.capacity = 'Capacity must be between 1 and 30';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity), // convert to number
      };

      const res = await apiRequest('/tables', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success || res.data) {
        setSubmitSuccess(true);
        // Wait a tiny bit so user sees success message
        setTimeout(() => {
          router.push('/hotel-admin/pos/tables');
          // Optional: router.refresh() if you use Next.js App Router revalidation
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || err.message || 'Failed to create table';
      
      if (message.includes('duplicate') || message.includes('unique')) {
        setErrors((prev) => ({ ...prev, tableNumber: 'This table number already exists' }));
      } else {
        setSubmitError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/hotel-admin/pos/tables"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Add New Table
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new dining table for your restaurant
              </p>
            </div>
          </div>
        </div>

        {/* Success message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-3">
            <Save className="h-5 w-5" />
            <span>Table created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error banner */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Table Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Table Number / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tableNumber"
                value={form.tableNumber}
                onChange={handleChange}
                placeholder="e.g. T-01, A-05, VIP-2"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.tableNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.tableNumber && (
                <p className="mt-1.5 text-sm text-red-600">{errors.tableNumber}</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Seating Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                min="1"
                max="30"
                placeholder="4"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)] dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.capacity && (
                <p className="mt-1.5 text-sm text-red-600">{errors.capacity}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Initial Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>

            {/* Section / Zone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Section / Zone
              </label>
              <input
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                placeholder="e.g. Indoor, Terrace, Bar"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
              />
            </div>

            {/* Shape (optional – useful later for floor plan) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Table Shape
              </label>
              <select
                name="shape"
                value={form.shape}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
              >
                <option value="">Not specified</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
                <option value="rectangle">Rectangle</option>
                <option value="booth">Booth</option>
                <option value="high-top">High-top</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Notes / Special Instructions
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Near window, wheelchair accessible, preferred by regular guests..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] focus:border-[rgb(0,173,181)]"
                maxLength={200}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 text-right">
                {form.notes.length} / 200
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/hotel-admin/pos/tables"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || submitSuccess}
              className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 font-medium flex items-center justify-center gap-2 shadow disabled:opacity-60 min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Table
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}