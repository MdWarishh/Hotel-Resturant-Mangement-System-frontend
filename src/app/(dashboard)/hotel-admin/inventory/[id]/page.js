// app/hotel-admin/inventory/[id]/page.js  (or your exact path)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiRequest } from '@/services/api';
import { ArrowLeft, Package, Edit, History, PlusCircle } from 'lucide-react';

export default function InventoryViewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemRes = await apiRequest(`/inventory/${id}`);
        const txRes = await apiRequest(`/inventory/${id}/transactions`);

        setItem(itemRes?.data?.item || null);
        setTransactions(
          Array.isArray(txRes?.data?.transactions)
            ? txRes.data.transactions
            : []
        );
      } catch (err) {
        console.error('Failed to fetch inventory details', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[#8a8f99] text-lg"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00adb5]"></div>
          Loading item details...
        </motion.div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#222831] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-red-900/30 border border-red-800/50 p-6 text-center text-red-300 max-w-md"
        >
          <h3 className="text-xl font-semibold mb-2">Item Not Found</h3>
          <p>The inventory item could not be loaded or does not exist.</p>
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
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-[#cccccc] hover:text-[#00adb5] transition-colors p-2 rounded-lg hover:bg-[#3a3f46]"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <Package size={28} className="text-[#00adb5]" />
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#eeeeee] tracking-tight">
                {item.name}
              </h2>
            </div>
          </div>

          <Link
            href={`/hotel-admin/inventory/${id}/adjust`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00adb5] text-[#222831] font-medium rounded-lg shadow-lg shadow-[#00adb5]/20 hover:bg-[#00c4d1] hover:shadow-xl hover:shadow-[#00adb5]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00adb5]/40"
          >
            <PlusCircle size={18} />
            Adjust Stock
          </Link>
        </div>

        {/* ITEM INFO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <InfoCard label="Category" value={item.category?.charAt(0).toUpperCase() + item.category?.slice(1) || '—'} icon="folder" />
          <InfoCard label="Unit" value={item.unit?.toUpperCase() || '—'} icon="scale" />
          <InfoCard 
            label="Current Stock" 
            value={item.quantity?.current ?? 0} 
            icon="package"
            highlight={item.quantity?.current <= (item.quantity?.minimum || 0) ? 'low' : 'normal'}
          />
          <InfoCard label="Minimum Stock (Alert)" value={item.quantity?.minimum ?? 0} icon="alert-triangle" />
          <InfoCard label="Purchase Price" value={`₹${(item.pricing?.purchasePrice ?? 0).toFixed(2)}`} icon="rupee" />
          <InfoCard 
            label="Status" 
            value={item.isActive ? 'Active' : 'Inactive'} 
            icon="power"
            highlight={item.isActive ? 'active' : 'inactive'}
          />
          <InfoCard label="Created At" value={new Date(item.createdAt).toLocaleString()} icon="calendar" />
          <InfoCard label="Created By" value={item.createdBy?.name || '—'} icon="user" />
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-[#3a3f46] rounded-2xl shadow-2xl shadow-black/30 border border-[#222831]/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#4a5058] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History size={20} className="text-[#00adb5]" />
              <h3 className="text-lg font-semibold text-[#eeeeee]">
                Stock Transaction History
              </h3>
            </div>
            <span className="text-sm text-[#8a8f99]">
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#cccccc]">
              <thead className="bg-[#2d333b] border-b border-[#4a5058]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Date</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Type</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Quantity</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Stock After</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Reason</th>
                  <th className="px-6 py-4 font-medium text-[#eeeeee]">Performed By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#4a5058]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#8a8f99]">
                      No transactions recorded yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => (
                    <motion.tr
                      key={tx._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                      whileHover={{ backgroundColor: '#2d333b', scale: 1.005 }}
                      className="transition-all duration-150"
                    >
                      <td className="px-6 py-4">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium">
                        {tx.transactionType}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${
                        tx.transactionType === 'purchase' 
                          ? 'text-[#00adb5]' 
                          : 'text-[#ff6b6b]'
                      }`}>
                        {tx.transactionType === 'purchase' 
                          ? `+${tx.quantity}` 
                          : `-${tx.quantity}`}
                      </td>
                      <td className="px-6 py-4">
                        {tx.previousStock} → {tx.newStock}
                      </td>
                      <td className="px-6 py-4 text-[#8a8f99]">
                        {tx.reason || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {tx.performedBy?.name || '—'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- INFO CARD ---------- */
function InfoCard({ label, value, icon, highlight }) {
  const iconMap = {
    folder: 'folder',
    scale: 'scale',
    package: 'package',
    'alert-triangle': 'alert-triangle',
    rupee: 'indian-rupee',
    power: 'power',
    calendar: 'calendar',
    user: 'user',
  };

  let bgClass = 'bg-[#00adb5]/10 text-[#00adb5]';
  if (highlight === 'low') bgClass = 'bg-[#ff6b6b]/10 text-[#ff6b6b]';
  if (highlight === 'inactive') bgClass = 'bg-[#4a5058]/30 text-[#cccccc]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#3a3f46] rounded-xl p-5 border border-[#4a5058] shadow-sm hover:shadow-md hover:border-[#00adb5]/30 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgClass}`}>
          <Package size={20} /> {/* fallback - replace with dynamic icon if needed */}
        </div>
        <p className="text-sm text-[#8a8f99]">{label}</p>
      </div>
      <p className="text-xl font-semibold text-[#eeeeee]">
        {value}
      </p>
    </motion.div>
  );
}