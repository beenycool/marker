import { useState, useEffect, useCallback } from 'react';

interface UsageDay {
  date: string;
  usage: number;
  tier: string;
}

interface UsageStats {
  totalApiCalls: number;
  averageDailyUsage: number;
  weeklyChange: number;
  daysTracked: number;
}

interface UsageHistoryData {
  dailyUsage: UsageDay[];
  stats: UsageStats;
}

interface UseUsageHistoryResult {
  data: UsageHistoryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUsageHistory(days: number = 30): UseUsageHistoryResult {
  const [data, setData] = useState<UsageHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/usage/history?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to fetch usage history');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchUsageHistory();
  }, [days, fetchUsageHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchUsageHistory,
  };
}
