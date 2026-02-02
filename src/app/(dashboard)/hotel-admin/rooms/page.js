'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Loader2, DoorOpen, Bed, Edit3 } from 'lucide-react';

const STATUS_OPTIONS = [
  'available',
  'occupied',
  'cleaning',
  'maintenance',
  'reserved',
];

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiRequest(`/rooms?hotel=${user.hotel}`);
        setRooms(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.hotel) fetchRooms();
  }, [user]);

  const updateStatus = async (roomId, newStatus) => {
    setUpdatingId(roomId);

    try {
      await apiRequest(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      // 🔄 update UI locally
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Rooms</h2>

        <Link
          href="/hotel-admin/rooms/create"
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Room
        </Link>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-4 py-3 text-left font-medium">Room</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Current Status</th>
                <th className="px-4 py-3 text-left font-medium">Change Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgb(57,62,70)]/10">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[rgb(57,62,70)]">
                    No rooms found
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr
                    key={room._id}
                    className="transition-colors duration-150 hover:bg-[rgb(238,238,238)]/50"
                  >
                    {/* Room Number */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]">
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-[rgb(34,40,49)]">
                          {room.roomNumber}
                        </span>
                      </div>
                    </td>

                    {/* Room Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-[rgb(57,62,70)]/50" />
                        <span className="capitalize text-[rgb(34,40,49)]">
                          {room.roomType}
                        </span>
                      </div>
                    </td>

                    {/* Current Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={room.status} />
                    </td>

                    {/* Status Change */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={room.status}
                          disabled={updatingId === room._id}
                          onChange={(e) => updateStatus(room._id, e.target.value)}
                          className="w-full appearance-none rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-3 py-2 pr-8 text-sm text-[rgb(34,40,49)] transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
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
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/hotel-admin/rooms/${room._id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[rgb(0,173,181)]/10 px-3 py-1.5 text-sm font-medium text-[rgb(0,173,181)] transition-all duration-200 hover:bg-[rgb(0,173,181)] hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
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
    </div>
  );
}

/* 🔹 Status Badge */
function StatusBadge({ status }) {
  const styles = {
    available: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    occupied: 'bg-[rgb(57,62,70)]/10 text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/30',
    maintenance: 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20',
    cleaning: 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30',
    reserved: 'bg-[rgb(0,173,181)]/20 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/40',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20'
      }`}
    >
      {status}
    </span>
  );
}