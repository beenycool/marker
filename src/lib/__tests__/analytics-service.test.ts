import { AnalyticsService } from '../analytics';
import {
  createMockUser,
  createMockSupabaseClient,
  mockConsole,
} from './test-utils';

jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { getSupabase } from '@/lib/supabase';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockUser: ReturnType<typeof createMockUser>;

  mockConsole();

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = createMockSupabaseClient();
    mockUser = createMockUser();

    mockGetSupabase.mockResolvedValue(mockSupabase as any);
    analyticsService = new AnalyticsService();
  });

  describe('trackSubmission', () => {
    it('should track a submission successfully', async () => {
      const submissionData = {
        userId: mockUser.id,
        subject: 'Mathematics',
        score: 85,
        grade: '7',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'analytics') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        if (table === 'usage_tracking') {
          return {
            upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {};
      });

      await expect(
        analyticsService.trackSubmission(submissionData)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics');
      expect(mockSupabase.from).toHaveBeenCalledWith('usage_tracking');
    });

    it('should handle database errors gracefully', async () => {
      const submissionData = {
        userId: mockUser.id,
        subject: 'Mathematics',
        score: 85,
        grade: '7',
      };

      mockSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }));

      await expect(
        analyticsService.trackSubmission(submissionData)
      ).rejects.toThrow('Failed to track submission');
    });

    it('should validate input data', async () => {
      const invalidData = {
        userId: '', // Invalid empty userId
        subject: 'Mathematics',
        score: 85,
        grade: '7',
      };

      await expect(
        analyticsService.trackSubmission(invalidData)
      ).rejects.toThrow('Invalid submission data');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalSubmissions: 10,
        averageScore: 82.5,
        subjectBreakdown: {
          Mathematics: 6,
          English: 4,
        },
        recentActivity: [
          { date: '2024-01-01', count: 2 },
          { date: '2024-01-02', count: 3 },
        ],
      };

      // Mock multiple database calls
      mockSupabase.from.mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
        };

        if (table === 'submissions') {
          return {
            ...baseQuery,
            // Mock different calls with different returns
            select: jest.fn().mockImplementation(fields => {
              if (fields === 'count') {
                return {
                  ...baseQuery,
                  single: jest.fn().mockResolvedValue({
                    data: { count: mockStats.totalSubmissions },
                    error: null,
                  }),
                };
              }
              if (fields === 'score') {
                return {
                  ...baseQuery,
                  then: jest.fn().mockResolvedValue({
                    data: [{ score: 80 }, { score: 85 }],
                    error: null,
                  }),
                };
              }
              return baseQuery;
            }),
          };
        }

        if (table === 'analytics') {
          return {
            ...baseQuery,
            then: jest.fn().mockResolvedValue({
              data: mockStats.recentActivity,
              error: null,
            }),
          };
        }

        return baseQuery;
      });

      const stats = await analyticsService.getUserStats(mockUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalSubmissions).toBeGreaterThanOrEqual(0);
      expect(mockSupabase.from).toHaveBeenCalledWith('submissions');
    });

    it('should handle missing user data', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' },
        }),
      }));

      const stats = await analyticsService.getUserStats('nonexistent-user');

      expect(stats.totalSubmissions).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });

  describe('getSubjectInsights', () => {
    it('should return subject-specific insights', async () => {
      const subject = 'Mathematics';
      const mockInsights = [
        { topic: 'Algebra', averageScore: 78, totalAttempts: 15 },
        { topic: 'Geometry', averageScore: 85, totalAttempts: 12 },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue({
          data: mockInsights,
          error: null,
        }),
      }));

      const insights = await analyticsService.getSubjectInsights(
        mockUser.id,
        subject
      );

      expect(insights).toEqual(mockInsights);
      expect(mockSupabase.from).toHaveBeenCalledWith('submissions');
    });

    it('should validate subject parameter', async () => {
      await expect(
        analyticsService.getSubjectInsights(mockUser.id, '')
      ).rejects.toThrow('Subject is required');
    });
  });

  describe('getPerformanceTrends', () => {
    it('should calculate performance trends over time', async () => {
      const mockTrendData = [
        { date: '2024-01-01', averageScore: 75 },
        { date: '2024-01-02', averageScore: 80 },
        { date: '2024-01-03', averageScore: 85 },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTrendData,
          error: null,
        }),
      }));

      const trends = await analyticsService.getPerformanceTrends(
        mockUser.id,
        7
      );

      expect(trends).toEqual(mockTrendData);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics');
    });

    it('should use default time period when not specified', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      await analyticsService.getPerformanceTrends(mockUser.id);

      // Should default to 30 days
      expect(mockSupabase.from().eq).toHaveBeenCalled();
      expect(mockSupabase.from().gte).toHaveBeenCalled();
    });
  });
});
