'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUsageHistory } from '@/hooks/use-usage-history';
import {
  Calendar,
  CreditCard,
  Download,
  Loader2,
  Settings,
  Shield,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface SubscriptionManagerProps {
  subscription: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    stripeCustomerId?: string;
    stripePriceId?: string;
  } | null;
  usage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export function SubscriptionManager({
  subscription,
  usage,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    data: usageHistory,
    loading: historyLoading,
    error: historyError,
  } = useUsageHistory(30);

  const handleManageSubscription = async () => {
    if (!subscription?.stripeCustomerId) {
      toast({
        title: 'No Subscription',
        description: 'You need an active subscription to manage billing',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      window.open(data.url, '_blank');
    } catch (error) {
      toast({
        title: 'Portal Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PAST_DUE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PRO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'FREE':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your subscription details and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Plan</span>
            <Badge className={getTierColor(subscription?.tier || 'FREE')}>
              {subscription?.tier || 'FREE'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Status</span>
            <Badge className={getStatusColor(subscription?.status || 'FREE')}>
              {subscription?.status || 'FREE'}
            </Badge>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Daily Usage</span>
              <span className="text-white font-medium">
                {usage.used} / {usage.limit}
              </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usage.percentage, 100)}%` }}
              />
            </div>

            <p className="text-sm text-gray-400">
              {usage.percentage.toFixed(1)}% of daily limit used
            </p>
          </div>

          {subscription && subscription.status === 'ACTIVE' && (
            <>
              <Separator className="bg-white/10" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Billing Period Start</p>
                  <p className="text-white font-medium">
                    {format(new Date(subscription.currentPeriodStart), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Next Billing Date</p>
                  <p className="text-white font-medium">
                    {format(new Date(subscription.currentPeriodEnd), 'PPP')}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing Management */}
      {subscription && subscription.stripeCustomerId && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Management
            </CardTitle>
            <CardDescription className="text-gray-300">
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/20 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage History */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Usage History
          </CardTitle>
          <CardDescription className="text-gray-300">
            Track your AI marking usage over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : historyError ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">Error loading usage history</p>
              <p className="text-sm text-gray-500">{historyError}</p>
            </div>
          ) : usageHistory && usageHistory.dailyUsage.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {usageHistory.stats.totalApiCalls}
                  </p>
                  <p className="text-sm text-gray-400">Total API Calls</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {usageHistory.stats.averageDailyUsage}
                  </p>
                  <p className="text-sm text-gray-400">Daily Average</p>
                </div>
              </div>

              {usageHistory.stats.weeklyChange !== 0 && (
                <div className="flex items-center justify-center gap-2">
                  {usageHistory.stats.weeklyChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm ${usageHistory.stats.weeklyChange > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {Math.abs(usageHistory.stats.weeklyChange)}% vs last week
                  </span>
                </div>
              )}

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageHistory.dailyUsage.slice(0, 7).reverse()}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={date =>
                        new Date(date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      }
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: any) => [`${value} calls`, 'Usage']}
                    />
                    <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Button
                onClick={() => {
                  const csv = [
                    ['Date', 'API Calls', 'Tier'],
                    ...usageHistory.dailyUsage.map(day => [
                      day.date,
                      day.usage,
                      day.tier,
                    ]),
                  ]
                    .map(row => row.join(','))
                    .join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `usage-history-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No usage history yet</p>
              <p className="text-sm text-gray-500">
                Start using AI marking to see your usage data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
