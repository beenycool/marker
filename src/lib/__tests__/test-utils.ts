import { jest } from '@jest/globals';
import { MarkingRequest, MarkingResponse, User, Tier } from '@/types';

/**
 * Mock factory for creating consistent test users
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-1',
  email: 'test@example.com',
  tier: 'FREE' as Tier,
  name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock factory for creating test marking requests
 */
export const createMockMarkingRequest = (overrides: Partial<MarkingRequest> = {}): MarkingRequest => ({
  question: 'What is 2 + 2?',
  answer: '2 + 2 = 4',
  subject: 'Mathematics',
  examBoard: 'Edexcel',
  marksTotal: 10,
  markScheme: null,
  ...overrides,
});

/**
 * Mock factory for creating test marking responses
 */
export const createMockMarkingResponse = (overrides: Partial<MarkingResponse> = {}): MarkingResponse => ({
  score: 8,
  grade: '7',
  aosMet: ['AO1', 'AO2'],
  improvementSuggestions: [
    'Show more working steps',
    'Explain your reasoning more clearly'
  ],
  aiResponse: 'Good understanding shown. The answer is correct.',
  modelUsed: 'test-model',
  ...overrides,
});

/**
 * Mock Supabase client factory with commonly used methods
 */
export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return mockClient;
};

/**
 * Mock Next.js request factory
 */
export const createMockRequest = (options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
  user?: User;
} = {}): NextRequest => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    url = 'http://localhost:3000',
    user,
  } = options;

  const mockRequest = {
    method,
    url,
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    formData: jest.fn().mockResolvedValue(new FormData()),
    clone: jest.fn().mockReturnThis(),
    user, // For authenticated requests
  } as unknown as NextRequest;

  return mockRequest;
};

/**
 * Mock Redis client factory
 */
export const createMockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  info: jest.fn(),
});

/**
 * Mock AI provider factory
 */
export const createMockAIProvider = (name: string, overrides: any = {}) => ({
  name,
  model: `${name}-model`,
  tier: 'free' as const,
  available: true,
  mark: jest.fn().mockResolvedValue(createMockMarkingResponse()),
  ...overrides,
});

/**
 * Helper to create mock environment variables
 */
export const mockEnvVars = (vars: Record<string, string>) => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

/**
 * Helper to assert API response structure
 */
export const expectAPIResponse = (response: any, expectedStatus: number) => {
  expect(response.status).toBe(expectedStatus);
  return {
    toHaveData: (expectedData?: any) => {
      expect(response.json).toHaveBeenCalled();
      if (expectedData) {
        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining(expectedData)
        );
      }
    },
    toHaveError: (expectedError?: string) => {
      expect(response.json).toHaveBeenCalled();
      if (expectedError) {
        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining({ error: expectedError })
        );
      }
    },
  };
};

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = console;
  
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  });
};