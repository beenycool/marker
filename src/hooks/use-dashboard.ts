'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardApiResponse {
  recentSubmissions: Array<{
    id: string;
    question: string;
    subject: string | null;
    examBoard: string | null;
    createdAt: string;
    score: number;
    grade: string;
  }>;
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
  usage: {
    used: number;
    limit: number;
    remaining: number;
    canUse: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useDashboard(page: number = 1, limit: number = 10) {
  return useQuery<DashboardApiResponse>({
    queryKey: ['dashboard', page, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error.message.includes('4')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
