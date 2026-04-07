'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiRequest } from '@/services/api'
import {
  Loader2,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    icon: CheckCircle2,
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    dot: 'bg-emerald-400',
  },
  occupied: {
    label: 'Occupied',
    icon: Users,
    cardBg: 'bg-rose-50',
    cardBorder: 'border-rose-300',
    badge: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    dot: 'bg-rose-400',
  },
  reserved: {
    label: 'Reserved',
    icon: Clock,
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    dot: 'bg-amber-400',
  },
}

const ALL_STATUSES = ['available', 'occupied', 'reserved']
const FILTER_OPTIONS = ['all', 'available', 'occupied', 'reserved']

// ─── Status Dropdown (per card) ───────────────────────────────────────────────
function StatusDropdown({ table, onStatusChange, isUpdating }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available
  const Icon = cfg.icon

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (status) => {
    if (status === table.status) { setOpen(false); return }
    setOpen(false)
    onStatusChange(table, status)
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger Badge */}
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={isUpdating}
        className={`inline-flex items-center justify-between gap-1.5 w-full px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none disabled:opacity-60 ${cfg.badge}`}
      >
        <span className="flex items-center gap-1.5">
          {isUpdating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Icon className="h-3.5 w-3.5" />
          }
          {isUpdating ? 'Updating...' : cfg.label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-1.5 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {ALL_STATUSES.map(status => {
            const c = STATUS_CONFIG[status]
            const SIcon = c.icon
            const isActive = status === table.status
            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition text-left
                  ${isActive
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                  }`}
              >
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <SIcon className="h-3.5 w-3.5" />
                {c.label}
                {isActive && <span className="ml-auto text-gray-400 text-[10px]">current</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CashierTablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTables = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/tables')
      setTables(res.data?.tables || res.data || [])
    } catch (err) {
      setError('Failed to load tables. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  // ── Status change handler ───────────────────────────────────────────────────
  const handleStatusChange = async (table, newStatus) => {
    setUpdatingId(table._id)
    try {
      await apiRequest(`/tables/${table._id}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      // Optimistic update
      setTables(prev =>
        prev.map(t => t._id === table._id ? { ...t, status: newStatus } : t)
      )
    } catch (err) {
      alert(err.message || 'Failed to update table status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const counts = {
    all: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
  }
  const filtered = filter === 'all' ? tables : tables.filter(t => t.status === filter)

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[rgb(0,173,181)]" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4 p-6 text-center">
      <AlertCircle className="h-14 w-14 text-red-400" />
      <p className="text-red-600 font-medium">{error}</p>
      <button onClick={fetchTables} className="px-6 py-2.5 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90 transition font-medium">
        Retry
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {counts.all} tables · {counts.available} available · {counts.occupied} occupied
            </p>
          </div>
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{counts.available}</p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-rose-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{counts.occupied}</p>
              <p className="text-xs text-gray-500">Occupied</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{counts.reserved}</p>
              <p className="text-xs text-gray-500">Reserved</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-[rgb(0,173,181)] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(table => {
              const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available
              const isUpdating = updatingId === table._id

              return (
                <div
                  key={table._id}
                  className={`rounded-2xl border-2 p-4 flex flex-col gap-3 shadow-sm transition-all duration-300 ${cfg.cardBg} ${cfg.cardBorder}`}
                >
                  {/* Table Number + dot */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800">
                      T-{table.tableNumber}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} ${!isUpdating ? 'animate-pulse' : ''}`} />
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{table.capacity} seats</span>
                  </div>

                  {/* Status Dropdown */}
                  <StatusDropdown
                    table={table}
                    onStatusChange={handleStatusChange}
                    isUpdating={isUpdating}
                  />
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}