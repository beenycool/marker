import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnvVar } from '../cloudflare-env';
import { logger } from '../logger';
import type { User, Tier } from '@/types';

// Request-scoped cache to avoid redundant database calls within a single request
const userCache = new Map<string, { user: User | null; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute in milliseconds

/**
 * Create a Supabase client for server-side operations
 * This should be used in server components, API routes, and server actions
 */
export async function createServerClient() {
  const supabaseUrl = await getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = await getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const cookieStore = await cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value || null;
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        },
        removeItem: (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

/**
 * Get the current authenticated user for server-side operations
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    const userId = session.user.id;
    const email = session.user.email || '';

    // Check request-scoped cache first
    const cacheKey = `user:${userId}`;
    const cached = userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.user;
    }

    // Fetch user data from the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user profile', { error: error.message, userId });
      return null;
    }

    const user: User = {
      id: userId,
      email,
      role: (profile?.role as 'STUDENT' | 'ADMIN') || 'STUDENT',
      subscriptionTier: 'PRO', // Everyone gets PRO access
      onboardingCompleted: profile?.onboarding_completed || false,
      yearGroup: profile?.year_group || null,
      subjects: profile?.subjects || [],
      examBoards: profile?.exam_boards || null,
      studyGoals: profile?.study_goals || [],
      preferredStudyTime: profile?.preferred_study_time || null,
      createdAt: profile?.created_at || new Date(),
      updatedAt: profile?.updated_at || new Date(),
    };

    // Cache the result
    userCache.set(cacheKey, { user, timestamp: Date.now() });

    return user;
  } catch (error) {
    logger.error('Error in getCurrentUser', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

/**
 * Check if a user has a specific tier or higher
 */
export function hasMinimumTier(user: User | null, requiredTier: Tier): boolean {
  if (!user) return false;
  
  const tierHierarchy: Record<Tier, number> = {
    'FREE': 0,
    'PRO': 1,
  };
  
  return tierHierarchy[user.tier] >= tierHierarchy[requiredTier];
}

/**
 * Get user by ID (admin function)
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: (profile.role as 'STUDENT' | 'ADMIN') || 'STUDENT',
      subscriptionTier: 'PRO', // Everyone gets PRO access
      onboardingCompleted: profile.onboarding_completed || false,
      yearGroup: profile.year_group || null,
      subjects: profile.subjects || [],
      examBoards: profile.exam_boards || null,
      studyGoals: profile.study_goals || [],
      preferredStudyTime: profile.preferred_study_time || null,
      createdAt: profile.created_at || new Date(),
      updatedAt: profile.updated_at || new Date(),
    };
  } catch (error) {
    logger.error('Error fetching user by ID', { error: error instanceof Error ? error.message : 'Unknown error', userId });
    return null;
  }
}

/**
 * Clear user cache (useful for testing or when user data changes)
 */
export function clearUserCache(userId?: string) {
  if (userId) {
    userCache.delete(`user:${userId}`);
  } else {
    userCache.clear();
  }
}