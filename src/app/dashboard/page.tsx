import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  BarChart3,
  FileText,
  Camera,
  Users,
  Zap,
  Loader2,
  Target,
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { UsageDisplay } from '@/components/marking/usage-display';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import Link from 'next/link';

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard', {
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

function DashboardClient() {
  const { data: dashboardData, isLoading, error } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Error loading dashboard
          </h2>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Please try refreshing the page'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div id="dashboard-header">
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-300">
                Track your GCSE progress and get insights into your performance.
              </p>
            </div>
            <div className="text-right">
              <Badge
                className={`mb-2 ${
                  dashboardData?.usage.limit === 200
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {dashboardData?.usage.limit === 200 ? 'PRO' : 'FREE'} Plan
              </Badge>
              {dashboardData?.usage.limit === 20 && (
                <div className="text-sm text-gray-400">
                  <Link
                    href="/upgrade"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Display */}
        <div className="mb-8">
          <UsageDisplay usage={dashboardData?.usage} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-sm">
                    Submit Work
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    Get instant AI feedback
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm h-8"
              >
                <Link href="/mark">Start Marking</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm border-green-500/20 hover:border-green-400/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-sm">
                    Past Papers
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    Practice with real papers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                variant="outline"
                className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm h-8"
              >
                <Link href="/past-papers">Browse Papers</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 group-hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-sm">
                    Upload Photo
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    OCR handwritten work
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                variant="outline"
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm h-8"
                disabled={dashboardData?.usage.limit === 20}
              >
                <Link href="/mark?tab=upload">
                  {dashboardData?.usage.limit === 20
                    ? 'Pro Only'
                    : 'Upload Image'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-sm">
                    Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    View detailed insights
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                variant="outline"
                className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm h-8"
              >
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium">
                Today's Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {dashboardData?.usage.used || 0} /{' '}
                {dashboardData?.usage.limit || 20}
              </div>
              <p className="text-gray-400 text-sm">
                {dashboardData?.usage.limit === 200 ? 'Pro' : 'Free'} tier limit
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {dashboardData?.analytics.totalSubmissions || 0}
              </div>
              <p className="text-gray-400 text-sm">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {dashboardData?.analytics.averageScore
                  ? dashboardData.analytics.averageScore.toFixed(1)
                  : '-'}
              </div>
              <p className="text-gray-400 text-sm">
                {dashboardData?.analytics.totalSubmissions
                  ? 'Latest scores'
                  : 'No data yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations */}
        {dashboardData?.analytics &&
          dashboardData.analytics.totalSubmissions > 0 && (
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 backdrop-blur-sm border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-400" />
                    Personalized Recommendations
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Based on your recent performance and submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.analytics.averageScore < 60 && (
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400 font-medium text-sm">
                            Focus on Fundamentals
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Consider reviewing basic concepts in your weakest
                          subjects to build a stronger foundation.
                        </p>
                      </div>
                    )}

                    {dashboardData.usage.used < 5 && (
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400 font-medium text-sm">
                            Practice More
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          You have{' '}
                          {dashboardData.usage.limit - dashboardData.usage.used}{' '}
                          submissions left today. Keep practicing!
                        </p>
                      </div>
                    )}

                    {Object.keys(dashboardData.analytics.subjectBreakdown)
                      .length === 1 && (
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-400 font-medium text-sm">
                            Try New Subjects
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Explore other GCSE subjects to broaden your knowledge
                          and skills.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Submissions */}
          <div className="lg:col-span-1">
            <RecentSubmissions
              submissions={dashboardData?.recentSubmissions || []}
            />
          </div>

          {/* Analytics */}
          <div className="lg:col-span-2">
            {dashboardData?.analytics &&
            dashboardData.analytics.totalSubmissions > 0 ? (
              <AnalyticsCharts data={dashboardData} />
            ) : (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Your performance analytics will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      No data yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Submit your first answer to see detailed analytics and
                      track your progress
                    </p>
                    <Button
                      asChild
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Link href="/mark">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user has completed onboarding
  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
