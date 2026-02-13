'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Loader2, DoorOpen, Bed, Edit3, Search, X, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = [
  'available',
  'occupied',
  'cleaning',
  'maintenance',
  'reserved',
];

const ROOM_TYPES = [
  'single',
  'double',
  'deluxe',
  'suite',
  'premium',
  // Add more from your ROOM_TYPES enum if needed
];

export default function RoomsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Bulk actions
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);



  // Filter states (synced with URL)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || '');
  const [floor, setFloor] = useState(searchParams.get('floor') || '');

  const fetchRooms = async () => {
    if (!user?.hotel) return;

    setLoading(true);

    // Build query string from current filter states
    const params = new URLSearchParams();
    params.set('hotel', user.hotel);

    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (roomType) params.set('roomType', roomType);
    if (floor && !isNaN(floor)) params.set('floor', floor);

    try {
      const res = await apiRequest(`/rooms?${params.toString()}`);
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + whenever URL params change (browser back/forward)
  useEffect(() => {
    fetchRooms();
  }, [user, searchParams]);

  // Sync local state when URL changes (e.g. reset)
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setStatus(searchParams.get('status') || '');
    setRoomType(searchParams.get('roomType') || '');
    setFloor(searchParams.get('floor') || '');
  }, [searchParams]);

  // Bulk selection helpers
 const toggleSelectAll = (checked) => {
  if (checked) {
    setSelectedRoomIds(rooms.map((r) => r._id.toString()));
  } else {
    setSelectedRoomIds([]);
  }
};

