'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import {
  ShoppingCart,
  Receipt,
  LogOut,
  Loader2,
} from 'lucide-react';

export default function CashierLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== USER_ROLES.CASHIER) {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[rgb(238,238,238)]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Cashier Panel
          </h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem
            icon={<ShoppingCart size={18} />}
            label="New Order"
            active={pathname === '/cashier/pos'}
            onClick={() => router.push('/cashier/pos')}
          />

          <SidebarItem
            icon={<Receipt size={18} />}
            label="Order History"
            active={pathname === '/cashier/pos/history'}
            onClick={() =>
              router.push('/cashier/pos/history')
            }
          />
        </nav>

        <div className="border-t p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

/* ---------- Sidebar Item ---------- */
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? 'bg-black text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}