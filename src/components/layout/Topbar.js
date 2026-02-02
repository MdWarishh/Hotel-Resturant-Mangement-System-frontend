'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgb(57,62,70)]/10 bg-white px-6 shadow-sm">
      <h1 className="text-lg font-semibold text-[rgb(34,40,49)]">
        Super Admin Dashboard
      </h1>

      <div className="flex items-center gap-4">
        {/* USER INFO */}
        <div className="flex items-center gap-2 rounded-lg bg-[rgb(238,238,238)] px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(0,173,181)]/10">
            <User className="h-4 w-4 text-[rgb(0,173,181)]" />
          </div>
          <span className="text-sm font-medium text-[rgb(34,40,49)]">
            {user?.name}
          </span>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logout}
          className="group flex items-center gap-2 rounded-lg bg-[rgb(57,62,70)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[rgb(34,40,49)] hover:shadow-lg"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          Logout
        </button>
      </div>
    </header>
  );
}