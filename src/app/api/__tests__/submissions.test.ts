import { NextRequest } from 'next/server';
import { GET } from '../submissions/route';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    submission: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    api: {},
  },
  rateLimit: jest.fn().mockResolvedValue(null),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockDb = db as jest.Mocked<typeof db>;

describe('/api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return paginated submissions', async () => {
      const mockUser = { id: 'user_123' };
      const mockSubmissions = [
        {
          id: 'sub_123',
          question: 'Test question',
          answer: 'Test answer',
          subject: 'Math',
          feedback: [
            {
              id: 'feedback_123',
              score: 85,
              grade: '8',
            },
          ],
        },
      ];

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue(mockSubmissions as any);
      mockDb.submission.count.mockResolvedValue(1);

      const req = new NextRequest(
        'https://example.com/api/submissions?page=1&limit=10'
      );

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.submissions).toHaveLength(1);
      expect(responseData.data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should filter by subject', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue([]);
      mockDb.submission.count.mockResolvedValue(0);

      const req = new NextRequest(
        'https://example.com/api/submissions?subject=Math'
      );

      await GET(req as any);

      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          subject: 'Math',
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should filter by exam board', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue([]);
      mockDb.submission.count.mockResolvedValue(0);

      const req = new NextRequest(
        'https://example.com/api/submissions?examBoard=AQA'
      );

      await GET(req as any);

      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          examBoard: 'AQA',
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should filter by has grade', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue([]);
      mockDb.submission.count.mockResolvedValue(0);

      const req = new NextRequest(
        'https://example.com/api/submissions?hasGrade=true'
      );

      await GET(req as any);

      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          feedback: {
            some: {
              grade: {
                not: null,
              },
            },
          },
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should search in question and answer', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue([]);
      mockDb.submission.count.mockResolvedValue(0);

      const req = new NextRequest(
        'https://example.com/api/submissions?search=algebra'
      );

      await GET(req as any);

      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          OR: [
            {
              question: {
                contains: 'algebra',
                mode: 'insensitive',
              },
            },
            {
              answer: {
                contains: 'algebra',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
    });

    it('should respect pagination limits', async () => {
      const mockUser = { id: 'user_123' };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockDb.submission.findMany.mockResolvedValue([]);
      mockDb.submission.count.mockResolvedValue(0);

      const req = new NextRequest(
        'https://example.com/api/submissions?page=2&limit=150'
      );

      await GET(req as any);

      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 100, // Max limit should be 100
        skip: 100, // (2-1) * 100
      });
    });
  });
});
