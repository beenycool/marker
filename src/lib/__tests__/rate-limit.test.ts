import { rateLimit, rateLimiters, rateLimitByUser } from '../rate-limit';
import { NextRequest } from 'next/server';

// Mock Upstash
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    keys: jest.fn(),
  })),
}));

describe('Rate Limiting', () => {
  let mockRequest: NextRequest;
  let mockRateLimiter: any;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        get: jest.fn().mockReturnValue('127.0.0.1'),
      },
    } as any;

    mockRateLimiter = {
      limit: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('rateLimit', () => {
    it('should allow request when under limit', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: 9,
      });

      const result = await rateLimit(mockRequest, mockRateLimiter);

      expect(result).toBeNull();
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should return 429 response when rate limit exceeded', async () => {
      const resetTime = Date.now() + 60000;
      mockRateLimiter.limit.mockResolvedValue({
        success: false,
        limit: 10,
        reset: resetTime,
        remaining: 0,
      });

      const result = await rateLimit(mockRequest, mockRateLimiter);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);

      const responseBody = await result?.json();
      expect(responseBody).toEqual({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: expect.any(Number),
      });
    });

    it('should use custom identifier when provided', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: 9,
      });

      await rateLimit(mockRequest, mockRateLimiter, 'custom-id');

      expect(mockRateLimiter.limit).toHaveBeenCalledWith('custom-id');
    });

    it('should handle rate limiter errors gracefully', async () => {
      mockRateLimiter.limit.mockRejectedValue(new Error('Rate limiter error'));

      const result = await rateLimit(mockRequest, mockRateLimiter);

      expect(result).toBeNull(); // Should allow request on error
    });

    it('should use x-forwarded-for header when available', async () => {
      mockRequest.headers.get = jest.fn().mockImplementation(header => {
        if (header === 'x-forwarded-for') return '192.168.1.1';
        return null;
      });

      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: 9,
      });

      await rateLimit(mockRequest, mockRateLimiter);

      expect(mockRateLimiter.limit).toHaveBeenCalledWith('192.168.1.1');
    });
  });

  describe('rateLimitByUser', () => {
    it('should rate limit by user ID', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: 9,
      });

      const result = await rateLimitByUser('user123', mockRateLimiter);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('user123');
    });

    it('should handle user rate limiting errors', async () => {
      mockRateLimiter.limit.mockRejectedValue(
        new Error('User rate limit error')
      );

      const result = await rateLimitByUser('user123', mockRateLimiter);

      expect(result.success).toBe(true); // Should default to allowing
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(0);
    });
  });

  describe('rate limiter configurations', () => {
    it('should have different limits for different endpoints', () => {
      expect(rateLimiters.api).toBeDefined();
      expect(rateLimiters.marking).toBeDefined();
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.upload).toBeDefined();
      expect(rateLimiters.markingPro).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing IP address', async () => {
      (mockRequest as any).ip = undefined;
      mockRequest.headers.get = jest.fn().mockReturnValue(null);

      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: 9,
      });

      await rateLimit(mockRequest, mockRateLimiter);

      expect(mockRateLimiter.limit).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should handle malformed reset time', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: false,
        limit: 10,
        reset: 'invalid-time',
        remaining: 0,
      });

      const result = await rateLimit(mockRequest, mockRateLimiter);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    it('should handle very large remaining values', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 10,
        reset: Date.now() + 60000,
        remaining: Number.MAX_SAFE_INTEGER,
      });

      const result = await rateLimit(mockRequest, mockRateLimiter);

      expect(result).toBeNull();
    });
  });
});
