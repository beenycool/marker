import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireAuth, requirePro } from '../auth-middleware';
import { getCurrentUser } from '../auth';
import { Tier } from '../../types';

// Mock dependencies
jest.mock('../auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../rate-limit', () => ({
  rateLimiters: {
    api: {},
  },
  rateLimit: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

describe('Auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should allow request when authentication not required', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new NextResponse());
      const middleware = withAuth(mockHandler, { requireAuth: false });

      const req = new NextRequest('https://example.com/api/test');

      await middleware(req);

      expect(mockHandler).toHaveBeenCalledWith(req);
    });

    it('should deny request when authentication required but no user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const mockHandler = jest.fn();
      const middleware = withAuth(mockHandler, { requireAuth: true });

      const req = new NextRequest('https://example.com/api/test');

      const response = await middleware(req);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow request when authenticated', async () => {
      const mockUser = {
        id: 'user_123',
        subscriptionTier: 'FREE',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);

      const mockHandler = jest.fn().mockResolvedValue(new NextResponse());
      const middleware = withAuth(mockHandler, { requireAuth: true });

      const req = new NextRequest('https://example.com/api/test');

      await middleware(req);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });
  });

  describe('requirePro', () => {
    it('should deny request when user is not pro', async () => {
      const mockUser = {
        id: 'user_123',
        subscriptionTier: 'FREE',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);

      const mockHandler = jest.fn();
      const middleware = requirePro(mockHandler);

      const req = new NextRequest('https://example.com/api/test');

      const response = await middleware(req);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow request when user is pro', async () => {
      const mockUser = {
        id: 'user_123',
        subscriptionTier: 'PRO',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);

      const mockHandler = jest.fn().mockResolvedValue(new NextResponse());
      const middleware = requirePro(mockHandler);

      const req = new NextRequest('https://example.com/api/test');

      await middleware(req);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });
  });
});
