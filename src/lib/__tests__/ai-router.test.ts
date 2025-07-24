import { AIRouter } from '../ai/router';
import { Tier } from '../../types';
import { MarkingRequest } from '@/types';
import { cacheService } from '../cache';

// Mock the cache service
jest.mock('../cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock the providers
jest.mock('../ai/providers', () => ({
  BaseAIProvider: jest.fn(),
}));

jest.mock('../ai/deepseek-free', () => ({
  DeepSeekFreeProvider: jest.fn().mockImplementation(() => ({
    name: 'DeepSeek Free',
    available: true,
    tier: 'free',
    mark: jest.fn(),
  })),
}));

jest.mock('../ai/openrouter', () => ({
  OpenRouterProvider: jest.fn().mockImplementation(() => ({
    name: 'OpenRouter',
    available: true,
    tier: 'pro',
    mark: jest.fn(),
  })),
}));

jest.mock('../ai/qwen-pro', () => ({
  QwenProProvider: jest.fn().mockImplementation(() => ({
    name: 'Qwen Pro',
    available: true,
    tier: 'free',
    mark: jest.fn(),
  })),
}));

jest.mock('../ai/kimi', () => ({
  KimiProvider: jest.fn().mockImplementation(() => ({
    name: 'Kimi',
    available: true,
    tier: 'free',
    mark: jest.fn(),
  })),
}));

describe('AIRouter', () => {
  let router: AIRouter;
  let mockRequest: MarkingRequest;

  beforeEach(() => {
    router = new AIRouter();
    mockRequest = {
      answer: 'Test answer',
      question: 'Test question',
      subject: 'Mathematics',
      examBoard: 'AQA',
      markScheme: 'Test mark scheme',
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('mark', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        score: 85,
        feedback: 'Cached feedback',
        grade: '8',
        maxScore: 100,
        strengths: ['Good understanding'],
        improvements: ['Could be more detailed'],
        modelUsed: 'test-model',
        processingTime: 1000,
      };

      (cacheService.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await router.mark(mockRequest, 'FREE');

      expect(result).toEqual({
        ...cachedResult,
        cached: true,
      });
      expect(cacheService.get).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw error when no providers available', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      // Mock no available providers
      jest.spyOn(router, 'getAvailableProviders').mockReturnValue([]);

      await expect(router.mark(mockRequest, 'FREE')).rejects.toThrow(
        'No AI providers available'
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const mockProvider = {
        name: 'TestProvider',
        available: true,
        tier: 'free' as const,
        mark: jest
          .fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Timeout'))
          .mockResolvedValue({
            score: 85,
            feedback: 'Test feedback',
            grade: '8',
            maxScore: 100,
            strengths: ['Good'],
            improvements: ['Could improve'],
            modelUsed: 'test-model',
            processingTime: 1000,
          }),
      };

      jest
        .spyOn(router, 'getAvailableProviders')
        .mockReturnValue([mockProvider]);

      const result = await router.mark(mockRequest, 'FREE');

      expect(mockProvider.mark).toHaveBeenCalledTimes(3);
      expect(result.score).toBe(85);
      expect(cacheService.set).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object)
      );
    });

    it('should try fallback providers when primary fails', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const primaryProvider = {
        name: 'Primary',
        available: true,
        tier: 'free' as const,
        mark: jest.fn().mockRejectedValue(new Error('Primary failed')),
      };

      const fallbackProvider = {
        name: 'Fallback',
        available: true,
        tier: 'free' as const,
        mark: jest.fn().mockResolvedValue({
          score: 75,
          feedback: 'Fallback feedback',
          grade: '7',
          maxScore: 100,
          strengths: ['Adequate'],
          improvements: ['More detail needed'],
          modelUsed: 'fallback-model',
          processingTime: 1500,
        }),
      };

      jest
        .spyOn(router, 'getAvailableProviders')
        .mockReturnValue([primaryProvider, fallbackProvider]);

      const result = await router.mark(mockRequest, 'FREE');

      expect(primaryProvider.mark).toHaveBeenCalledTimes(3); // Max retries
      expect(fallbackProvider.mark).toHaveBeenCalledTimes(1);
      expect(result.score).toBe(75);
    });

    it('should handle timeout correctly', async () => {
      jest.useFakeTimers();
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const slowProvider = {
        name: 'SlowProvider',
        available: true,
        tier: 'free' as const,
        mark: jest
          .fn()
          .mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 35000))
          ),
      };

      jest
        .spyOn(router, 'getAvailableProviders')
        .mockReturnValue([slowProvider]);

      const markPromise = router.mark(mockRequest, 'FREE');

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(31000);

      await expect(markPromise).rejects.toThrow('All AI providers failed');

      jest.useRealTimers();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return free providers for free tier', () => {
      const providers = router.getAvailableProviders('FREE');
      expect(providers).toHaveLength(3); // Gemini, DeepSeek, Kimi
      expect(providers.every(p => p.tier === 'free')).toBe(true);
    });

    it('should return all providers for pro tier', () => {
      const providers = router.getAvailableProviders('PRO');
      expect(providers).toHaveLength(4); // All providers
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider information', () => {
      const info = router.getProviderInfo('FREE');
      expect(info).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            tier: expect.any(String),
            available: expect.any(Boolean),
          }),
        ])
      );
    });
  });
});
