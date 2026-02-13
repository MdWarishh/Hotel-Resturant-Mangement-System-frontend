'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  UserPlus, Loader2, Search, RefreshCw, X, 
  ChevronLeft, ChevronRight, 
  Users,
  Edit
} from 'lucide-react';

export default function StaffListPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    let url = `/users?page=${page}&limit=${limit}`;

    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (roleFilter) url += `&role=${roleFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    try {
      const res = await apiRequest(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setStaff(data);
      setTotal(res.pagination?.total || data.length);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Reset page on filter change
  useEffect(() => setPage(1), [searchTerm, roleFilter, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchStaff, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-teal-100 p-3 rounded-2xl">
            <Users className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage your hotel team</p>
          </div>
        </div>

        <Link
          href="/hotel-admin/staff/create"
          className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all"
        >
          <UserPlus className="h-5 w-5" />
          Add New Staff
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Total Staff</p>
          <p className="text-5xl font-bold text-gray-900 mt-4">{total}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Active Staff</p>
          <p className="text-5xl font-bold text-emerald-600 mt-4">
            {staff.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Inactive Staff</p>
          <p className="text-5xl font-bold text-orange-600 mt-4">
            {staff.filter(s => s.status === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="text-black bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone or email..."
                className=" text-black w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-teal-600 outline-none"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-2xl px-6 py-4 focus:border-teal-600 outline-none"
          >
            <option value="">All Roles</option>
            {/* <option value="MANAGER">Manager</option>
            <option value="RECEPTIONIST">Receptionist</option> */}
            <option value="CASHIER">Cashier</option>
            <option value="KITCHEN">Kitchen Staff</option>
            {/* <option value="HOUSEKEEPING">Housekeeping</option>
            <option value="WAITER">Waiter / Service</option> */}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-2xl px-6 py-4 focus:border-teal-600 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={fetchStaff}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center gap-2 font-medium"
            >
              <RefreshCw className="h-5 w-5" /> Refresh
            </button>

            {(searchTerm || roleFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="px-6 py-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 font-medium hover:bg-red-100"
              >
                <X className="h-5 w-5" /> Clear
              </button>
            )}
          </div>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-200 rounded-2xl px-6 py-4 focus:border-teal-600"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-8 py-6 text-left font-medium">Name</th>
                <th className="px-8 py-6 text-left font-medium">Role</th>
                <th className="px-8 py-6 text-left font-medium">Phone</th>
                <th className="px-8 py-6 text-left font-medium">Email</th>
                <th className="px-8 py-6 text-left font-medium">Status</th>
                <th className="px-8 py-6 text-right font-medium w-40">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="h-5 bg-gray-200 rounded w-40"></div></td>
                    <td className="px-8 py-6"><div className="h-5 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-8 py-6"><div className="h-5 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-8 py-6"><div className="h-5 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-8 py-6"><div className="h-5 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-8 py-6"><div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id} className="hover:bg-teal-50 transition-colors">
                    <td className="px-8 py-6 font-medium text-gray-900">{s.name}</td>
                    <td className="px-8 py-6">
                      <RoleBadge role={s.role} />
                    </td>
                    <td className="px-8 py-6 text-gray-600">{s.phone}</td>
                    <td className="px-8 py-6 text-gray-600">{s.email}</td>
                    <td className="px-8 py-6">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/hotel-admin/staff/${s._id}/edit`}
                        className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-sm font-medium hover:bg-teal-700 transition-all"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-gray-50 border-t flex items-center justify-between text-sm">
            <div>
              Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total} staff
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 hover:bg-white rounded-2xl disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="font-medium">Page {page} of {totalPages}</span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 hover:bg-white rounded-2xl disabled:opacity-40 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Badges */
function RoleBadge({ role }) {
  const colors = {
    MANAGER: 'bg-purple-100 text-purple-700',
    RECEPTIONIST: 'bg-blue-100 text-blue-700',
    CASHIER: 'bg-emerald-100 text-emerald-700',
    KITCHEN: 'bg-orange-100 text-orange-700',
    HOUSEKEEPING: 'bg-amber-100 text-amber-700',
    WAITER: 'bg-pink-100 text-pink-700',
  };

  return (
    <span className={`inline-block px-4 py-1 text-xs font-semibold rounded-full ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`inline-block px-4 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}