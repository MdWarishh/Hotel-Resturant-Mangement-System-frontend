'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/services/api';
import { 
  Plus, Loader2, Search, RefreshCw, X, ChevronLeft, ChevronRight, 
  Package, AlertTriangle, TrendingUp, DollarSign, Eye, 
  Upload
} from 'lucide-react';

export default function InventoryListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // 'low', 'out', 'in', ''
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    let url = `/inventory?page=${page}&limit=${limit}`;

    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (categoryFilter) url += `&category=${categoryFilter}`;
    if (stockFilter === 'low') url += `&lowStock=true`;
    if (stockFilter === 'out') url += `&outOfStock=true`;

    try {
      const res = await apiRequest(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
      setTotal(res.pagination?.total || data.length);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, categoryFilter, stockFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Reset page on filter change
  useEffect(() => setPage(1), [searchTerm, categoryFilter, stockFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchInventory, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  // Stats calculations
  const totalItems = total;
  const lowStock = items.filter(i => i.quantity.current <= i.quantity.minimum).length;
  const outOfStock = items.filter(i => i.quantity.current === 0).length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity.current * (i.pricing.purchasePrice || 0)), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.quantity.current * (i.pricing.purchasePrice || 0)), 0);

  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-0">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-teal-100 p-3 md:p-4 rounded-xl md:rounded-2xl">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Manage hotel & restaurant stock</p>
          </div>
        </div>
               
         <Link
    href="/hotel-admin/inventory/bulk-upload"
     className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg transition-all text-sm md:text-base"
  >
    <Upload className="h-4 w-4" />
    Bulk Upload
  </Link>

        <Link
          href="/hotel-admin/inventory/create"
          className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg transition-all text-sm md:text-base"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          Add New Item
        </Link>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <StatCard title="Total Items" value={totalItems} icon={<Package />} color="teal" />
        <StatCard title="Low Stock" value={lowStock} icon={<AlertTriangle />} color={lowStock > 0 ? "orange" : "gray"} />
        <StatCard title="Out of Stock" value={outOfStock} icon={<Package />} color={outOfStock > 0 ? "red" : "gray"} />
        <StatCard title="Stock Value" value={`₹${totalValue.toLocaleString('en-IN')}`} icon={<DollarSign />} color="emerald" />
        <StatCard title="Total Cost" value={`₹${totalCost.toLocaleString('en-IN')}`} icon={<TrendingUp />} color="blue" />
      </div>

      {/* Filters - Fully Responsive */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm text-black">
        <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-3 md:items-end">
          {/* Search */}
          <div className="flex-1 min-w-full md:min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-3 md:top-4 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search item name or SKU..."
                className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl focus:border-teal-600 outline-none text-sm md:text-base"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto border border-gray-200 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:border-teal-600 outline-none text-sm md:text-base"
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="beverage">Beverage</option>
            <option value="supplies">Supplies</option>
            <option value="cleaning">Cleaning</option>
            <option value="amenities">Amenities</option>
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full md:w-auto border border-gray-200 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:border-teal-600 outline-none text-sm md:text-base"
          >
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="in">In Stock</option>
          </select>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={fetchInventory}
              className="flex-1 md:flex-initial px-4 md:px-6 py-3 md:py-4 bg-gray-100 hover:bg-gray-200 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium text-sm md:text-base"
            >
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {(searchTerm || categoryFilter || stockFilter) && (
              <button
                onClick={clearFilters}
                className="flex-1 md:flex-initial px-4 md:px-6 py-3 md:py-4 bg-red-50 text-red-700 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium hover:bg-red-100 text-sm md:text-base"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="flex-1 md:flex-initial border border-gray-200 rounded-xl md:rounded-2xl px-3 md:px-6 py-3 md:py-4 focus:border-teal-600 text-sm md:text-base"
            >
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-6 md:px-8 py-4 md:py-6 text-left font-medium">Item</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-left font-medium">Category</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-center font-medium">Current Stock</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-center font-medium">Min Stock</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-center font-medium">Unit</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-center font-medium">Value</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-left font-medium">Status</th>
                <th className="px-6 md:px-8 py-4 md:py-6 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 md:px-8 py-4 md:py-6"><div className="h-5 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6"><div className="h-5 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-center"><div className="h-5 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-center"><div className="h-5 bg-gray-200 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6"><div className="h-5 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 md:px-8 py-4 md:py-6"><div className="h-8 bg-gray-200 rounded w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 md:py-20 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.quantity.current <= item.quantity.minimum;
                  const isOut = item.quantity.current === 0;
                  const value = (item.quantity.current * (item.pricing.purchasePrice || 0)).toLocaleString('en-IN');

                  return (
                    <tr key={item._id} className={`hover:bg-teal-50 transition-colors ${isOut ? 'bg-red-50' : isLow ? 'bg-orange-50' : ''}`}>
                      <td className="px-6 md:px-8 py-4 md:py-6 font-medium text-gray-900">
                        <div className="min-w-0">
                          <div className="truncate">{item.name}</div>
                          {item.sku && <span className="text-xs text-gray-500 block mt-1">SKU: {item.sku}</span>}
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-gray-900 capitalize">{item.category}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-gray-900 text-center font-bold text-lg">{item.quantity.current}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-center text-gray-900">{item.quantity.minimum}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-center capitalize text-gray-900">{item.unit}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-center font-medium text-gray-900 whitespace-nowrap">₹{value}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        {isOut ? (
                          <span className="inline-block px-3 md:px-4 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-3 md:px-4 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-3 md:px-4 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                        <div className="flex justify-end gap-2 md:gap-3">
                          <Link
                            href={`/hotel-admin/inventory/${item._id}`}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 bg-teal-600 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-medium hover:bg-teal-700 transition-all whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            View
                          </Link>

                          <Link
                            href={`/hotel-admin/inventory/${item._id}/adjust`}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 bg-gray-800 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-medium hover:bg-gray-900 transition-all whitespace-nowrap"
                          >
                            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-8 py-4 md:py-5 bg-gray-50 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm">
            <div className="text-center sm:text-left">
              Showing {(page-1)*limit + 1} – {Math.min(page*limit, total)} of {total} items
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="p-2 md:p-3 hover:bg-white rounded-xl md:rounded-2xl disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <span className="font-medium">Page {page} of {totalPages}</span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="p-2 md:p-3 hover:bg-white rounded-xl md:rounded-2xl disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
            No inventory items found
          </div>
        ) : (
          items.map((item) => {
            const isLow = item.quantity.current <= item.quantity.minimum;
            const isOut = item.quantity.current === 0;
            const value = (item.quantity.current * (item.pricing.purchasePrice || 0)).toLocaleString('en-IN');

            return (
              <div key={item._id} className={`bg-white rounded-2xl p-4 border shadow-sm ${isOut ? 'border-red-200 bg-red-50' : isLow ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
                {/* Item Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-gray-900 text-base truncate">{item.name}</h3>
                    {item.sku && <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>}
                  </div>
                  {isOut ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                      Out
                    </span>
                  ) : isLow ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                      Low
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                      In Stock
                    </span>
                  )}
                </div>

                {/* Item Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Category</p>
                    <p className="font-medium text-gray-900 capitalize">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Unit</p>
                    <p className="font-medium text-gray-900 capitalize">{item.unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Current Stock</p>
                    <p className="font-bold text-gray-900 text-lg">{item.quantity.current}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Min Stock</p>
                    <p className="font-medium text-gray-900">{item.quantity.minimum}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 text-xs">Value</p>
                    <p className="font-bold text-gray-900 text-lg">₹{value}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/hotel-admin/inventory/${item._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>

                  <Link
                    href={`/hotel-admin/inventory/${item._id}/adjust`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-all"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Adjust
                  </Link>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-center text-sm text-gray-600 mb-3">
              Showing {(page-1)*limit + 1} – {Math.min(page*limit, total)} of {total} items
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="font-medium">Page {page} of {totalPages}</span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Banner */}
      {lowStock > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-start gap-3 md:gap-4">
          <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-orange-800">Low Stock Alert</h3>
            <p className="text-sm md:text-base text-orange-700 mt-1 md:mt-2">
              {lowStock} item{lowStock > 1 ? 's are' : ' is'} running low on stock. Please review and restock soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable Stat Card - Responsive */
function StatCard({ title, value, icon, color = 'teal' }) {
  const colors = {
    teal: 'text-teal-600 bg-teal-50 border-teal-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    gray: 'text-gray-600 bg-gray-50 border-gray-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  };

  return (
    <div className={`rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border ${colors[color]}`}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white shadow-sm flex-shrink-0">
          <div className="w-4 h-4 md:w-6 md:h-6">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium truncate">{title}</p>
          <p className="text-xl md:text-4xl font-bold mt-1 md:mt-2 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}