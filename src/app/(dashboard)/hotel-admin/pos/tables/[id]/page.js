'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { Loader2, Save, AlertCircle, ArrowLeft, Table2, Users, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function TableDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Authorization check
  if (!user || !['hotel_admin', 'manager', 'super_admin'].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>;
  }

  // Fetch single table
  const fetchTable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/tables/${id}`);
     // This line in your page.js is now supported by the { table } wrapper in the controller
const data = res.data?.table || res.data || null;
      if (data) {
        setTable(data);
        setForm({
          tableNumber: data.tableNumber || '',
          capacity: data.capacity || '',
          status: data.status || 'available',
          section: data.section || '',
          shape: data.shape || '',
          notes: data.notes || '',
        });
      } else {
        setError('Table not found');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load table details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTable();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!form.tableNumber?.trim()) {
      errors.tableNumber = 'Table number is required';
    }

    if (!form.capacity) {
      errors.capacity = 'Capacity is required';
    } else {
      const cap = Number(form.capacity);
      if (isNaN(cap) || cap < 1 || cap > 30) {
        errors.capacity = 'Must be between 1–30';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
      };

      const res = await apiRequest(`/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.success || res.data) {
        setSaveSuccess(true);
        setIsEditing(false);
        // Refresh table data
        await fetchTable();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update table';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        setFormErrors((prev) => ({ ...prev, tableNumber: 'This table number is already in use' }));
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this table? This cannot be undone.')) return;

    try {
      await apiRequest(`/tables/${id}`, { method: 'DELETE' });
      router.push('/hotel-admin/pos/tables');
    } catch (err) {
      alert('Failed to delete table: ' + (err.message || 'Server error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Table not found'}</p>
          <Link
            href="/hotel-admin/pos/tables"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Tables
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/hotel-admin/pos/tables"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Table2 className="h-8 w-8 text-[rgb(0,173,181)]" />
                Table {table.tableNumber}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
                {table.status} • {table.capacity} seats
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
              >
                <Edit className="h-5 w-5" />
                Edit Table
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Success / Error messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-3">
            <Save className="h-5 w-5" />
            Table updated successfully
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isEditing ? (
            // ── EDIT MODE ────────────────────────────────────────────────
            <form className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Table Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="tableNumber"
                    value={form.tableNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                      formErrors.tableNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.tableNumber && (
                    <p className="mt-1.5 text-sm text-red-600">{formErrors.tableNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Capacity (seats) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    min="1"
                    max="30"
                    className={`w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)] ${
                      formErrors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.capacity && (
                    <p className="mt-1.5 text-sm text-red-600">{formErrors.capacity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Section / Zone
                  </label>
                  <input
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="e.g. Indoor, Terrace, Bar"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Shape
                  </label>
                  <select
                    name="shape"
                    value={form.shape}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  >
                    <option value="">Not specified</option>
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="booth">Booth</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[rgb(0,173,181)]"
                    placeholder="Special instructions, location hints, preferences..."
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    setSaveError(null);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-60"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // ── VIEW MODE ────────────────────────────────────────────────
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Table Number</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{table.tableNumber}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Capacity</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-[rgb(0,173,181)]" />
                    {table.capacity} seats
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Current Status</h3>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium capitalize ${
                    table.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                    table.status === 'occupied' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                    table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {table.status}
                  </span>
                </div>

                {table.section && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Section / Zone</h3>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{table.section}</p>
                  </div>
                )}

                {table.shape && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Shape</h3>
                    <p className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{table.shape}</p>
                  </div>
                )}

                {table.notes && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-700/40 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</h3>
                    <p className="text-gray-900 dark:text-gray-300 whitespace-pre-line">{table.notes}</p>
                  </div>
                )}
              </div>

              {/* Placeholder for future features */}
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Current Order / Activity</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-gray-500 dark:text-gray-400">
                  {table.currentOrder ? (
                    <div>Order #{table.currentOrder.orderNumber} • {table.currentOrder.items?.length || 0} items</div>
                  ) : (
                    'No active order at this table'
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}