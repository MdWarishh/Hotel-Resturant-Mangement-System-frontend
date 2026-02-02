'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';
import { 
  ShoppingCart, 
  ChefHat, 
  Receipt, 
  BarChart3, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';

/**
 * POS Overview - Hotel Admin Control Center
 * Single entry point for all POS features
 */
export default function POSOverviewPage() {
  const { user } = useAuth();

  if (!user || user.role !== USER_ROLES.HOTEL_ADMIN) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Unauthorized access</span>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Cashier POS',
      description: 'View live order creation screen (read-only)',
      href: '/hotel-admin/pos/orders/new',
      icon: ShoppingCart,
      color: 'rgb(0,173,181)',
    },
    {
      title: 'Kitchen (Live)',
      description: 'Monitor live kitchen order flow',
      href: '/hotel-admin/pos/kitchen',
      icon: ChefHat,
      color: 'rgb(0,173,181)',
    },
    {
      title: 'Orders & Billing',
      description: 'Payments, completed orders & invoices',
      href: '/hotel-admin/pos/orders',
      icon: Receipt,
      color: 'rgb(0,173,181)',
    },
    {
      title: 'POS Analytics (Live)',
      description: 'Sales, payments, trends & performance',
      href: '/hotel-admin/pos/analytics',
      icon: BarChart3,
      color: 'rgb(0,173,181)',
    },
  ];

  return (
    <div className="h-full">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[rgb(34,40,49)]">
          POS Control Center
        </h1>
        <p className="mt-2 text-sm text-[rgb(57,62,70)]">
          Monitor operations, billing, and performance in real time.
        </p>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-4xl">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] transition-all duration-300 group-hover:bg-[rgb(0,173,181)] group-hover:text-white group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold text-[rgb(34,40,49)]">
                {card.title}
              </h3>
              <p className="text-sm text-[rgb(57,62,70)]">
                {card.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-2 text-[rgb(0,173,181)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="text-sm font-medium">View</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>

              {/* Hover Border Effect */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[rgb(0,173,181)] transition-all duration-300 group-hover:w-full"></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}