'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Target, BookOpen, Award } from 'lucide-react';

interface AnalyticsChartsProps {
  data: {
    analytics: {
      totalSubmissions: number;
      averageScore: number;
      subjectBreakdown: Record<string, number>;
      progressOverTime: Array<{
        date: string;
        score: number;
        count: number;
      }>;
      gradeDistribution: Record<string, number>;
    };
  };
}

const gradeColors = {
  '9': '#22c55e',
  '8': '#16a34a',
  '7': '#3b82f6',
  '6': '#0ea5e9',
  '5': '#eab308',
  '4': '#f59e42',
  '3': '#f97316',
  '2': '#ef4444',
  '1': '#dc2626',
  U: '#6b7280',
};

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time Skeleton */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm border-blue-500/20 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Subject Breakdown Skeleton */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Grade Distribution Skeleton */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Performance Summary Skeleton */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <Skeleton className="h-10 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/4" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { analytics } = data;

  // Prepare chart data
  const subjectData = Object.entries(analytics.subjectBreakdown).map(
    ([subject, count]) => ({
      subject,
      count,
    })
  );

  const gradeData = Object.entries(analytics.gradeDistribution).map(
    ([grade, count]) => ({
      grade,
      count,
      color: gradeColors[grade as keyof typeof gradeColors] || '#6b7280',
    })
  );

  // Format progress data for chart
  const progressData = analytics.progressOverTime.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Progress Over Time */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm border-blue-500/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Trending Up Icon</span>
              Progress Over Time
            </div>
            <Badge
              variant="outline"
              className="border-blue-500/30 text-blue-400"
              aria-label="Time period: Last 30 days"
            >
              Last 30 days
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Track your performance improvement and consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}%`,
                    name === 'score' ? 'Average Score' : name,
                  ]}
                  labelFormatter={label => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="url(#progressGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#60a5fa' }}
                />
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Book Open Icon</span>
            Subject Breakdown
          </CardTitle>
          <CardDescription className="text-gray-300">
            Distribution of your submissions by subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="subject"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Award Icon</span>
            Grade Distribution
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your achieved grades breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percent }) =>
                    `${grade} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Target Icon</span>
            Performance Summary
          </CardTitle>
          <CardDescription className="text-gray-300">
            Key metrics and insights from your submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {analytics.totalSubmissions}
              </div>
              <div className="text-gray-400">Total Submissions</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {analytics.averageScore.toFixed(1)}
              </div>
              <div className="text-gray-400">Average Score</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {Object.keys(analytics.subjectBreakdown).length}
              </div>
              <div className="text-gray-400">Subjects Studied</div>
            </div>
          </div>

          {/* Grade Progress */}
          <div className="mt-6 space-y-4">
            <h4 className="text-white font-medium">Grade Progress</h4>
            {Object.entries(analytics.gradeDistribution)
              .sort(([a], [b]) => {
                const gradeOrder = [
                  '9',
                  '8',
                  '7',
                  '6',
                  '5',
                  '4',
                  '3',
                  '2',
                  '1',
                  'U',
                ];
                return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
              })
              .map(([grade, count]) => {
                const percentage = (count / analytics.totalSubmissions) * 100;
                return (
                  <div key={grade} className="flex items-center gap-4">
                    <div className="w-12 flex justify-center">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor:
                            gradeColors[grade as keyof typeof gradeColors] +
                            '20',
                          color: gradeColors[grade as keyof typeof gradeColors],
                          borderColor:
                            gradeColors[grade as keyof typeof gradeColors] +
                            '40',
                        }}
                      >
                        {grade}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={percentage}
                        className="h-2"
                        style={{
                          backgroundColor:
                            gradeColors[grade as keyof typeof gradeColors] +
                            '20',
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm text-gray-400">
                      {count} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
