'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  Target,
  FileText,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  marks: number;
  topic?: string;
  markScheme?: string;
}

interface QuestionNavigationProps {
  questions: Question[];
  answers: Record<string, string>;
  activeQuestionId: string | null;
  onQuestionSelect: (questionId: string) => void;
  totalMarks: number;
  paperTitle: string;
  paperInfo: {
    subject: string;
    examBoard: string;
    year: number;
  };
}

const isLongQuestion = (marks: number) => marks >= 10;

const getQuestionStatus = (question: Question, answer: string) => {
  const hasAnswer = answer?.trim().length > 0;
  const isLong = isLongQuestion(question.marks);

  if (hasAnswer) {
    return {
      status: 'completed' as const,
      icon: CheckCircle,
      color:
        'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30',
    };
  }

  if (isLong) {
    return {
      status: 'long' as const,
      icon: Sparkles,
      color:
        'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
    };
  }

  return {
    status: 'pending' as const,
    icon: Circle,
    color: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
  };
};

export default function QuestionNavigation({
  questions,
  answers,
  activeQuestionId,
  onQuestionSelect,
  totalMarks,
  paperTitle,
  paperInfo,
}: QuestionNavigationProps) {
  const answeredCount = questions.filter(
    q => answers[q.id]?.trim().length > 0
  ).length;
  const completionPercentage = (answeredCount / questions.length) * 100;

  const answeredMarks = questions
    .filter(q => answers[q.id]?.trim().length > 0)
    .reduce((sum, q) => sum + q.marks, 0);

  const longQuestions = questions.filter(q => isLongQuestion(q.marks));

  return (
    <div className="space-y-4">
      {/* Paper Info */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Paper Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm truncate">
              {paperTitle}
            </h4>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-white/20 text-white text-xs"
                >
                  {paperInfo.subject}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>{paperInfo.examBoard}</span>
                <span>•</span>
                <span>{paperInfo.year}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="text-gray-300">
                {questions.length} questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="text-gray-300">{totalMarks} marks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Questions Answered</span>
              <span className="text-white font-medium">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Marks Attempted</span>
              <span className="text-white font-medium">
                {answeredMarks}/{totalMarks}
              </span>
            </div>
            <Progress
              value={(answeredMarks / totalMarks) * 100}
              className="h-2"
            />
          </div>

          {longQuestions.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-purple-400 font-medium text-sm">
                  Long Questions
                </span>
              </div>
              <p className="text-gray-300 text-xs">
                {longQuestions.length} questions with AI help available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Questions
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm">
            Click to jump to any question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {questions.map((question, index) => {
              const answer = answers[question.id] || '';
              const questionStatus = getQuestionStatus(question, answer);
              const Icon = questionStatus.icon;
              const isActive = activeQuestionId === question.id;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => onQuestionSelect(question.id)}
                    variant="outline"
                    className={`
                      w-full justify-start text-left h-auto p-3 transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : questionStatus.color
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-current text-current text-xs"
                          >
                            {question.marks}m
                          </Badge>
                          {question.topic && (
                            <span className="text-xs text-gray-400 truncate">
                              {question.topic}
                            </span>
                          )}
                          {isLongQuestion(question.marks) && (
                            <Sparkles className="h-3 w-3 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center p-2 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-green-300 font-medium">{answeredCount}</div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-yellow-300 font-medium">
                {questions.length - answeredCount}
              </div>
              <div className="text-gray-400">Remaining</div>
            </div>
          </div>

          {answeredCount > 0 && (
            <div className="text-center p-2 bg-blue-500/10 border border-blue-500/20 rounded">
              <div className="text-blue-300 font-medium">
                {Math.round(completionPercentage)}%
              </div>
              <div className="text-gray-400 text-xs">Complete</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
