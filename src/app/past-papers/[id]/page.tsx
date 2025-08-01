import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import PastPaperClient from './client';

interface PastPaperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PastPaperPage({ params }: PastPaperPageProps) {
  const { id } = await params;

  // Anonymous-friendly fetch (no user/session)
  const client = await db;
  const { data: pastPaper, error } = await client
    .from('past_papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pastPaper) {
    notFound();
  }

  const questions = Array.isArray(pastPaper.questions) ? pastPaper.questions : [];
  const totalMarks = questions.reduce(
    (sum: number, q: any) => sum + (q.marks || 0),
    0
  );

  const processedPaper = {
    ...pastPaper,
    questions: questions as any[],
  };

  return <PastPaperClient paper={processedPaper} totalMarks={totalMarks} />;
}
