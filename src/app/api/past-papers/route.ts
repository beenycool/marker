import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const pastPaperSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  examBoard: z.string().min(1, 'Exam board is required'),
  year: z.number().int().min(2010).max(2030),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      marks: z.number().int().positive(),
      topic: z.string().optional(),
      markScheme: z.string().optional(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    // Clerk removed: skipping userId check

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const examBoard = searchParams.get('examBoard');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build the query
    const dbClient = await db;
    let query = dbClient.from('past_papers').select('*');
    let countQuery = dbClient
      .from('past_papers')
      .select('*', { count: 'exact', head: true });

    if (subject) {
      query = query.eq('subject', subject);
      countQuery = countQuery.eq('subject', subject);
    }
    if (examBoard) {
      query = query.eq('exam_board', examBoard);
      countQuery = countQuery.eq('exam_board', examBoard);
    }
    if (year) {
      query = query.eq('year', parseInt(year));
      countQuery = countQuery.eq('year', parseInt(year));
    }

    query = query
      .order('year', { ascending: false })
      .order('title', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const [{ data: pastPapers, error }, { count: total, error: countError }] =
      await Promise.all([query, countQuery]);

    if (error || countError) {
      logger.error('Supabase past papers query error:', error || countError);
      return NextResponse.json(
        { error: 'Failed to fetch past papers' },
        { status: 500 }
      );
    }

    // Get available filters using distinct queries
    const [{ data: subjects }, { data: examBoards }, { data: years }] =
      await Promise.all([
        dbClient
          .from('past_papers')
          .select('subject')
          .order('subject', { ascending: true }),
        dbClient
          .from('past_papers')
          .select('exam_board')
          .order('exam_board', { ascending: true }),
        dbClient
          .from('past_papers')
          .select('year')
          .order('year', { ascending: false }),
      ]);

    // Remove duplicates manually since Supabase doesn't have DISTINCT in JS client
    const uniqueSubjects = [
      ...new Set(subjects?.map((s: any) => s.subject) || []),
    ];
    const uniqueExamBoards = [
      ...new Set(examBoards?.map((e: any) => e.exam_board) || []),
    ];
    const uniqueYears = [...new Set(years?.map((y: any) => y.year) || [])];

    return NextResponse.json({
      pastPapers: pastPapers.map((paper: any) => ({
        ...paper,
        questions: Array.isArray(paper.questions) ? paper.questions : [],
      })),
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
      filters: {
        subjects: uniqueSubjects,
        examBoards: uniqueExamBoards,
        years: uniqueYears,
      },
    });
  } catch (error) {
    logger.error('Past papers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past papers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clerk removed: skipping userId check

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can create past papers
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Only administrators can create past papers',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = pastPaperSchema.parse(body);

    const dbClient2 = await db;
    const { data: pastPaper, error } = await dbClient2
      .from('past_papers')
      .insert({
        title: validatedData.title,
        subject: validatedData.subject,
        exam_board: validatedData.examBoard,
        year: validatedData.year,
        questions: validatedData.questions,
      })
      .select('*')
      .single();

    if (error || !pastPaper) {
      logger.error('Supabase past paper creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create past paper' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pastPaper: {
        ...pastPaper,
        questions: Array.isArray(pastPaper.questions)
          ? pastPaper.questions
          : [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Create past paper error:', error);
    return NextResponse.json(
      { error: 'Failed to create past paper' },
      { status: 500 }
    );
  }
}
