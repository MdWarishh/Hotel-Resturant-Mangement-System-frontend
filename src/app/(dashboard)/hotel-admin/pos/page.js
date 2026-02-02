'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import { Loader2, ArrowRight } from 'lucide-react';

export default function POSRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    switch (user.role) {
      case USER_ROLES.CASHIER:
        router.replace('/hotel-admin/pos/orders/new');
        break;

      case USER_ROLES.KITCHEN_STAFF:
        router.replace('/hotel-admin/pos/kitchen');
        break;

      case USER_ROLES.MANAGER:
        router.replace('/hotel-admin/pos/orders');
        break;

      case USER_ROLES.HOTEL_ADMIN:
        router.replace('/hotel-admin/pos/overview');
        break;

      default:
        router.replace('/hotel-admin');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[rgb(238,238,238)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Spinning loader */}
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(0,173,181)]" />
          
          {/* Pulse effect */}
          <div className="absolute inset-0 animate-ping">
            <Loader2 className="h-12 w-12 text-[rgb(0,173,181)] opacity-20" />
          </div>
        </div>

        <div className="text-center">
          <p className="flex items-center gap-2 text-sm font-medium text-[rgb(34,40,49)]">
            Redirecting to POS
            <ArrowRight className="h-4 w-4 animate-pulse text-[rgb(0,173,181)]" />
          </p>
          <p className="mt-1 text-xs text-[rgb(57,62,70)]">
            Please wait...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}