'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Edit, Users, Loader2 } from 'lucide-react';

export default function StaffListPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      const res = await apiRequest('/users');
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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
    <div>
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10">
            <Users className="h-5 w-5 text-[rgb(0,173,181)]" />
          </div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">
            Staff Management
          </h2>
        </div>

        <Link
          href="/hotel-admin/staff/create"
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          <UserPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Staff
        </Link>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">Role</th>
                <th className="px-6 py-3 text-left font-medium">Phone</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgb(57,62,70)]/10">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[rgb(57,62,70)]">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s._id}
                    className="transition-colors duration-150 hover:bg-[rgb(238,238,238)]/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-[rgb(34,40,49)]">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-[rgb(57,62,70)]">
                      {s.role.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-[rgb(57,62,70)]">
                      {s.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/hotel-admin/staff/${s._id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)]/10 px-3 py-1.5 text-sm font-medium text-[rgb(0,173,181)] transition-all duration-200 hover:bg-[rgb(0,173,181)] hover:text-white"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER STATS */}
      {staff.length > 0 && (
        <div className="mt-6 rounded-lg border border-[rgb(57,62,70)]/10 bg-white px-6 py-3 text-sm text-[rgb(57,62,70)] shadow">
          Total staff members:{' '}
          <span className="font-semibold text-[rgb(34,40,49)]">{staff.length}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ status }) {
  const styles = {
    active: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    inactive: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    suspended: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] || styles.inactive
      }`}
    >
      {status}
    </span>
  );
}