import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';

const shareSchema = z.object({
  score: z.number(),
  totalMarks: z.union([z.number(), z.string()]),
  subject: z.string().optional(),
  grade: z.string().optional(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = shareSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid share data', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const shareData = validatedData.data;
    const supabase = await getSupabase();

    // Generate a random share ID
    const shareId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

    // Store shareable result (no personal data)
    const { error } = await supabase
      .from('shared_results')
      .insert({
        share_id: shareId,
        score: shareData.score,
        total_marks: shareData.totalMarks,
        subject: shareData.subject || 'GCSE Practice',
        grade_estimate: shareData.grade,
        created_at: shareData.timestamp,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

    if (error) {
      console.error('Failed to create shared result:', error);
      return NextResponse.json(
        { error: 'Failed to create shareable link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      shareId,
      url: `/shared/${shareId}`
    });

  } catch (error) {
    console.error('Share result API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve shared results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    return NextResponse.json(
      { error: 'Share ID required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('shared_results')
      .select('*')
      .eq('share_id', shareId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Shared result not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      score: data.score,
      totalMarks: data.total_marks,
      subject: data.subject,
      gradeEstimate: data.grade_estimate,
      createdAt: data.created_at,
    });

  } catch (error) {
    console.error('Get shared result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}