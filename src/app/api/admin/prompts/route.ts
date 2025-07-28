import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const promptSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  content: z.string().min(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  subject: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await getSupabase();

    // Get all prompts with their performance metrics
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select(
        `
        id,
        name,
        version,
        content,
        description,
        is_active,
        rollout_percentage,
        subject,
        metadata,
        created_at,
        updated_at,
        performance_metrics
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching prompts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    return NextResponse.json(prompts || []);
  } catch (error) {
    logger.error('Error in GET /api/admin/prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = promptSchema.parse(body);

    const supabase = await getSupabase();

    // If this prompt is being set as active, deactivate others with the same name
    if (validatedData.isActive) {
      await supabase
        .from('ai_prompts')
        .update({ is_active: false, rollout_percentage: 0 })
        .eq('name', validatedData.name);
    }

    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .insert({
        name: validatedData.name,
        version: validatedData.version,
        content: validatedData.content,
        description: validatedData.description,
        is_active: validatedData.isActive,
        rollout_percentage: validatedData.rolloutPercentage,
        subject: validatedData.subject,
        metadata: validatedData.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating prompt:', error);
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      );
    }

    logger.info('Prompt created successfully', {
      promptId: prompt.id,
      name: prompt.name,
      version: prompt.version,
    });

    return NextResponse.json(prompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error in POST /api/admin/prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('id');

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = promptSchema.partial().parse(body);

    const supabase = await getSupabase();

    // If setting as active, deactivate others with the same name
    if (updates.isActive) {
      const { data: existingPrompt } = await supabase
        .from('ai_prompts')
        .select('name')
        .eq('id', promptId)
        .single();

      if (existingPrompt) {
        await supabase
          .from('ai_prompts')
          .update({ is_active: false, rollout_percentage: 0 })
          .eq('name', existingPrompt.name)
          .neq('id', promptId);
      }
    }

    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .update({
        name: updates.name,
        version: updates.version,
        content: updates.content,
        description: updates.description,
        is_active: updates.isActive,
        rollout_percentage: updates.rolloutPercentage,
        subject: updates.subject,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating prompt:', error);
      return NextResponse.json(
        { error: 'Failed to update prompt' },
        { status: 500 }
      );
    }

    logger.info('Prompt updated successfully', {
      promptId: prompt.id,
      name: prompt.name,
      version: prompt.version,
      updates: Object.keys(updates),
    });

    return NextResponse.json(prompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error in PATCH /api/admin/prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('id');

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      logger.error('Error deleting prompt:', error);
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      );
    }

    logger.info('Prompt deleted successfully', { promptId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/admin/prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
