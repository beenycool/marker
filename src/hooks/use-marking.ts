'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MarkingRequest, MarkingResponse } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Response type for the marking API endpoint
 */
interface MarkingApiResponse {
  success: boolean;
  submission: {
    id: string;
    createdAt: string;
  };
  feedback: MarkingResponse;
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

/**
 * Response type for the marking info API endpoint
 */
interface MarkingInfoResponse {
  usage: {
    used: number;
    limit: number;
    remaining: number;
    canUse: boolean;
  };
  providers: Array<{
    name: string;
    model: string;
    tier: 'free' | 'pro';
    available: boolean;
  }>;
  userTier: 'FREE' | 'PRO';
}

/**
 * Custom hook to fetch marking information including usage limits and available providers
 * Uses React Query for data fetching, caching, and automatic refetching
 *
 * @returns Query result with marking info data, loading, and error states
 */
export function useMarkingInfo() {
  return useQuery<MarkingInfoResponse>({
    queryKey: ['marking-info'],
    queryFn: async () => {
      logger.info('Fetching marking info from /api/mark');
      const response = await fetch('/api/mark');
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to fetch marking info:', {
          status: response.status,
          error: errorText,
        });
        throw new Error(
          `Failed to fetch marking info: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      logger.info('Successfully fetched marking info', { usage: data.usage });
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds to update usage
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes before garbage collection
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Custom hook to submit work for AI marking
 * Uses React Query mutation for handling the submission process
 *
 * @returns Mutation result with submission data, loading, and error states
 */
export function useMarkSubmission() {
  const queryClient = useQueryClient();

  return useMutation<MarkingApiResponse, Error, MarkingRequest>({
    mutationKey: ['mark-submission'],
    mutationFn: async request => {
      logger.info('Submitting work for marking', {
        questionLength: request.question.length,
        answerLength: request.answer.length,
        subject: request.subject,
        examBoard: request.examBoard,
      });
      const response = await fetch('/api/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to submit for marking:', {
          status: response.status,
          error: errorData.error || 'Unknown error',
          details: errorData.details,
        });
        throw new Error(
          errorData.error ||
            `Failed to submit for marking: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      logger.info('Successfully submitted for marking', {
        submissionId: data.submission.id,
      });
      return data;
    },
    onSuccess: data => {
      logger.info('Marking submission successful', {
        submissionId: data.submission.id,
      });
      // Invalidate and refetch relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ['marking-info'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Optionally, set success data in cache for immediate access
      queryClient.setQueryData(['submission', data.submission.id], data);
    },
    onError: error => {
      logger.error('Error in marking submission:', error);
    },
    onSettled: () => {
      logger.info('Marking submission process completed');
    },
    retry: 2, // Retry failed mutations up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
