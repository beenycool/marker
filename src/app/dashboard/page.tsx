'use client';

import { useLocalDashboard } from '@/hooks/useLocalDashboard';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, BarChart3, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { analytics, recentSubmissions, isLoading, clearHistory } = useLocalDashboard();
  const { toast } = useToast();

  const handleClearHistory = () => {
    clearHistory();
    toast({
      title: 'Session History Cleared',
      description: 'All your local submission data has been removed.',
      variant: 'default',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Session Dashboard</h1>
            <p className="text-gray-300">Loading your local submission data...</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnalyticsCharts data={{ analytics }} />
            </div>
            <div>
              <RecentSubmissions submissions={[]} isLoading={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Your Session Dashboard
            </h1>
            <p className="text-gray-300">
              Track your progress in this session. All data is stored locally in your browser.
            </p>
          </div>
          
          {analytics.totalSubmissions > 0 && (
            <Button
              variant="outline"
              onClick={handleClearHistory}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Session History
            </Button>
          )}
        </div>

        {analytics.totalSubmissions === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Welcome to Your Dashboard
              </CardTitle>
              <CardDescription className="text-gray-300">
                Submit your first answer to see your analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No submissions yet
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Start submitting your GCSE answers to see personalized analytics, 
                  track your progress, and monitor your improvement over time.
                </p>
                <Button className="bg-blue-600 text-white">
                  Submit Your First Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnalyticsCharts data={{ analytics }} />
            </div>
            <div>
              <RecentSubmissions submissions={recentSubmissions} />
              
              <Card className="bg-blue-500/10 border-blue-500/20 mt-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">
                        Privacy Note
                      </p>
                      <p className="text-blue-200 text-xs">
                        All dashboard data is stored locally in your browser. 
                        No submission content is saved, only statistical data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}