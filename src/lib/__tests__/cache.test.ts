import { cacheService } from '../cache';
import { MarkingRequest, MarkingResponse } from '@/types';

// Mock Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    info: jest.fn(),
  })),
}));

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mockedhash'),
  }),
}));

describe('CacheService', () => {
  let mockRequest: MarkingRequest;
  let mockResponse: MarkingResponse;

  beforeEach(() => {
    mockRequest = {
      answer: 'Test answer',
      question: 'Test question',
      subject: 'Mathematics',
      examBoard: 'AQA',
      markScheme: 'Test mark scheme',
    };

    mockResponse = {
      score: 85,
      aiResponse: 'Great work!',
      grade: '8',
      aosMet: ['AO1'],
      improvementSuggestions: ['Add more examples'],
      modelUsed: 'test-model',
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached result when available', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.get.mockResolvedValue(mockResponse);

      const result = await cacheService.get(mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should return null when no cache found', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await cacheService.get(mockRequest);
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get(mockRequest);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache response successfully', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.set.mockResolvedValue('OK');

      await cacheService.set(mockRequest, mockResponse);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'marking:mockedhash',
        JSON.stringify(mockResponse),
        { ex: 3600 }
      );
    });

    it('should handle cache set errors gracefully', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.set.mockRejectedValue(new Error('Cache error'));

      // Should not throw
      await expect(
        cacheService.set(mockRequest, mockResponse)
      ).resolves.not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate cache keys matching pattern', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.keys.mockResolvedValue([
        'marking:key1',
        'marking:key2',
      ]);
      mockRedisInstance.del.mockResolvedValue(2);

      await cacheService.invalidatePattern('marking:*');

      expect(mockRedisInstance.keys).toHaveBeenCalledWith('marking:*');
      expect(mockRedisInstance.del).toHaveBeenCalledWith(
        'marking:key1',
        'marking:key2'
      );
    });

    it('should handle no matching keys', async () => {
      const mockRedis = require('@upstash/redis').Redis;
      const mockRedisInstance = new mockRedis();
      mockRedisInstance.keys.mockResolvedValue([]);

      await cacheService.invalidatePattern('marking:*');

      expect(mockRedisInstance.keys).toHaveBeenCalledWith('marking:*');
      expect(mockRedisInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('memory cache fallback', () => {
    it('should use memory cache when Redis not available', async () => {
      // Create a new cache service instance without Redis
      const cacheWithoutRedis = new (require('../cache').CacheService)();

      // Mock the constructor to not initialize Redis
      Object.defineProperty(cacheWithoutRedis, 'redis', {
        value: null,
        writable: false,
      });

      await cacheWithoutRedis.set(mockRequest, mockResponse);
      const result = await cacheWithoutRedis.get(mockRequest);

      expect(result).toEqual(mockResponse);
    });

    it('should clean up expired entries from memory cache', async () => {
      const cacheWithoutRedis = new (require('../cache').CacheService)();

      // Mock the constructor to not initialize Redis
      Object.defineProperty(cacheWithoutRedis, 'redis', {
        value: null,
        writable: false,
      });

      // Add enough entries to trigger cleanup
      for (let i = 0; i < 105; i++) {
        await cacheWithoutRedis.set(
          { ...mockRequest, answer: `answer${i}` },
          mockResponse
        );
      }

      // Memory cache should have triggered cleanup
      const stats = await cacheWithoutRedis.getCacheStats();
      expect(stats.size).toBeLessThan(105);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheService.getCacheStats();

      expect(stats).toEqual({
        hits: expect.any(Number),
        misses: expect.any(Number),
        size: expect.any(Number),
      });
    });
  });
});
