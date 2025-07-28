'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: string;
  responseTime?: number;
}

export function SystemHealth() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const response = await fetch('/api/admin/health');
        if (response.ok) {
          const data = await response.json();
          setHealthChecks(data.checks);
        }
      } catch (error) {
        logger.error('Failed to fetch health status', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700 bg-green-50';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50';
      case 'error':
        return 'text-red-700 bg-red-50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Health
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
      <div className="space-y-4">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-start space-x-3">
            {getStatusIcon(check.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {check.name}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}
                >
                  {check.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{check.message}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                <span>
                  Last checked:{' '}
                  {new Date(check.lastChecked).toLocaleTimeString()}
                </span>
                {check.responseTime && (
                  <span>Response: {check.responseTime}ms</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}
