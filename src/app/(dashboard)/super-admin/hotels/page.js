// app/super-admin/hotels/page.js

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { Building, Plus, Edit, BarChart3, Loader2, Trash2, AlertCircle, Search, AlertTriangle } from 'lucide-react';

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiRequest('/hotels');
        const hotelsData = Array.isArray(res.data) ? res.data : [];
        setHotels(hotelsData);
        applyFilters(hotelsData);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
        setError('Failed to load hotels. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // Apply search & filter
  useEffect(() => {
    applyFilters(hotels);
  }, [searchQuery, statusFilter, hotels]);

  const applyFilters = (data) => {
    let filtered = data.filter(hotel => 
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(hotel => hotel.status === statusFilter);
    }

    setFilteredHotels(filtered);
  };

  const handleDelete = async (hotelId) => {
    if (!confirm('Are you sure? This will delete the hotel and related data.')) return;

    setDeletingId(hotelId);
    try {
      await apiRequest(`/hotels/${hotelId}`, { method: 'DELETE' });
      // Refresh list
      const updatedHotels = hotels.filter(h => h._id !== hotelId);
      setHotels(updatedHotels);
      applyFilters(updatedHotels);
    } catch (err) {
      alert('Failed to delete hotel');
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
          Loading hotels...
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
          <h1 className="text-3xl font-bold text-[#eeeeee]">Hotels</h1>
          <div className="flex gap-4">
            <Link
              href="/super-admin/hotels/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5] text-[#222831] rounded-lg font-medium hover:bg-[#00c4d1] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
            >
              <Plus size={16} />
              Add Hotel
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8a8f99]" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 py-3 rounded-xl bg-[#4a5058]/30 text-[#eeeeee] border border-[#4a5058] placeholder-[#8a8f99] focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#4a5058]/30 text-[#eeeeee] border border-[#4a5058] focus:border-[#00adb5] focus:ring-1 focus:ring-[#00adb5]/50 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Empty State */}
        {filteredHotels.length === 0 ? (
          <div className="rounded-xl bg-[#4a5058]/30 p-12 text-center border border-[#4a5058]">
            <AlertTriangle className="mx-auto h-16 w-16 text-[#ffcc00] mb-4 opacity-70" />
            <h3 className="text-xl font-semibold text-[#eeeeee] mb-2">No hotels found</h3>
            <p className="text-[#8a8f99] mb-6">Create your first hotel to get started</p>
            <Link
              href="/super-admin/hotels/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00adb5] text-[#222831] rounded-xl font-medium hover:bg-[#00c4d1] transition-all duration-200"
            >
              <Plus size={18} />
              Add Hotel
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-[#4a5058]/30 border border-[#4a5058]">
            <table className="min-w-full divide-y divide-[#4a5058]">
              <thead className="bg-[#4a5058]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-[#8a8f99] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a5058]">
                {filteredHotels.map(hotel => (
                  <motion.tr
                    key={hotel._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-[#4a5058]/50 transition-all duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[#eeeeee] font-medium">
                      {hotel.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#8a8f99]">
                      {hotel.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#8a8f99]">
                      {hotel.address?.city || '—'}, {hotel.address?.state || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={hotel.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/super-admin/hotels/${hotel._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/5 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
                      >
                        <Edit size={16} />
                        Edit
                      </Link>
                      <Link
                        href={`/super-admin/hotels/${hotel._id}/stats`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00adb5]/5 text-[#00adb5] rounded-lg font-medium hover:bg-[#00adb5]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40 ml-2"
                      >
                        <BarChart3 size={16} />
                        Stats
                      </Link>
                      <button
                        onClick={() => handleDelete(hotel._id)}
                        disabled={deletingId === hotel._id}
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
          Total hotels: <span className="text-[#eeeeee] font-medium">{filteredHotels.length}</span>
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
    maintenance: 'bg-[#ffcc00]/20 text-[#ffcc00] border-[#ffcc00]/30',
  };

  return (
    <span className={`${base} ${map[status] || 'bg-[#4a5058]/30 text-[#cccccc] border-[#4a5058]'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}