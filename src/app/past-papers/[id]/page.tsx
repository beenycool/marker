import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import PastPaperClient from './client';

interface PastPaperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PastPaperPage({ params }: PastPaperPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const client = await getDb();
  const { data: pastPaper, error } = await client
    .from('past_papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pastPaper) {
    notFound();
  }

  const questions = Array.isArray(pastPaper.questions)
    ? pastPaper.questions
    : [];
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
