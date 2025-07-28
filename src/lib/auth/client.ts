import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from '../cloudflare-env';
import type { User } from '@/types';

/**
 * Create a Supabase client for client-side operations
 * This should be used in client components and browser-side code
 */
export async function createClientClient() {
  const supabaseUrl = await getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = await getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
        },
      },
    },
  });
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClientClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClientClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClientClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current session (client-side)
 */
export async function getCurrentSession() {
  const supabase = await createClientClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Listen to auth state changes
 */
export async function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = await createClientClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
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

      callback(user);
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = await createClientClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClientClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if summer promotion is active (client-side)
 */
export async function isSummerPromotionActive(): Promise<boolean> {
  // In GDPR-safe mode, return false
  return false;
}
