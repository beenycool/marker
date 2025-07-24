import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { goldenDataset } from '@/lib/ai/golden-dataset';
import { enhancedAIRouter } from '@/lib/ai/enhanced-router';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (subject) filters.subject = subject;
    if (difficulty) filters.difficulty = difficulty;
    if (limit) filters.limit = parseInt(limit);

    const testCases = await goldenDataset.getTestCases(filters);
    
    return NextResponse.json({
      testCases,
      total: testCases.length,
    });
  } catch (error) {
    logger.error('Error fetching golden test cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    const {
      name,
      subject,
      exam_board,
      question,
      student_answer,
      expected_score_min,
      expected_score_max,
      expected_grade,
      difficulty,
      tags,
    } = body;

    const testCaseId = await goldenDataset.createTestCase({
      name,
      subject,
      exam_board,
      question,
      student_answer,
      expected_score_min,
      expected_score_max,
      expected_grade,
      difficulty,
      tags: tags || [],
      created_by: adminUser.email,
    });

    return NextResponse.json({
      success: true,
      testCaseId,
    });
  } catch (error) {
    logger.error('Error creating golden test case:', error);
    return NextResponse.json(
      { error: 'Failed to create test case' },
      { status: 500 }
    );
  }
}