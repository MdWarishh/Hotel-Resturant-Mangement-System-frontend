'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Hotel, Users, Menu, X, Crown, ChevronDown, ChevronRight, Store } from 'lucide-react';
import { apiRequest } from '@/services/api';

const mainMenu = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { name: 'Users', href: '/super-admin/users', icon: Users },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hotelsOpen, setHotelsOpen] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await apiRequest('/hotels');
        // Support both res.data (array) or res.data.hotels depending on your API
        const list = Array.isArray(res.data) ? res.data : res.data?.hotels || [];
        setHotels(list);
      } catch (err) {
        console.error('Failed to fetch hotels:', err);
      } finally {
        setLoadingHotels(false);
      }
    };
    fetchHotels();
  }, []);

  const isActive = (href) => {
    if (href === '/super-admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const NavLink = ({ href, icon: Icon, name, indent = false }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          indent ? 'ml-4 py-2' : ''
        } ${
          active
            ? 'bg-[rgb(0,173,181)] text-white shadow-lg shadow-[rgb(0,173,181)]/30'
            : 'text-[rgb(57,62,70)] hover:bg-[rgb(238,238,238)] hover:text-[rgb(34,40,49)]'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white" />
        )}
        <Icon
          size={indent ? 15 : 18}
          className={`flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
        />
        <span className="truncate">{name}</span>
        {!active && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 scale-x-0 bg-[rgb(0,173,181)] transition-transform duration-200 group-hover:scale-x-100" />
        )}
      </Link>
    );
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
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-[rgb(57,62,70)]/10 bg-white shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${
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
        <nav className="mt-4 flex-1 overflow-y-auto space-y-1 px-4 pb-4">
          {/* Static links */}
          {mainMenu.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} />
          ))}

          {/* Hotels Section with dropdown */}
          <div className="pt-2">
            {/* Hotels header — click karke expand/collapse karo */}
            <button
              onClick={() => setHotelsOpen(!hotelsOpen)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(57,62,70)] hover:bg-[rgb(238,238,238)] hover:text-[rgb(34,40,49)] transition-all duration-200"
            >
              <Hotel size={18} className="flex-shrink-0" />
              <span className="flex-1 text-left">Hotels</span>
              {hotelsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>

            {/* Hotels List */}
            {hotelsOpen && (
              <div className="mt-1 space-y-0.5">
                {/* "All Hotels" link */}
                <NavLink
                  href="/super-admin/hotels"
                  icon={Hotel}
                  name="All Hotels"
                  indent={true}
                />

                {/* Individual hotels */}
                {loadingHotels ? (
                  <p className="ml-7 py-2 text-xs text-[rgb(57,62,70)]/60 animate-pulse">Loading...</p>
                ) : hotels.length === 0 ? (
                  <p className="ml-7 py-2 text-xs text-[rgb(57,62,70)]/60">No hotels yet</p>
                ) : (
                  hotels.map((hotel) => (
                    <NavLink
                      key={hotel._id}
                      href={`/super-admin/hotels/${hotel._id}`}
                      icon={Store}
                      name={hotel.name}
                      indent={true}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 p-4">
          <p className="text-center text-xs text-[rgb(57,62,70)]">
            Amulya Resturant
          </p>
        </div>
      </aside>
    </>
  );
}