'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Hotel, Users, BarChart3, Menu, X, Crown } from 'lucide-react';

const menu = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { name: 'Hotels', href: '/super-admin/hotels', icon: Hotel },
  { name: 'Users', href: '/super-admin/users', icon: Users },
  // { name: 'Reports', href: '/super-admin/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/super-admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)] text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgb(34,40,49)]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-[rgb(57,62,70)]/10 bg-white shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO/HEADER */}
        <div className="flex items-center gap-3 border-b border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[rgb(34,40,49)]">Main Admin</h2>
            <p className="text-xs text-[rgb(57,62,70)]">Super Admin</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="mt-6 space-y-1 px-4">
          {menu.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[rgb(0,173,181)] text-white shadow-lg shadow-[rgb(0,173,181)]/30'
                    : 'text-[rgb(57,62,70)] hover:bg-[rgb(238,238,238)] hover:text-[rgb(34,40,49)]'
                }`}
              >
                {/* ACTIVE INDICATOR */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                )}

                <item.icon
                  size={18}
                  className={`transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
                <span>{item.name}</span>

                {/* HOVER EFFECT */}
                {!active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 scale-x-0 bg-[rgb(0,173,181)] transition-transform duration-200 group-hover:scale-x-100" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 p-4">
          <p className="text-center text-xs text-[rgb(57,62,70)]">
            Amulya Resturant
          </p>
        </div>
      </aside>
    </>
  );
}