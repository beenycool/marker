import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { seedPastPapers } from '@/lib/seedPastPapers';
import PastPapersClient from './client';

interface PastPaper {
  id: string;
  title: string;
  year: number;
  subject: string;
  examBoard: string;
  questions: any[];
}

export default async function PastPapersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Ensure we have sample data
  await seedPastPapers();

  // Fetch real past papers from database
  const client = await db;
  const { data: pastPapers, error } = await client
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false })
    .order('title', { ascending: true });

  if (error || !pastPapers) {
    return (
      <PastPapersClient
        pastPapers={[]}
        subjects={[]}
        examBoards={[]}
        subjectCounts={{}}
        examBoardCounts={{}}
      />
    );
  }

  // Cast to PastPaper[] to fix TypeScript errors
  const papers = pastPapers as PastPaper[];

  // Process data for the multi-step interface
  const subjects = [...new Set(papers.map(paper => paper.subject))];
  const examBoards = [...new Set(papers.map(paper => paper.examBoard))];

  // Calculate counts for each step
  const subjectCounts = subjects.reduce(
    (acc: Record<string, number>, subject) => {
      acc[subject] = papers.filter(paper => paper.subject === subject).length;
      return acc;
    },
    {}
  );

  const examBoardCounts = examBoards.reduce(
    (acc: Record<string, number>, board) => {
      acc[board] = papers.filter(paper => paper.examBoard === board).length;
      return acc;
    },
    {}
  );

  // Transform papers to include questions as proper array
  const processedPapers = papers.map(paper => ({
    ...paper,
    questions: Array.isArray(paper.questions) ? paper.questions : [],
  }));

  return (
    <div id="past-papers-section">
      <PastPapersClient
        pastPapers={processedPapers}
        subjects={subjects}
        examBoards={examBoards}
        subjectCounts={subjectCounts}
        examBoardCounts={examBoardCounts}
      />
    </div>
  );
}
