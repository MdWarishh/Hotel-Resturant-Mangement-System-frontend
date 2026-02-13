'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import {
  ShoppingCart,
  Receipt,
  Clock,
  LogOut,
  Loader2,
  Menu,
  X,
  BedDouble, // Added for Bookings icon
} from 'lucide-react';

export default function CashierLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== USER_ROLES.CASHIER) {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[rgb(238,238,238)]">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-emerald-600 border-b z-30 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cashier Panel</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`lg:relative fixed lg:translate-x-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 h-screen bg-white border-r z-50 lg:z-auto flex flex-col transition-transform duration-300 ease-in-out`}
      >
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Cashier Panel</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem
            icon={<ShoppingCart size={20} />}
            label="New Order"
            active={pathname === '/cashier/pos' || pathname === '/cashier/orders/new'}
            onClick={() => router.push('/cashier/pos')}
          />

          <SidebarItem
            icon={<Clock size={20} />}
            label="Running Orders"
            active={pathname === '/cashier/orders'}
            onClick={() => router.push('/cashier/orders')}
          />

          <SidebarItem
            icon={<Receipt size={20} />}
            label="Order History"
            active={pathname === '/cashier/pos/history'}
            onClick={() => router.push('/cashier/pos/history')}
          />

          {/* NEW: Bookings Section */}
          <SidebarItem
            icon={<BedDouble size={20} />}
            label="Bookings"
            active={pathname.startsWith('/cashier/bookings')}
            onClick={() => router.push('/cashier/bookings')}
          />
        </nav>

        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

/* Sidebar Item */
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-lg px-4 py-3.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-[rgb(0,173,181)] text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100 hover:text-[rgb(0,173,181)]'
      }`}
    >
      <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-600'}`}>
        {icon}
      </span>
      <span className="text-left">{label}</span>
    </button>
  );
}