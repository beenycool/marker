'use client';

import { useState, useEffect } from 'react';

interface LocalSubmission {
  id: string;
  score: number;
  grade: string;
  subject: string | null;
  createdAt: string;
}

interface DashboardAnalytics {
  totalSubmissions: number;
  averageScore: number;
  subjectBreakdown: Record<string, number>;
  progressOverTime: Array<{
    date: string;
    score: number;
    count: number;
  }>;
  gradeDistribution: Record<string, number>;
}

export function useLocalDashboard() {
  const [history, setHistory] = useState<LocalSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const storedHistory = localStorage.getItem('aimarker_history');
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          setHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Failed to load local history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();

    // Listen for localStorage updates from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aimarker_history' && e.newValue) {
        try {
          const newHistory = JSON.parse(e.newValue);
          setHistory(newHistory);
        } catch (error) {
          console.error('Failed to parse updated history:', error);
        }
      }
    };

    // Listen for custom events from same tab
    const handleCustomUpdate = (e: CustomEvent) => {
      setHistory(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localHistoryUpdate', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localHistoryUpdate', handleCustomUpdate as EventListener);
    };
  }, []);

  // Calculate analytics from local data
  const analytics: DashboardAnalytics = {
    totalSubmissions: history.length,
    averageScore: history.length > 0 
      ? history.reduce((sum, item) => sum + item.score, 0) / history.length 
      : 0,
    subjectBreakdown: history.reduce((acc, item) => {
      const subject = item.subject || 'Unknown';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    progressOverTime: calculateProgressOverTime(history),
    gradeDistribution: history.reduce((acc, item) => {
      acc[item.grade] = (acc[item.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const clearHistory = () => {
    localStorage.removeItem('aimarker_history');
    setHistory([]);
    window.dispatchEvent(new CustomEvent('localHistoryUpdate', { 
      detail: [] 
    }));
  };

  // Get recent submissions for display
  const recentSubmissions = history
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(submission => ({
      ...submission,
      question: `Submission ${submission.id}`, // We don't store the full question locally
    }));

  return {
    history,
    analytics,
    recentSubmissions,
    isLoading,
    clearHistory
  };
}

function calculateProgressOverTime(history: LocalSubmission[]): Array<{
  date: string;
  score: number;
  count: number;
}> {
  if (history.length === 0) return [];

  // Group submissions by date
  const dailyData = history.reduce((acc, item) => {
    const date = new Date(item.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { scores: [], count: 0 };
    }
    acc[date].scores.push(item.score);
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { scores: number[]; count: number }>);

  // Convert to array format expected by charts
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      count: data.count
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Last 30 days
}