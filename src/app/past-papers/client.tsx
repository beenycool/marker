'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  FileText,
  Target,
  Award,
  ChevronRight,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SubjectSelector from '@/components/past-papers/subject-selector';
import ExamBoardSelector from '@/components/past-papers/exam-board-selector';
import PaperSelector from '@/components/past-papers/paper-selector';
import EnhancedPaperViewer from '@/components/past-papers/enhanced-paper-viewer';

interface PastPaper {
  id: string;
  title: string;
  subject: string;
  examBoard: string;
  year: number;
  questions: any[];
}

interface PastPapersClientProps {
  pastPapers: PastPaper[];
  subjects: string[];
  examBoards: string[];
  subjectCounts: Record<string, number>;
  examBoardCounts: Record<string, number>;
}

type Step = 'overview' | 'subject' | 'examBoard' | 'paper' | 'viewer';

export default function PastPapersClient({
  pastPapers,
  subjects,
  examBoards,
  subjectCounts,
  examBoardCounts,
}: PastPapersClientProps) {
  const [currentStep, setCurrentStep] = useState<Step>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedExamBoard, setSelectedExamBoard] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const router = useRouter();

  // Filter data based on selections
  const filteredExamBoards = useMemo(() => {
    if (!selectedSubject) return examBoards;
    return [
      ...new Set(
        pastPapers
          .filter(paper => paper.subject === selectedSubject)
          .map(paper => paper.examBoard)
      ),
    ];
  }, [selectedSubject, pastPapers, examBoards]);

  const filteredPapers = useMemo(() => {
    if (!selectedSubject || !selectedExamBoard) return [];
    return pastPapers.filter(
      paper =>
        paper.subject === selectedSubject &&
        paper.examBoard === selectedExamBoard
    );
  }, [selectedSubject, selectedExamBoard, pastPapers]);

  // Calculate counts for filtered data
  const filteredExamBoardCounts = useMemo(() => {
    if (!selectedSubject) return examBoardCounts;
    return filteredExamBoards.reduce(
      (acc, board) => {
        acc[board] = pastPapers.filter(
          paper =>
            paper.subject === selectedSubject && paper.examBoard === board
        ).length;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [selectedSubject, filteredExamBoards, pastPapers, examBoardCounts]);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentStep('examBoard');
  };

  const handleExamBoardSelect = (examBoard: string) => {
    setSelectedExamBoard(examBoard);
    setCurrentStep('paper');
  };

  const handlePaperSelect = (paper: PastPaper) => {
    setSelectedPaper(paper);
    setCurrentStep('viewer');
  };

  const handleBackToOverview = () => {
    setCurrentStep('overview');
    setSelectedSubject('');
    setSelectedExamBoard('');
    setSelectedPaper(null);
  };

  // Removed unused handleBackToSubject function

  const handleBackToExamBoard = () => {
    setCurrentStep('examBoard');
    setSelectedPaper(null);
  };

  const handleBackToPaper = () => {
    setCurrentStep('paper');
    setSelectedPaper(null);
  };

  const handlePaperSubmit = async (
    answers: Record<string, string>,
    timeSpent: number
  ) => {
    if (!selectedPaper) return;

    try {
      const response = await fetch(`/api/past-papers/${selectedPaper.id}`, {
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

  const getBreadcrumbs = () => {
    const items = [
      { label: 'Past Papers', active: currentStep === 'overview' },
    ];

    if (selectedSubject) {
      items.push({ label: selectedSubject, active: currentStep === 'subject' });
    }

    if (selectedExamBoard) {
      items.push({
        label: selectedExamBoard,
        active: currentStep === 'examBoard',
      });
    }

    if (selectedPaper) {
      items.push({
        label: selectedPaper.title,
        active: currentStep === 'paper',
      });
    }

    return items;
  };

  const getTotalMarks = (paper: PastPaper) => {
    return paper.questions.reduce(
      (sum: number, q: any) => sum + (q.marks || 0),
      0
    );
  };

  if (currentStep === 'viewer' && selectedPaper) {
    return (
      <EnhancedPaperViewer
        paper={selectedPaper}
        totalMarks={getTotalMarks(selectedPaper)}
        onBack={handleBackToPaper}
        onSubmit={handlePaperSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-4 w-4 text-gray-400" />
            {getBreadcrumbs().map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`text-sm ${
                    item.active ? 'text-white font-medium' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Past Papers</h1>
          <p className="text-gray-300">
            Practice with real GCSE papers and get instant AI feedback on your
            answers.
          </p>
        </div>

        {/* Overview Stats - Only show on overview step */}
        {currentStep === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Papers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {pastPapers.length}
                </div>
                <p className="text-gray-400 text-sm">Available to practice</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {subjects.length}
                </div>
                <p className="text-gray-400 text-sm">Different subjects</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Exam Boards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {examBoards.length}
                </div>
                <p className="text-gray-400 text-sm">Supported boards</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">0</div>
                <p className="text-gray-400 text-sm">Papers completed</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SubjectSelector
                subjects={subjects}
                paperCounts={subjectCounts}
                onSelectSubject={handleSubjectSelect}
              />
            </motion.div>
          )}

          {currentStep === 'subject' && (
            <motion.div
              key="subject"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SubjectSelector
                subjects={subjects}
                paperCounts={subjectCounts}
                onSelectSubject={handleSubjectSelect}
              />
            </motion.div>
          )}

          {currentStep === 'examBoard' && (
            <motion.div
              key="examBoard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExamBoardSelector
                selectedSubject={selectedSubject}
                examBoards={filteredExamBoards}
                paperCounts={filteredExamBoardCounts}
                onSelectExamBoard={handleExamBoardSelect}
                onGoBack={handleBackToOverview}
              />
            </motion.div>
          )}

          {currentStep === 'paper' && (
            <motion.div
              key="paper"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PaperSelector
                selectedSubject={selectedSubject}
                selectedExamBoard={selectedExamBoard}
                papers={filteredPapers}
                onSelectPaper={handlePaperSelect}
                onGoBack={handleBackToExamBoard}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
