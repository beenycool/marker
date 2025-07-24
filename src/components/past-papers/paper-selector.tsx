'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Target,
  Play,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PastPaper {
  id: string;
  title: string;
  subject: string;
  examBoard: string;
  year: number;
  questions: any[];
}

interface PaperSelectorProps {
  selectedSubject: string;
  selectedExamBoard: string;
  papers: PastPaper[];
  onSelectPaper: (paper: PastPaper) => void;
  onGoBack: () => void;
}

const getDifficultyColor = (marks: number) => {
  if (marks <= 30) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (marks <= 60)
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
};

const getDifficultyText = (marks: number) => {
  if (marks <= 30) return 'Easy';
  if (marks <= 60) return 'Medium';
  return 'Hard';
};

const getYearColor = (year: number) => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 1) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (age <= 3) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (age <= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
};

export default function PaperSelector({
  selectedSubject,
  selectedExamBoard,
  papers,
  onSelectPaper,
  onGoBack,
}: PaperSelectorProps) {
  const sortedPapers = [...papers].sort((a, b) => {
    // Sort by year (descending) then by title
    const yearDiff = b.year - a.year;
    return yearDiff !== 0 ? yearDiff : a.title.localeCompare(b.title);
  });

  // Group papers by year for better organization
  const papersByYear = sortedPapers.reduce(
    (acc, paper) => {
      if (!acc[paper.year]) {
        acc[paper.year] = [];
      }
      acc[paper.year].push(paper);
      return acc;
    },
    {} as Record<number, PastPaper[]>
  );

  const years = Object.keys(papersByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={onGoBack}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exam Boards
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Past Paper
          </h2>
          <p className="text-gray-300">
            Select a past paper for{' '}
            <span className="text-blue-300 font-medium">{selectedSubject}</span>{' '}
            -{' '}
            <span className="text-purple-300 font-medium">
              {selectedExamBoard}
            </span>
          </p>
        </div>
      </div>

      {years.length > 0 ? (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year} className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h3 className="text-xl font-semibold text-white">{year}</h3>
                <Badge className={getYearColor(year)}>
                  {papersByYear[year].length}{' '}
                  {papersByYear[year].length === 1 ? 'paper' : 'papers'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {papersByYear[year].map((paper, index) => {
                  const questions = Array.isArray(paper.questions)
                    ? paper.questions
                    : [];
                  const totalMarks = questions.reduce(
                    (sum: number, q: any) => sum + (q.marks || 0),
                    0
                  );
                  const estimatedDuration = Math.max(60, totalMarks * 1.5);

                  return (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer h-full group">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {paper.examBoard}
                            </Badge>
                            <Badge className={getDifficultyColor(totalMarks)}>
                              {getDifficultyText(totalMarks)}
                            </Badge>
                          </div>
                          <CardTitle className="text-white text-lg leading-tight">
                            {paper.title}
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            {paper.subject} - {paper.year}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">
                                {paper.year}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">
                                {estimatedDuration} min
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">
                                {totalMarks} marks
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">
                                {questions.length} questions
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">
                                0 attempts
                              </span>
                            </div>
                            <Button
                              onClick={() => onSelectPaper(paper)}
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10 group-hover:border-white/30 transition-colors"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Paper
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Past Papers Available
          </h3>
          <p className="text-gray-400">
            No past papers found for {selectedSubject} - {selectedExamBoard}.
            Please try another combination.
          </p>
        </div>
      )}
    </div>
  );
}
