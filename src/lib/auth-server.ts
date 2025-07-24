// Legacy auth server file - use /auth/index.ts instead
// This file is maintained for backward compatibility

import { createServerClient as createClient } from './auth/server';

export async function createServerClient() {
  return createClient();
}
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
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
 * Get the current user on the server side
 * Use this in server components and API routes
 */
export async function getServerUser(): Promise<User | null> {
  try {
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
    console.error('Error getting server user:', error);
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
