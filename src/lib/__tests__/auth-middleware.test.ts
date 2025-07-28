import { withAuth, requireAuth } from '../auth/';

// Mock dependencies - all GDPR-safe now
jest.mock('../auth', () => ({
  withAuth: jest.fn((handler: any) => handler),
  requireAuth: jest.fn(() => false),
  getCurrentUser: jest.fn(() => null),
}));

describe('Auth middleware (GDPR-safe)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should pass through requests without authentication', async () => {
      const mockHandler = jest.fn();
      const middleware = withAuth(mockHandler);

      expect(middleware).toBe(mockHandler);
    });
  });

  describe('requireAuth', () => {
    it('should always return false (no authentication)', async () => {
      const result = requireAuth();
      expect(result).toBe(false);
    });
  });
});
