'use client'
import { apiRequest } from '@/services/api';
import { Building2, Users, UserCheck, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SuperAdminDashboard() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // You will need to create this endpoint in your backend
        const res = await apiRequest('/super-admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(0,173,181)]" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-[rgb(34,40,49)]">
        Overview
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          title="Total Hotels" 
          value={stats?.totalHotels || 0} 
          icon={<Building2 className="h-6 w-6" />}
        />
        <Card 
          title="Total Users" 
          value={stats?.totalUsers || 0}
          icon={<Users className="h-6 w-6" />}
        />
        <Card 
          title="Active Staff" 
          value={stats?.activeStaff || 0}
          icon={<UserCheck className="h-6 w-6" />}
        />
        <Card 
          title="Revenue" 
          value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`} 
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <div className="mt-10 rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-[rgb(34,40,49)]">
          System Status
        </h3>
        <p className="text-sm text-[rgb(57,62,70)]">
          Backend connected. APIs will be integrated next.
        </p>
      </div>
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Icon Background */}
      <div className="absolute right-4 top-4 opacity-10 text-[rgb(0,173,181)] transition-all duration-300 group-hover:opacity-20 group-hover:scale-110">
        {icon}
      </div>
      
      {/* Content */}
      <div className="relative">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] transition-all duration-300 group-hover:bg-[rgb(0,173,181)] group-hover:text-white">
          {icon}
        </div>
        <p className="text-sm font-medium text-[rgb(57,62,70)]">{title}</p>
        <p className="mt-2 text-3xl font-bold text-[rgb(34,40,49)]">{value}</p>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[rgb(0,173,181)] transition-all duration-300 group-hover:w-full"></div>
    </div>
  );
}