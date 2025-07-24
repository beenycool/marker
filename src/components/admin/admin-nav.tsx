'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CogIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Business Intelligence', href: '/admin/business', icon: CurrencyDollarIcon },
  { name: 'Prompts', href: '/admin/prompts', icon: DocumentTextIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartPieIcon },
  { name: 'A/B Tests', href: '/admin/ab-tests', icon: BeakerIcon },
  { name: 'System', href: '/admin/system', icon: ExclamationTriangleIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to App</span>
            </Link>
            
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Admin Mode
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}