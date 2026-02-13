'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { connectPOSSocket, disconnectPOSSocket } from '@/services/posSocket';
import { Loader2, AlertCircle, Plus,Table2, Table as TableIcon, Edit } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';

export default function TablesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Security: only hotel-admin/manager/super-admin
  if (authLoading) return <div>Loading...</div>;

  if (!user || ![ 'hotel_admin', 'manager', 'super_admin' ].includes(user.role)) {
    return <div className="p-8 text-red-600">Unauthorized</div>;
  }

  // Fetch tables
// src/app/hotel-admin/pos/tables/page.js

const fetchTables = async () => {
  setLoading(true);
  setError(null);
  try {
    // Ensure this matches your backend mounting point (usually /api/tables)
    const res = await apiRequest('/tables'); 
    
    // The controller returns 'tables' inside an object: { success: true, data: tables }
    // But your controller currently returns: successResponse(res, ..., tables) 
    // without a key. This means res.data IS the array.
   setTables(res.data.tables || []);
  } catch (err) {
    console.error(err);
    setError('Failed to load tables. Please check if the server is running.');
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
    fetchTables();

    // Use the singleton helper you already have
    const socket = connectPOSSocket();

    socket.on('table:updated', (updatedTable) => {
      setTables(prev => prev.map(t => t._id === updatedTable._id ? updatedTable : t));
    });

    return () => {
      // Don't disconnect global socket, just remove listener
      socket.off('table:updated');
    };
}, []);

  // Stats
  const totalTables = tables.length;
  const occupied = tables.filter(t => t.status === 'occupied').length;
  const reserved = tables.filter(t => t.status === 'reserved').length;
  const free = totalTables - occupied - reserved;
  const occupancyRate = totalTables > 0 ? Math.round((occupied / totalTables) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Tables Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage restaurant tables
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/hotel-admin/pos/tables/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 shadow transition"
          >
            <Plus className="h-5 w-5" />
            Add New Table
          </Link>
          <button
            onClick={fetchTables}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
       <StatCard title="Total Tables" value={totalTables} icon={TableIcon} color="blue" />
<StatCard title="Free Tables" value={free} icon={TableIcon} color="green" />
<StatCard title="Occupied Tables" value={occupied} icon={TableIcon} color="red" />
<StatCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={TableIcon} color="purple" />
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse shadow">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchTables} className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow">
          <TableIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Tables Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first table to get started</p>
          <Link href="/hotel-admin/pos/tables/new" className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90">
            <Plus className="h-5 w-5" />
            Add Table
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {tables.map((table) => (
            <TableCard key={table._id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}

// Stat Card
function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  };

  return (
    <div className={`rounded-xl p-6 shadow border ${colors[color] || colors.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
    </div>
  );
}

// Single Table Card
function TableCard({ table }) {
  const router = useRouter();

  const statusStyles = {
    available: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/60',
    occupied: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60',
    reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/60',
    maintenance: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
  };

  const handleCardClick = () => {
    if (table.status === 'available') {
      // Start new order for free table
      router.push(`/hotel-admin/pos/orders/new?table=${table.tableNumber}`);
    } else {
      // View details / manage for occupied/reserved/etc tables
      router.push(`/hotel-admin/pos/tables/${table._id}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`aspect-square rounded-2xl border-2 p-4 flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-sm ${statusStyles[table.status] || 'bg-gray-100 dark:bg-gray-700'}`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <Table2 className="h-12 w-12 mb-3" />
        <h3 className="text-xl font-bold">{table.tableNumber}</h3>
        <p className="text-sm font-medium capitalize mt-1">{table.status}</p>
        <p className="text-xs mt-2">Capacity: {table.capacity}</p>

        {/* Small indicator / button always visible */}
        <div className="absolute bottom-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent card click
              router.push(`/hotel-admin/pos/tables/${table._id}`);
            }}
            className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1 border border-gray-300 dark:border-gray-600"
          >
            <Edit className="h-3.5 w-3.5" />
            View / Edit
          </button>
        </div>
      </div>
    </div>
  );
}