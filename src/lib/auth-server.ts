// Legacy auth server file - use /auth/index.ts instead
// This file is maintained for backward compatibility

// import { getEnvVar } from './cloudflare-env';
import { logger } from './logger';
import type { User } from '@/types';
// import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createServerClient() {
  // Dynamic import to avoid bundling server code in client
  const { createServerClient: createClient } = await import('./auth/server');
  return createClient();
}

/**
 * Get the current user on the server side
 * Use this in server components and API routes
 */
export async function getServerUser(): Promise<User | null> {
  try {
    // Dynamic import to avoid bundling server code in client
    const { createServerClient } = await import('./auth/server');
    const supabase = await createServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    const userId = session.user.id;
    const email = session.user.email || '';

    // Get or create user in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single();

      return updatedUser;
    } else {
      // Create new user
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          subscription_tier: 'FREE',
          role: 'STUDENT',
          onboarding_completed: false,
        })
        .select('*')
        .single();

      return newUser;
    }
  } catch (error) {
    logger.error('Error getting server user:', error);
    return null;
  }
}

/**
 * Require authentication on the server side
 * Throws an error if user is not authenticated
 */
export async function requireServerAuth(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
