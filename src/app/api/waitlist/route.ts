import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const waitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await checkRateLimit(ip, rateLimiters.waitlist);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = waitlistSchema.parse(body);

    // Check if email already exists
    const client = await getDb();
    const { data: existing } = await client
      .from('waitlist')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already on waitlist' },
        { status: 409 }
      );
    }

    // Add to waitlist
    const { data, error } = await client
      .from('waitlist')
      .insert({
        email: validatedData.email,
        name: validatedData.name || null,
        source: validatedData.source || 'website',
      })
      .select()
      .single();

    if (error) {
      logger.error('Waitlist insertion error', error);
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Successfully joined waitlist', data },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Waitlist API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check waitlist status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    );
  }

  try {
    const client = await getDb();
    const { data, error } = await client
      .from('waitlist')
      .select('status, created_at')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Waitlist check error', error);
      return NextResponse.json(
        { error: 'Failed to check waitlist status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      onWaitlist: !!data,
      status: data?.status || null,
      joinedAt: data?.created_at || null,
    });
  } catch (error) {
    logger.error('Waitlist check API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