const toggleSelectRoom = (roomId) => {
  const idStr = roomId.toString(); // safe string
  setSelectedRoomIds((prev) =>
    prev.includes(idStr)
      ? prev.filter((id) => id !== idStr)
      : [...prev, idStr]
  );
};

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedRoomIds.length === 0) return;

    setBulkLoading(true);
    try {
      for (const roomId of selectedRoomIds) {
        await apiRequest(`/rooms/${roomId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: bulkStatus }),
        });
      }

      // Update local state
      setRooms(prev =>
        prev.map(room =>
          selectedRoomIds.includes(room._id)
            ? { ...room, status: bulkStatus }
            : room
        )
      );

      alert(`Bulk status updated to "${bulkStatus}" for ${selectedRoomIds.length} rooms`);
      setSelectedRoomIds([]); // clear selection
      setBulkStatus('');
    } catch (err) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };



  const updateStatus = async (roomId, newStatus) => {
    setUpdatingId(roomId);
    try {
      await apiRequest(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // Local update
      setRooms((prev) =>
        prev.map((room) =>
          room._id === roomId ? { ...room, status: newStatus } : room
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    setDeletingId(roomToDelete._id);
    try {
      await apiRequest(`/rooms/${roomToDelete._id}`, {
        method: 'DELETE',
      });
      // Remove from local state
      setRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
      alert('Room deleted successfully');
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setRoomToDelete(null);
    }
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (roomType) params.set('roomType', roomType);
    if (floor && !isNaN(floor)) params.set('floor', floor);

    router.push(`${pathname}?${params.toString()}`);
    // fetchRooms() will be called via useEffect on searchParams change
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setRoomType('');
    setFloor('');
    router.push(pathname); // clear all query params
  };

  // Status icon & color logic
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <DoorOpen className="h-5 w-5 text-green-600" />;
      case 'occupied':  return <Lock className="h-5 w-5 text-red-600" />;
      case 'cleaning':  return <Wrench className="h-5 w-5 text-yellow-600" />;
      case 'maintenance': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'reserved':  return <CalendarDays className="h-5 w-5 text-purple-600" />;
      default: return <DoorOpen className="h-5 w-5 text-gray-500" />;
    }
  };


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)] dark:text-gray-400">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER + FILTERS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-bold text-[rgb(34,40,49)] dark:text-black">Rooms</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/hotel-admin/rooms/create"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Add Room
          </Link>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {/* Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgb(34,40,49)] dark:text-gray-300">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Room no. or description..."
                className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 pl-9 pr-4 py-2 text-sm text-[rgb(34,40,49)] placeholder-gray-500 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgb(34,40,49)] dark:text-gray-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 text-sm text-[rgb(34,40,49)] focus:border-[rgb(0,173,181)] focus:bg-black focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgb(34,40,49)] dark:text-gray-300">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 text-sm text-[rgb(34,40,49)] focus:border-[rgb(0,173,181)] focus:bg-black focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="">All Types</option>
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgb(34,40,49)] dark:text-gray-300">
              Floor
            </label>
            <input
              type="number"
              min="0"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 2"
              className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 text-sm text-[rgb(34,40,49)] placeholder-gray-500 focus:border-[rgb(0,173,181)] focus:bg-black focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-3 lg:col-span-1">
            <button
              onClick={handleApplyFilters}
              className="flex-1 rounded-lg bg-[rgb(0,173,181)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(0,173,181)]/90 transition"
            >
              Apply
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {/* Bulk Actions Bar - only show when something selected */}
{selectedRoomIds.length > 0 && (
  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
    <div className="flex flex-wrap items-center gap-4">
      <span className="font-medium text-gray-800 dark:text-gray-200">
        {selectedRoomIds.length} rooms selected
      </span>

      <select
        value={bulkStatus}
        onChange={(e) => setBulkStatus(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[rgb(0,173,181)] focus:ring-1 focus:ring-[rgb(0,173,181)] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
      >
        <option value="">Change status to...</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <button
        onClick={handleBulkStatusChange}
        disabled={bulkLoading || !bulkStatus}
        className="px-4 py-1.5 bg-[rgb(0,173,181)] text-white rounded-lg text-sm font-medium hover:bg-[rgb(0,173,181)]/90 disabled:opacity-50 flex items-center gap-2"
      >
        {bulkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Apply to Selected
      </button>

      <button
        onClick={() => setSelectedRoomIds([])}
        className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Clear Selection
      </button>
    </div>
  </div>
)}


      {/* TABLE - same as before */}
      <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-4 py-3 text-left w-10">
      <input
        type="checkbox"
        checked={rooms.length > 0 && selectedRoomIds.length === rooms.length}
        onChange={(e) => toggleSelectAll(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-[rgb(0,173,181)] focus:ring-[rgb(0,173,181)]"
      />
    </th>
                <th className="px-4 py-3 text-left font-medium">Room</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Current Status</th>
                <th className="px-4 py-3 text-left font-medium">Change Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
           <tbody className="divide-y divide-[rgb(57,62,70)]/10 dark:divide-gray-700">
  {rooms.length === 0 ? (
    <tr>
      <td colSpan="6" className="py-12 text-center text-[rgb(57,62,70)] dark:text-gray-400">
        No rooms found
      </td>
    </tr>
  ) : (
    rooms.map((room) => {
      // Ye line add karo – yahin se error fix hoga
      const isSelected = selectedRoomIds.includes(room._id.toString());

      return (
        <tr
          key={room._id}
          className={`transition-colors duration-150 hover:bg-[rgb(238,238,238)]/50 dark:hover:bg-gray-700/50 ${
            isSelected ? 'bg-[rgb(0,173,181)]/10 dark:bg-[rgb(0,173,181)]/20' : ''
          }`}
        >
          {/* Checkbox column */}
          <td className="px-4 py-3 w-10">
            <input
              type="checkbox"
              checked={isSelected}   // ab yahan defined hai
              onChange={() => toggleSelectRoom(room._id)}
              className="h-4 w-4 rounded border-gray-300 text-[rgb(0,173,181)] focus:ring-[rgb(0,173,181)]"
            />
          </td>

          {/* Room column */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]">
                <DoorOpen className="h-4 w-4" />
              </div>
              <span className="font-semibold text-[rgb(34,40,49)] dark:text-white">
                {room.roomNumber}
              </span>
            </div>
          </td>

          {/* Type */}
          <td className="px-4 py-3 capitalize text-[rgb(34,40,49)] dark:text-gray-200">
            {room.roomType}
          </td>

          {/* Current Status */}
          <td className="px-4 py-3">
            <StatusBadge status={room.status} />
          </td>

          {/* Change Status */}
          <td className="px-4 py-3">
            <div className="relative">
              <select
                value={room.status}
                disabled={updatingId === room._id}
                onChange={(e) => updateStatus(room._id, e.target.value)}
                className="w-full appearance-none rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 pr-8 text-sm text-[rgb(34,40,49)] transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-black focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {updatingId === room._id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-[rgb(0,173,181)]" />
                </div>
              )}
            </div>
          </td>

          {/* Actions */}
          <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
            {/* Edit + Delete buttons same rahe */}
            <Link
              href={`/hotel-admin/rooms/${room._id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)]/10 px-3 py-1.5 text-sm font-medium text-[rgb(0,173,181)] transition-all duration-200 hover:bg-[rgb(0,173,181)] hover:text-white dark:bg-[rgb(0,173,181)]/20 dark:hover:bg-[rgb(0,173,181)] dark:hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Link>

            <button
              onClick={() => handleDeleteClick(room)}
              disabled={deletingId === room._id || room.status === 'occupied'}
              className="inline-flex items-center gap-2 rounded-lg bg-red-100/80 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
            >
              {deletingId === room._id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </button>
          </td>
        </tr>
      );
    })
  )}
</tbody>
          </table>
        </div>
      </div>
      {showDeleteModal && roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-[rgb(34,40,49)] dark:text-white">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-[rgb(57,62,70)] dark:text-gray-300">
              Are you sure you want to delete room <strong>{roomToDelete.roomNumber}</strong> ({roomToDelete.roomType})?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* StatusBadge remains the same */
// Improved StatusBadge
function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const styles = {
    available:    `${base} bg-green-100 text-green-800 border border-green-200`,
    occupied:     `${base} bg-red-100 text-red-800 border border-red-200`,
    cleaning:     `${base} bg-blue-100 text-blue-800 border border-blue-200`,
    maintenance:  `${base} bg-orange-100 text-orange-800 border border-orange-200`,
    reserved:     `${base} bg-purple-100 text-purple-800 border border-purple-200`,
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-800 border border-gray-300'
      } dark:bg-opacity-20 dark:text-opacity-90`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}