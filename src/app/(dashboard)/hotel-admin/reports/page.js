'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { USER_ROLES } from '@/utils/constants';

/**
 * Reports Overview
 * Enterprise reporting hub
 */
export default function ReportsOverviewPage() {
  const { user } = useAuth();

  if (!user || user.role !== USER_ROLES.HOTEL_ADMIN) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <h1 className="text-xl font-semibold mb-2">
        Reports
      </h1>

      <p className="text-sm text-gray-500 mb-8">
        Business, operational, and financial reports for decision making.
      </p>

      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        {/* Revenue */}
        <Link
          href="/hotel-admin/reports/revenue"
          className="border rounded p-5 hover:shadow transition"
        >
          <h3 className="font-medium mb-1">
            Revenue Report
          </h3>
          <p className="text-sm text-gray-500">
            Combined room & restaurant revenue analysis
          </p>
        </Link>

        {/* Sales */}
        <Link
          href="/hotel-admin/reports/sales"
          className="border rounded p-5 hover:shadow transition"
        >
          <h3 className="font-medium mb-1">
            Sales Report (POS)
          </h3>
          <p className="text-sm text-gray-500">
            Order volume, top items, average bill value
          </p>
        </Link>

        {/* Occupancy */}
        <Link
          href="/hotel-admin/reports/occupancy"
          className="border rounded p-5 hover:shadow transition"
        >
          <h3 className="font-medium mb-1">
            Occupancy Report
          </h3>
          <p className="text-sm text-gray-500">
            Room utilization & booking trends
          </p>
        </Link>

        {/* Inventory */}
        <Link
          href="/hotel-admin/reports/inventory"
          className="border rounded p-5 hover:shadow transition"
        >
          <h3 className="font-medium mb-1">
            Inventory Report
          </h3>
          <p className="text-sm text-gray-500">
            Stock movement, consumption & valuation
          </p>
        </Link>
      </div>
    </div>
  );
}