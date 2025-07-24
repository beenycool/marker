import { NextRequest } from 'next/server';
import { POST, GET } from '../feedback/route';
import { getSupabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  getSupabase: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    api: {},
  },
  rateLimit: jest.fn().mockResolvedValue(null),
}));

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

describe('/api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create feedback successfully', async () => {
      const mockSubmission = { id: 'sub_123' };
      const mockFeedback = {
        id: 'feedback_123',
        submission_id: 'sub_123',
        user_id: 'user_123',
        rating: 5,
        comment: 'Great feedback!',
      };

      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'user_123' } } },
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockSubmission, error: null }),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockFeedback, error: null }),
            }),
          }),
        }),
      };

      mockGetSupabase.mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: 'sub_123',
          rating: 5,
          comment: 'Great feedback!',
        }),
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockFeedback);
      expect(mockDb.userFeedback.create).toHaveBeenCalledWith({
        data: {
          submissionId: 'sub_123',
          userId: 'user_123',
          rating: 5,
          comment: 'Great feedback!',
          helpfulness: undefined,
          accuracy: undefined,
        },
      });
    });

    it('should return 404 if submission not found', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findFirst.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: 'sub_123',
          rating: 5,
        }),
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Not found');
    });

    it('should validate input data', async () => {
      const mockUser = { id: 'user_123' };
      mockGetCurrentUser.mockResolvedValue(mockUser as any);

      const req = new NextRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: 'invalid-uuid',
          rating: 10, // Invalid rating (should be 1-5)
        }),
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
    });
  });

  describe('GET', () => {
    it('should return user feedback', async () => {
      const mockUser = { id: 'user_123' };
      const mockFeedback = [
        {
          id: 'feedback_123',
          rating: 5,
          comment: 'Great!',
          submission: {
            id: 'sub_123',
            question: 'Test question',
          },
        },
      ];

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.userFeedback.findMany.mockResolvedValue(mockFeedback as any);

      const req = new NextRequest('https://example.com/api/feedback');

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockFeedback);
    });

    it('should filter by submission ID', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.userFeedback.findMany.mockResolvedValue([]);

      const req = new NextRequest(
        'https://example.com/api/feedback?submissionId=sub_123'
      );

      await GET(req as any);

      expect(mockDb.userFeedback.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          submissionId: 'sub_123',
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 50,
        skip: 0,
      });
    });
  });
});
