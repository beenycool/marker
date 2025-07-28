import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '../feedback/route';
import {
  createMockUser,
  createMockSupabaseClient,
  createMockRequest,
  expectAPIResponse,
  mockConsole,
} from '@/lib/__tests__/test-utils';

// Mock dependencies with proper typing
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn(),
}));

jest.mock('@/lib/auth/server', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { getSupabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/server';
import { rateLimit } from '@/lib/rate-limit';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;

describe('/api/feedback', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockUser: ReturnType<typeof createMockUser>;

  mockConsole();

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = createMockSupabaseClient();
    mockUser = createMockUser();

    mockGetSupabase.mockResolvedValue(mockSupabase as any);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockRateLimit.mockResolvedValue(null);
  });

  describe('POST /api/feedback', () => {
    it('should create feedback successfully with valid data', async () => {
      const feedbackData = {
        submissionId: 'sub_123',
        rating: 5,
        comment: 'Great feedback!',
      };

      const mockSubmission = {
        id: 'sub_123',
        user_id: mockUser.id,
        question: 'Test question',
        answer: 'Test answer',
      };

      const mockFeedbackResult = {
        id: 'feedback_123',
        submission_id: 'sub_123',
        user_id: mockUser.id,
        rating: 5,
        comment: 'Great feedback!',
        created_at: new Date().toISOString(),
      };

      // Mock database operations
      mockSupabase.from.mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };

        if (table === 'submissions') {
          baseQuery.single.mockResolvedValue({
            data: mockSubmission,
            error: null,
          });
        } else if (table === 'feedback') {
          baseQuery.single.mockResolvedValue({
            data: mockFeedbackResult,
            error: null,
          });
        }

        return baseQuery;
      });

      const request = createMockRequest({
        method: 'POST',
        body: feedbackData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabase.from).toHaveBeenCalledWith('submissions');
      expect(mockSupabase.from).toHaveBeenCalledWith('feedback');
    });

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        body: { submissionId: 'sub_123', rating: 5 },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid submission ID', async () => {
      const feedbackData = {
        submissionId: 'invalid_sub',
        rating: 5,
        comment: 'Test comment',
      };

      // Mock submission not found
      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' },
        }),
      }));

      const request = createMockRequest({
        method: 'POST',
        body: feedbackData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 403 when user tries to rate others submissions', async () => {
      const feedbackData = {
        submissionId: 'sub_123',
        rating: 5,
        comment: 'Test comment',
      };

      const otherUserSubmission = {
        id: 'sub_123',
        user_id: 'other-user-id', // Different from mockUser.id
        question: 'Test question',
        answer: 'Test answer',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: otherUserSubmission,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };
      });

      const request = createMockRequest({
        method: 'POST',
        body: feedbackData,
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should handle database errors gracefully', async () => {
      const feedbackData = {
        submissionId: 'sub_123',
        rating: 5,
        comment: 'Test comment',
      };

      // Mock database error
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      }));

      const request = createMockRequest({
        method: 'POST',
        body: feedbackData,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/feedback', () => {
    it('should return feedback list for authenticated user', async () => {
      const mockFeedbackList = [
        {
          id: 'feedback_1',
          submission_id: 'sub_1',
          rating: 5,
          comment: 'Great!',
          created_at: new Date().toISOString(),
        },
        {
          id: 'feedback_2',
          submission_id: 'sub_2',
          rating: 4,
          comment: 'Good work',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockFeedbackList,
          error: null,
        }),
      }));

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('feedback');
    });

    it('should return 401 for unauthenticated GET requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
