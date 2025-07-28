'use client';

import { useState } from 'react';
import {
  UserIcon,
  DocumentTextIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export function QuickActions() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/admin/cache/refresh', { method: 'POST' });
    } catch (error) {
      logger.error('Failed to refresh cache', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const actions = [
    {
      title: 'Create Admin User',
      description: 'Add a new admin or moderator',
      icon: UserIcon,
      color: 'blue',
      href: '/admin/users/create',
    },
    {
      title: 'New Prompt Version',
      description: 'Create a new prompt variant',
      icon: DocumentTextIcon,
      color: 'green',
      href: '/admin/prompts/create',
    },
    {
      title: 'Start A/B Test',
      description: 'Launch a new experiment',
      icon: BeakerIcon,
      color: 'purple',
      href: '/admin/ab-tests/create',
    },
    {
      title: 'View Alerts',
      description: 'Check system alerts',
      icon: ExclamationTriangleIcon,
      color: 'red',
      href: '/admin/alerts',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      red: 'bg-red-500 hover:bg-red-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div
              className={`p-2 rounded-lg ${getColorClasses(action.color)} text-white mr-4`}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {action.title}
              </h4>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleRefreshCache}
          disabled={isRefreshing}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Cache'}</span>
        </button>
      </div>
    </div>
  );
}
