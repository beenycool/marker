// Server-side auth functions
export {
  createServerClient,
  getCurrentUser,
  hasMinimumTier,
  getUserById,
  clearUserCache,
} from './server';

// Client-side auth functions
export {
  createClientClient,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentSession,
  onAuthStateChange,
  resetPassword,
  updatePassword,
} from './client';

// Middleware functions
export {
  withAuth,
  withAdminAuth,
  isAuthenticated,
  requireAuth,
} from './middleware';

// Re-export types for convenience
export type { User, Tier } from '@/types';