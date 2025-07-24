'use client';

import { useRouter } from 'next/navigation';
import EnhancedPaperViewer from '@/components/past-papers/enhanced-paper-viewer';

interface Question {
  id: string;
  question: string;
  marks: number;
  topic?: string;
  markScheme?: string;
}

interface PastPaper {
  id: string;
  title: string;
  subject: string;
  examBoard: string;
  year: number;
  questions: Question[];
}

interface PastPaperClientProps {
  paper: PastPaper;
  totalMarks: number;
}

export default function PastPaperClient({
  paper,
  totalMarks,
}: PastPaperClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/past-papers');
  };

  const handleSubmit = async (
    answers: Record<string, string>,
    timeSpent: number
  ) => {
    try {
      const response = await fetch(`/api/past-papers/${paper.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit past paper');
      }

      const data = await response.json();

      // Redirect to mark the submission
      router.push(`/mark?submission=${data.submission.id}`);
    } catch (error) {
      throw error;
    }
  };

  return (
    <EnhancedPaperViewer
      paper={paper}
      totalMarks={totalMarks}
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
