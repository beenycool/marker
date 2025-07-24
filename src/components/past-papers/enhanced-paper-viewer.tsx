'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Send,
  Loader2,
  Timer,
  Play,
  Pause,
  Save,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnswerSnippet from './answer-snippet';
import QuestionNavigation from './question-navigation';

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

interface EnhancedPaperViewerProps {
  paper: PastPaper;
  totalMarks: number;
  onBack: () => void;
  onSubmit: (answers: Record<string, string>, timeSpent: number) => void;
}

export default function EnhancedPaperViewer({
  paper,
  totalMarks,
  onBack,
  onSubmit,
}: EnhancedPaperViewerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    paper.questions[0]?.id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const { toast } = useToast();

  const questionRefs = useRef<Record<string, HTMLDivElement>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 5000);

    return () => clearTimeout(saveTimer);
  }, [answers]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleQuestionSelect = (questionId: string) => {
    setActiveQuestionId(questionId);
    // Scroll to question
    const element = questionRefs.current[questionId];
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuestionFocus = (questionId: string) => {
    setActiveQuestionId(questionId);
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer.trim().length > 0)
      .length;
  };

  const getCompletionPercentage = () => {
    return (getAnsweredCount() / paper.questions.length) * 100;
  };

  const handleSubmit = async () => {
    if (getAnsweredCount() === 0) {
      toast({
        title: 'No answers provided',
        description: 'Please answer at least one question before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await onSubmit(answers, timeSpent);

      toast({
        title: 'Paper submitted successfully!',
        description:
          'Your answers have been submitted and will be marked automatically.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Failed to submit your paper. Please try again.',
        variant: 'destructive',
      });
      setIsTimerRunning(true);
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Papers
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{paper.title}</h1>
                <p className="text-gray-300 text-sm">
                  {paper.subject} • {paper.examBoard} • {paper.year}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-400" />
                <span className="text-white font-mono text-sm">
                  {formatTime(timeElapsed)}
                </span>
              </div>

              {/* Auto-save indicator */}
              {autoSaved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-green-400 text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Auto-saved</span>
                </motion.div>
              )}

              {/* Timer controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isTimerRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-blue-600 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Paper
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <QuestionNavigation
                questions={paper.questions}
                answers={answers}
                activeQuestionId={activeQuestionId}
                onQuestionSelect={handleQuestionSelect}
                totalMarks={totalMarks}
                paperTitle={paper.title}
                paperInfo={{
                  subject: paper.subject,
                  examBoard: paper.examBoard,
                  year: paper.year,
                }}
              />
            </div>
          </div>

          {/* Questions Content */}
          <div className="lg:col-span-3">
            <div ref={scrollContainerRef} className="space-y-6">
              {paper.questions.map((question, index) => (
                <div
                  key={question.id}
                  ref={el => {
                    if (el) questionRefs.current[question.id] = el;
                  }}
                >
                  <AnswerSnippet
                    question={question}
                    questionNumber={index + 1}
                    answer={answers[question.id] || ''}
                    isActive={activeQuestionId === question.id}
                    onAnswerChange={answer =>
                      handleAnswerChange(question.id, answer)
                    }
                    onFocus={() => handleQuestionFocus(question.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AnimatePresence>
        {showSubmitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <Card className="bg-gray-900 border-white/10 max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Submit Paper?
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Are you sure you want to submit your paper for marking?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Questions answered:</span>
                      <span className="text-white">
                        {getAnsweredCount()}/{paper.questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time spent:</span>
                      <span className="text-white">
                        {formatTime(timeElapsed)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completion:</span>
                      <span className="text-white">
                        {Math.round(getCompletionPercentage())}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowSubmitDialog(false)}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Submit & Mark
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
