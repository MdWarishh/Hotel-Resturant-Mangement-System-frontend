'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Receipt } from 'lucide-react';

export default function CashierHomePage() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[rgb(238,238,238)]">
      <div className="grid grid-cols-1 gap-6 rounded-xl bg-white p-10 shadow-lg md:grid-cols-2">

        {/* POS */}
        <button
          onClick={() => router.push('/cashier/pos')}
          className="flex flex-col items-center gap-4 rounded-xl border p-8 transition hover:shadow-lg"
        >
          <ShoppingCart className="h-10 w-10 text-[rgb(0,173,181)]" />
          <h3 className="text-lg font-semibold">Start POS</h3>
          <p className="text-sm text-gray-500 text-center">
            Create new orders and take payments
          </p>
        </button>

        {/* HISTORY */}
        <button
          onClick={() => router.push('/cashier/pos/history')}
          className="flex flex-col items-center gap-4 rounded-xl border p-8 transition hover:shadow-lg"
        >
          <Receipt className="h-10 w-10 text-gray-600" />
          <h3 className="text-lg font-semibold">Order History</h3>
          <p className="text-sm text-gray-500 text-center">
            View completed & past orders
          </p>
        </button>

      </div>
    </div>
  );
}