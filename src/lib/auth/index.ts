// GDPR REMOVAL: All authentication system commented out
/*
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
*/

// GDPR-SAFE: No authentication - all functions disabled
export const createServerClient = () => null;
export const getCurrentUser = () => null;
export const hasMinimumTier = () => false;
export const getUserById = () => null;
export const clearUserCache = () => {};

export const createClientClient = () => null;
export const signInWithEmail = () => null;
export const signUpWithEmail = () => null;
export const signOut = () => {};
export const getCurrentSession = () => null;
export const onAuthStateChange = () => {};
export const resetPassword = () => null;
export const updatePassword = () => null;

export const withAuth = (handler: any) => handler;
export const withAdminAuth = (handler: any) => handler;
export const isAuthenticated = () => false;
export const requireAuth = () => false;
export const isSummerPromotionActive = () => Promise.resolve(false);
