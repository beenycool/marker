import { getSupabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await getSupabase();

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json({ session: null, user: null }, { status: 200 });
    }

    // Get the full user profile from database
    const user = await getCurrentUser();

    return NextResponse.json(
      {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user,
        },
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
