import { db } from '@/lib/db';
import { seedPastPapers } from '@/lib/seedPastPapers';
import PastPapersClient from './client';
import type { PastPaper } from '@/types';

export default async function PastPapersPage() {
  // Ensure we have sample data for anonymous users too
  await seedPastPapers();

  // Fetch past papers without any user/session requirement
  const client = await db;
  const { data: pastPapers, error } = await client
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false })
    .order('title', { ascending: true });

  if (error || !pastPapers) {
    return (
      <div id="past-papers-section">
        <PastPapersClient
          pastPapers={[]}
          subjects={[]}
          examBoards={[]}
          subjectCounts={{}}
          examBoardCounts={{}}
        />
      </div>
    );
  }

  const papers = pastPapers as PastPaper[];

  const subjects = [...new Set(papers.map(paper => paper.subject))];
  const examBoards = [...new Set(papers.map(paper => paper.examBoard))];

  const subjectCounts = subjects.reduce((acc: Record<string, number>, subject) => {
    acc[subject] = papers.filter(paper => paper.subject === subject).length;
    return acc;
  }, {});

  const examBoardCounts = examBoards.reduce((acc: Record<string, number>, board) => {
    acc[board] = papers.filter(paper => paper.examBoard === board).length;
    return acc;
  }, {});

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
