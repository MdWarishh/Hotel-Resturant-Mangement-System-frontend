// app/super-admin/users/page.js

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { Users, UserPlus, Edit, Loader2, Trash2, AlertCircle, Search } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiRequest('/users');
        const usersData = Array.isArray(res.data) ? res.data : [];
        setUsers(usersData);
        applyFilters(usersData);
      } catch (err) {
        console.error(err);
        setError('Failed to load users. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply search & filters
  useEffect(() => {
    applyFilters(users);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const applyFilters = (data) => {
    let filtered = data.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure? This will delete the user.')) return;

    setDeletingId(userId);
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      // Refresh list
      const updatedUsers = users.filter(u => u._id !== userId);
      setUsers(updatedUsers);
      applyFilters(updatedUsers);
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setDeletingId(null);
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
          Loading users...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#222831] p-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <p className="text-[#eeeeee] mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#00adb5] text-[#222831] rounded-xl font-medium hover:bg-[#00c4d1]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222831] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#eeeeee]">Users</h1>
          <div className="flex gap-4">
            <Link
              href="/super-admin/users/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5] text-[#222831] rounded-lg font-medium hover:bg-[#00c4d1] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
            >
              <UserPlus size={16} />
              Add User
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8a8f99]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 py-3 rounded-xl bg-[#4a5058]/30 text-[#eeeeee] border border-[#4a5058] placeholder-[#8a8f99] focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/50 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#4a5058]/30 text-[#eeeeee] border border-[#4a5058] focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/50 transition-all"
          >
            <option value="all">All Roles</option>
            <option value="hotel_admin">Hotel Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="kitchen_staff">Kitchen Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#4a5058]/30 text-[#eeeeee] border border-[#4a5058] focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/50 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 ? (
          <div className="rounded-xl bg-[#4a5058]/30 p-12 text-center border border-[#4a5058]">
            <AlertTriangle className="mx-auto h-16 w-16 text-[#ffcc00] mb-4 opacity-70" />
            <h3 className="text-xl font-semibold text-[#eeeeee] mb-2">No users found</h3>
            <p className="text-[#8a8f99] mb-6">Create your first user</p>
            <Link
              href="/super-admin/users/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00adb5] text-[#222831] rounded-xl font-medium hover:bg-[#00c4d1] transition-all duration-200"
            >
              <UserPlus size={18} />
              Add User
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-[#4a5058]/30 border border-[#4a5058]">
            <table className="min-w-full divide-y divide-[#4a5058]">
              <thead className="bg-[#4a5058]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a5058]">
                {filteredUsers.map(user => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-[#4a5058]/50 transition-all duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[#eeeeee] font-medium">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#8a8f99]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#8a8f99] capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/super-admin/users/${user._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/5 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
                      >
                        <Edit size={16} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={deletingId === user._id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b6b]/5 text-[#ff6b6b] rounded-lg font-medium hover:bg-[#ff6b6b]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 ml-2 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-sm text-[#8a8f99] text-center sm:text-right">
          Total users: <span className="text-[#eeeeee] font-medium">{filteredUsers.length}</span>
        </div>
      </motion.div>
    </div>
  );
}

/* Status Badge */
function StatusBadge({ status }) {
  const base = 'inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium capitalize border';

  const map = {
    active: 'bg-[#00adb5]/20 text-[#00adb5] border-[#00adb5]/30',
    inactive: 'bg-[#4a5058]/30 text-[#cccccc] border-[#4a5058]',
    pending: 'bg-[#ffcc00]/20 text-[#ffcc00] border-[#ffcc00]/30',
    suspended: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30',
  };

  return (
    <span className={`${base} ${map[status?.toLowerCase()] || 'bg-[#4a5058]/30 text-[#cccccc] border-[#4a5058]'}`}>
      {status || 'Unknown'}
    </span>
  );
}