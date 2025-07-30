import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const clarifyRequestSchema = z.object({
  originalAnswer: z.string().min(1, 'Original answer is required'),
  improvementSuggestion: z.string().min(1, 'Improvement suggestion is required'),
  promptVersion: z.string().optional().default('brutal-examiner-v1.2'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clarifyRequestSchema.parse(body);

    const { originalAnswer, improvementSuggestion, promptVersion } = validatedData;

    // Create a focused prompt for clarification
    const clarificationPrompt = `You are a helpful teaching assistant. Your job is to explain feedback in simple, actionable terms.

Context:
- A student wrote this answer: "${originalAnswer}"
- An AI examiner gave them this feedback: "${improvementSuggestion}"

Your task:
1. Briefly explain what the suggestion means in simple terms (1-2 sentences)
2. Provide a short, concrete example of how the student could rewrite one sentence from their original answer to apply this suggestion

Keep your entire response under 100 words and be encouraging.

Format your response as:
**What this means:** [explanation]
**Example improvement:** [concrete example]`;

    // Make API call to your AI service
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: clarificationPrompt,
          },
        ],
        model: 'gpt-4o-mini', // Use a fast, cost-effective model for clarifications
        max_tokens: 150,
        temperature: 0.3, // Lower temperature for more consistent explanations
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to get AI clarification');
    }

    const aiData = await aiResponse.json();
    const clarification = aiData.choices?.[0]?.message?.content?.trim();

    if (!clarification) {
      throw new Error('No clarification received from AI');
    }

    return NextResponse.json({
      success: true,
      clarification,
      metadata: {
        promptVersion,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
      },
    });

  } catch (error) {
    console.error('Clarification API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate clarification',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST to request feedback clarification.',
    },
    { status: 405 }
  );
}