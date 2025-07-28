import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check database connection
    const supabase = await getSupabase();
    const { error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: 'fail', error: error.message },
            application: { status: 'pass' },
          },
        },
        { status: 503 }
      );
    }

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'pass' },
          application: { status: 'pass' },
        },
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'fail' },
          application: { status: 'fail', error: String(error) },
        },
      },
      { status: 503 }
    );
  }
}
