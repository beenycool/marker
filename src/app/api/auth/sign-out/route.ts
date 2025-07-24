import { getSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await getSupabase();

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      // console.error('Sign out error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    // Clear the session cookie
    const response = NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    );

    // Clear auth cookies
    response.cookies.set({
      name: 'supabase-auth-token',
      value: '',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    // console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
