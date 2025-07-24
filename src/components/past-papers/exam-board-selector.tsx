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
import { ArrowLeft, Building, Award, Target, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExamBoardSelectorProps {
  selectedSubject: string;
  examBoards: string[];
  paperCounts: Record<string, number>;
  onSelectExamBoard: (examBoard: string) => void;
  onGoBack: () => void;
}

const examBoardInfo: Record<
  string,
  {
    name: string;
    description: string;
    color: string;
    icon: React.ComponentType<any>;
  }
> = {
  AQA: {
    name: 'AQA',
    description: 'Assessment and Qualifications Alliance',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Award,
  },
  Edexcel: {
    name: 'Edexcel',
    description: 'Pearson Edexcel',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: Target,
  },
  OCR: {
    name: 'OCR',
    description: 'Oxford Cambridge and RSA',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: CheckCircle,
  },
  WJEC: {
    name: 'WJEC',
    description: 'Welsh Joint Education Committee',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: Building,
  },
  CCEA: {
    name: 'CCEA',
    description: 'Council for the Curriculum, Examinations & Assessment',
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    icon: Award,
  },
  CIE: {
    name: 'CIE',
    description: 'Cambridge International Examinations',
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Target,
  },
  IB: {
    name: 'IB',
    description: 'International Baccalaureate',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: CheckCircle,
  },
  SQA: {
    name: 'SQA',
    description: 'Scottish Qualifications Authority',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: Building,
  },
  Eduqas: {
    name: 'Eduqas',
    description: 'Eduqas (WJEC)',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: Award,
  },
  ICAAE: {
    name: 'ICAAE',
    description:
      'Independent Curriculum and Assessment Authority for Education',
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    icon: Target,
  },
};

const getExamBoardInfo = (examBoard: string) => {
  return (
    examBoardInfo[examBoard] || {
      name: examBoard,
      description: 'Exam Board',
      color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      icon: Building,
    }
  );
};

export default function ExamBoardSelector({
  selectedSubject,
  examBoards,
  paperCounts,
  onSelectExamBoard,
  onGoBack,
}: ExamBoardSelectorProps) {
  const sortedExamBoards = [...examBoards].sort((a, b) => {
    // Sort by paper count (descending) then alphabetically
    const countDiff = (paperCounts[b] || 0) - (paperCounts[a] || 0);
    return countDiff !== 0 ? countDiff : a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={onGoBack}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Exam Board
          </h2>
          <p className="text-gray-300">
            Select an exam board for{' '}
            <span className="text-blue-300 font-medium">{selectedSubject}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedExamBoards.map((examBoard, index) => {
          const boardInfo = getExamBoardInfo(examBoard);
          const Icon = boardInfo.icon;
          const paperCount = paperCounts[examBoard] || 0;

          return (
            <motion.div
              key={examBoard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge className={boardInfo.color}>
                      {paperCount} {paperCount === 1 ? 'paper' : 'papers'}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg leading-tight">
                    {boardInfo.name}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    {boardInfo.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    onClick={() => onSelectExamBoard(examBoard)}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 group-hover:border-white/30 transition-colors"
                  >
                    Select {boardInfo.name}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {sortedExamBoards.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Exam Boards Available
          </h3>
          <p className="text-gray-400">
            No exam boards found for {selectedSubject}. Please try another
            subject.
          </p>
        </div>
      )}
    </div>
  );
}
