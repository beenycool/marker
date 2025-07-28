'use client';

import { useState, useEffect } from 'react';
import { AdminMetrics } from '@/components/admin/admin-metrics';
import { RecentActivity } from '@/components/admin/recent-activity';
import { SystemHealth } from '@/components/admin/system-health';
import { QuickActions } from '@/components/admin/quick-actions';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor system performance, manage users, and configure AI models
        </p>
      </div>

      <AdminMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealth />
        <QuickActions />
      </div>

      <RecentActivity />
    </div>
  );
}
