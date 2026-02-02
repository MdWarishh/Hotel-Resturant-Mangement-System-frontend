// app/super-admin/users/page.js  (or your exact path)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { Users, UserPlus, Edit, ShieldCheck, ShieldX } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiRequest('/users');
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[#8a8f99] text-lg"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00adb5]"></div>
          Loading users...
        </motion.div>
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
          <div className="flex items-center gap-3">
            <Users size={28} className="text-[#00adb5]" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
              System Users
            </h2>
          </div>

          <Link
            href="/super-admin/users/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00adb5] text-[#222831] font-medium rounded-lg shadow-lg shadow-[#00adb5]/20 hover:bg-[#00c4d1] hover:shadow-xl hover:shadow-[#00adb5]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
          >
            <UserPlus size={18} />
            Create User
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#cccccc]">
              <thead className="bg-[#2d333b] border-b border-[#4a5058]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Name</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Email</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Role</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Status</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee] text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#4a5058]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8a8f99]">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ backgroundColor: '#2d333b', scale: 1.005 }}
                      className="transition-all duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-[#eeeeee]">
                        {user.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-[#8a8f99]">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        {user.role?.replace('_', ' ') || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/super-admin/users/${user._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/10 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5] hover:text-[#222831] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-6 text-sm text-[#8a8f99] text-center sm:text-right">
          Total users: <span className="text-[#eeeeee] font-medium">{users.length}</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
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