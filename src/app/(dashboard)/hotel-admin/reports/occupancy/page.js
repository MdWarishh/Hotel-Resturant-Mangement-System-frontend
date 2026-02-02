'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * Occupancy Report
 * Room utilization & booking trends
 */
export default function OccupancyReportPage() {
  const { user } = useAuth();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== USER_ROLES.HOTEL_ADMIN) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized
      </div>
    );
  }

  const fetchReport = async () => {
    if (!from || !to) return;

    try {
      setLoading(true);
      const res = await apiRequest(
        `/reports/occupancy?from=${from}&to=${to}`
      );
      setData(res.data);
    } catch (err) {
      console.error('Failed to load occupancy report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [from, to]);

  return (
    <div className="p-6 h-full">
      <h1 className="text-xl font-semibold mb-2">
        Occupancy Report
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Room utilization & booking efficiency
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">
          Loading occupancy report…
        </p>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Total Rooms
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalRooms}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Room Nights Available
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalAvailable}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Room Nights Occupied
              </p>
              <p className="text-xl font-semibold">
                {data.summary.totalOccupied}
              </p>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">
                Avg Occupancy %
              </p>
              <p className="text-xl font-semibold">
                {data.summary.occupancyRate}%
              </p>
            </div>
          </div>

          {/* Period-wise Occupancy */}
          <div className="border rounded p-4 mb-8">
            <h3 className="font-medium mb-3">
              Period-wise Occupancy
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    Date / Period
                  </th>
                  <th className="p-3 text-right">
                    Available
                  </th>
                  <th className="p-3 text-right">
                    Occupied
                  </th>
                  <th className="p-3 text-right">
                    Occupancy %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.periods.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      {row.period}
                    </td>
                    <td className="p-3 text-right">
                      {row.available}
                    </td>
                    <td className="p-3 text-right">
                      {row.occupied}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {row.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Room Type Occupancy */}
          <div className="border rounded p-4">
            <h3 className="font-medium mb-3">
              Room Type Occupancy
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    Room Type
                  </th>
                  <th className="p-3 text-right">
                    Available
                  </th>
                  <th className="p-3 text-right">
                    Occupied
                  </th>
                  <th className="p-3 text-right">
                    Occupancy %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.roomTypes.map((room, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      {room.type}
                    </td>
                    <td className="p-3 text-right">
                      {room.available}
                    </td>
                    <td className="p-3 text-right">
                      {room.occupied}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {room.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}