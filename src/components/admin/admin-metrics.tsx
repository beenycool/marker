'use client';

import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  DocumentIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  totalSubmissions: number;
  todaySubmissions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageScore: number;
  errorRate: number;
  avgResponseTime: number;
  totalCost: number;
}

export function AdminMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Failed to load metrics</span>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers.toLocaleString(),
      change: `${metrics.activeUsers} active`,
      icon: UsersIcon,
      color: 'blue',
    },
    {
      title: 'Submissions',
      value: metrics.totalSubmissions.toLocaleString(),
      change: `${metrics.todaySubmissions} today`,
      icon: DocumentIcon,
      color: 'green',
    },
    {
      title: 'Revenue',
      value: `£${metrics.totalRevenue.toLocaleString()}`,
      change: `£${metrics.monthlyRevenue} this month`,
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      title: 'Avg Score',
      value: `${metrics.averageScore.toFixed(1)}/100`,
      change: 'Last 30 days',
      icon: ChartBarIcon,
      color: 'yellow',
    },
    {
      title: 'Error Rate',
      value: `${(metrics.errorRate * 100).toFixed(2)}%`,
      change: 'Last 24 hours',
      icon: ExclamationTriangleIcon,
      color: metrics.errorRate > 0.05 ? 'red' : 'green',
    },
    {
      title: 'Response Time',
      value: `${metrics.avgResponseTime}ms`,
      change: 'P95 latency',
      icon: ChartBarIcon,
      color: metrics.avgResponseTime > 2000 ? 'red' : 'green',
    },
    {
      title: 'AI Cost',
      value: `$${metrics.totalCost.toFixed(2)}`,
      change: 'This month',
      icon: CurrencyDollarIcon,
      color: 'orange',
    },
    {
      title: 'Profit Margin',
      value: `${(((metrics.monthlyRevenue * 0.85) - metrics.totalCost) / (metrics.monthlyRevenue * 0.85) * 100).toFixed(1)}%`,
      change: 'After fees',
      icon: ChartBarIcon,
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      purple: 'bg-purple-50 text-purple-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      red: 'bg-red-50 text-red-700',
      orange: 'bg-orange-50 text-orange-700',
      indigo: 'bg-indigo-50 text-indigo-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.change}</p>
            </div>
            <div className={`p-3 rounded-full ${getColorClasses(metric.color)}`}>
              <metric.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}