import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';

const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
  consentDate: z.string(),
  purpose: z.literal('school_year_pricing_reminder'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = emailSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid email format', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { email, consentDate, purpose } = validatedData.data;
    const supabase = await getSupabase();

    // Store email with GDPR-compliant consent tracking
    const { error } = await supabase
      .from('summer_email_reminders')
      .upsert({
        email,
        consent_date: consentDate,
        purpose,
        ip_hash: null, // Don't store IP for privacy
        user_agent: null, // Don't store user agent
        created_at: new Date().toISOString(),
        sent: false,
        unsubscribed: false,
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('Failed to store email reminder:', error);
      return NextResponse.json(
        { error: 'Failed to save email reminder' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email reminder saved successfully' 
    });

  } catch (error) {
    console.error('Summer reminder API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}