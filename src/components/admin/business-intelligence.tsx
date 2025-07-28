'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { logger } from '@/lib/logger';

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    daily: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new_today: number;
    conversion_rate: number;
    churn_rate: number;
  };
  ai_performance: {
    avg_score: number;
    success_rate: number;
    avg_response_time: number;
    total_cost: number;
    cost_per_request: number;
  };
  submissions: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
}

interface TrendData {
  date: string;
  revenue: number;
  users: number;
  submissions: number;
  avg_score: number;
}

interface CostBreakdown {
  provider: string;
  cost: number;
  percentage: number;
  color: string;
}

export function BusinessIntelligence() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchBusinessMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/business-metrics?range=${timeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      logger.error('Error fetching business metrics', error);
    }
  }, [timeRange]);

  const fetchTrendData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/trends?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      }
    } catch (error) {
      logger.error('Error fetching trend data', error);
    }
  }, [timeRange]);

  const fetchCostBreakdown = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/cost-breakdown?range=${timeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setCostBreakdown(data);
      }
    } catch (error) {
      logger.error('Error fetching cost breakdown', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchBusinessMetrics();
    fetchTrendData();
    fetchCostBreakdown();
  }, [timeRange, fetchBusinessMetrics, fetchTrendData, fetchCostBreakdown]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Unable to load metrics
        </h3>
      </div>
    );
  }

  const profitMargin =
    metrics.revenue.total > 0
      ? ((metrics.revenue.total - metrics.ai_performance.total_cost) /
          metrics.revenue.total) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Business Intelligence
          </h2>
          <p className="text-gray-600">
            Key performance indicators and financial metrics
          </p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as '7d' | '30d' | '90d')}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.revenue.total)}
              </p>
              <div className="flex items-center mt-1">
                {metrics.revenue.growth >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${metrics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercentage(Math.abs(metrics.revenue.growth))} vs last
                  period
                </span>
              </div>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.users.active.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {metrics.users.new_today} new today
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* AI Performance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                AI Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.ai_performance.success_rate / 100)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Avg score:{' '}
                {metrics.ai_performance.avg_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">
                {profitMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Cost: {formatCurrency(metrics.ai_performance.total_cost)}
              </p>
            </div>
            <TrendingUpIcon
              className={`h-8 w-8 ${profitMargin > 50 ? 'text-green-500' : profitMargin > 20 ? 'text-yellow-500' : 'text-red-500'}`}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={value => `£${value}`} />
              <Tooltip
                formatter={value => [
                  formatCurrency(value as number),
                  'Revenue',
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Performance Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 20]} />
              <Tooltip
                formatter={value => [
                  (value as number).toFixed(1),
                  'Average Score',
                ]}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Cost Breakdown
          </h3>
          {costBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="cost"
                    label={({ percentage }) =>
                      `${(percentage * 100).toFixed(0)}%`
                    }
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {costBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.provider}</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No cost data available
            </p>
          )}
        </div>

        {/* Key Insights */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Insights
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUpIcon className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Revenue per user:{' '}
                  {formatCurrency(
                    metrics.revenue.total / Math.max(metrics.users.total, 1)
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-purple-900">
                  Avg response time: {metrics.ai_performance.avg_response_time}
                  ms
                </span>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  Cost per request:{' '}
                  {formatCurrency(metrics.ai_performance.cost_per_request)}
                </span>
              </div>
            </div>

            {metrics.users.conversion_rate > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-900">
                    Conversion rate:{' '}
                    {formatPercentage(metrics.users.conversion_rate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Alerts
          </h3>
          <div className="space-y-3">
            {profitMargin < 20 && (
              <div className="flex items-start p-3 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Low Profit Margin
                  </p>
                  <p className="text-xs text-red-700">
                    Current margin is {profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {metrics.ai_performance.success_rate < 85 && (
              <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    AI Performance
                  </p>
                  <p className="text-xs text-yellow-700">
                    Success rate is{' '}
                    {metrics.ai_performance.success_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {metrics.ai_performance.avg_response_time > 3000 && (
              <div className="flex items-start p-3 bg-orange-50 rounded-lg">
                <ClockIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Slow Response Time
                  </p>
                  <p className="text-xs text-orange-700">
                    Avg: {metrics.ai_performance.avg_response_time}ms
                  </p>
                </div>
              </div>
            )}

            {metrics.users.churn_rate && metrics.users.churn_rate > 0.1 && (
              <div className="flex items-start p-3 bg-red-50 rounded-lg">
                <TrendingDownIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    High Churn Rate
                  </p>
                  <p className="text-xs text-red-700">
                    Churn: {formatPercentage(metrics.users.churn_rate)}
                  </p>
                </div>
              </div>
            )}

            {/* All good */}
            {profitMargin >= 20 &&
              metrics.ai_performance.success_rate >= 85 &&
              metrics.ai_performance.avg_response_time <= 3000 &&
              (!metrics.users.churn_rate ||
                metrics.users.churn_rate <= 0.1) && (
                <div className="flex items-start p-3 bg-green-50 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      All Systems Healthy
                    </p>
                    <p className="text-xs text-green-700">
                      No critical issues detected
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
