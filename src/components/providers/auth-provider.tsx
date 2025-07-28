'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import type { User } from '@/types';
import {
  createClientClient,
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  onAuthStateChange,
  getCurrentSession,
} from '@/lib/auth/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithProvider: (
    provider: 'google' | 'github'
  ) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Set up auth state listener
        unsubscribe = await onAuthStateChange(user => {
          setUser(user);
          setLoading(false);
        });

        // Get initial session
        const initialSession = await getCurrentSession();
        setSession(initialSession);

        if (!initialSession) {
          setLoading(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
      // Also call our API to clear server-side cookies
      await fetch('/api/auth/sign-out', { method: 'POST' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error signing out:', error);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const supabase = await createClientClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut: handleSignOut,
    signInWithProvider,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
