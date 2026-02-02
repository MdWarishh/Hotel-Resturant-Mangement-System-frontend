'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { Plus, Loader2, Package, Eye, TrendingUp, AlertTriangle } from 'lucide-react';

export default function InventoryListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      const res = await apiRequest('/inventory');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading inventory...</p>
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
            <Package className="h-5 w-5 text-[rgb(0,173,181)]" />
          </div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Inventory</h2>
        </div>

        <Link
          href="/hotel-admin/inventory/create"
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[rgb(0,173,181)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Item
        </Link>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[rgb(57,62,70)] text-white">
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Unit</th>
                <th className="px-4 py-3 text-center font-medium">Current Stock</th>
                <th className="px-4 py-3 text-center font-medium">Min Stock</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgb(57,62,70)]/10">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[rgb(57,62,70)]">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.quantity?.current <= item.quantity?.minimum;

                  return (
                    <tr
                      key={item._id}
                      className="transition-colors duration-150 hover:bg-[rgb(238,238,238)]/50"
                    >
                      {/* ITEM NAME */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)]">
                            <Package className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-[rgb(34,40,49)]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-4 py-3 capitalize text-[rgb(57,62,70)]">
                        {item.category}
                      </td>

                      {/* UNIT */}
                      <td className="px-4 py-3 text-[rgb(57,62,70)]">
                        {item.unit}
                      </td>

                      {/* CURRENT STOCK */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isLow && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`font-semibold ${
                              isLow ? 'text-red-600' : 'text-[rgb(34,40,49)]'
                            }`}
                          >
                            {item.quantity?.current}
                          </span>
                        </div>
                      </td>

                      {/* MIN STOCK */}
                      <td className="px-4 py-3 text-center text-[rgb(57,62,70)]">
                        {item.quantity?.minimum}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <StatusBadge active={item.isActive} />
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/hotel-admin/inventory/${item._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(0,173,181)]/10 px-3 py-1.5 text-xs font-medium text-[rgb(0,173,181)] transition-all duration-200 hover:bg-[rgb(0,173,181)] hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>

                          <Link
                            href={`/hotel-admin/inventory/${item._id}/adjust`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(57,62,70)]/10 px-3 py-1.5 text-xs font-medium text-[rgb(57,62,70)] transition-all duration-200 hover:bg-[rgb(57,62,70)] hover:text-white"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Adjust
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOW STOCK WARNING */}
      {items.some((item) => item.quantity?.current <= item.quantity?.minimum) && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">Low Stock Alert</p>
            <p className="mt-1 text-xs text-red-700">
              Some items are running low on stock. Please restock soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ active }) {
  const styles = active
    ? 'bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30'
    : 'bg-[rgb(238,238,238)] text-[rgb(57,62,70)] border border-[rgb(57,62,70)]/20';

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}