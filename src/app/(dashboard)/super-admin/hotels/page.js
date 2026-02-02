// app/super-admin/hotels/page.js

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { Building, Plus, Edit, BarChart3, Loader2 } from 'lucide-react';

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await apiRequest('/hotels');
        setHotels(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[#8a8f99] text-lg"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#00adb5]" />
          Loading hotels...
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
            <Building size={28} className="text-[#00adb5]" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
              Hotels Management
            </h2>
          </div>

          <Link
            href="/super-admin/hotels/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00adb5] text-[#222831] font-medium rounded-lg shadow-lg shadow-[#00adb5]/20 hover:bg-[#00c4d1] hover:shadow-xl hover:shadow-[#00adb5]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
          >
            <Plus size={18} />
            Add Hotel
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#cccccc]">
              <thead className="bg-[#2d333b] border-b border-[#4a5058]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Name</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Code</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">City</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Status</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Created By</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee] text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#4a5058]">
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#8a8f99]">
                      No hotels found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  hotels.map((hotel, index) => (
                    <motion.tr
                      key={hotel._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ backgroundColor: '#2d333b', scale: 1.005 }}
                      className="transition-all duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-[#eeeeee]">
                        {hotel.name}
                      </td>
                      <td className="px-6 py-4 text-[#00adb5] font-medium">
                        {hotel.code}
                      </td>
                      <td className="px-6 py-4">
                        {hotel.address?.city || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={hotel.status} />
                      </td>
                      <td className="px-6 py-4 text-[#8a8f99]">
                        {hotel.createdBy?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                        <Link
                          href={`/super-admin/hotels/${hotel._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/10 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5] hover:text-[#222831] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <Link
                          href={`/super-admin/hotels/${hotel._id}/stats`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/5 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
                        >
                          <BarChart3 size={16} />
                          Stats
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
          Total hotels: <span className="text-[#eeeeee] font-medium">{hotels.length}</span>
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
    maintenance: 'bg-[#ffcc00]/20 text-[#ffcc00] border-[#ffcc00]/30',
  };

  return (
    <span className={`${base} ${map[status] || 'bg-[#4a5058]/30 text-[#cccccc] border-[#4a5058]'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}