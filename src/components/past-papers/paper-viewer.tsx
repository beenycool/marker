'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  duration: number;
  totalMarks: number;
}

interface PaperViewerProps {
  paper: PastPaper;
  onComplete: (answers: Record<string, string>) => void;
  onExit: () => void;
}

export function PaperViewer({ paper, onComplete, onExit }: PaperViewerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(paper.duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(() => {
    setIsRunning(false);
    onComplete(answers);
  }, [answers, onComplete]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            toast({
              title: "Time's up!",
              description: 'Your paper has been automatically submitted.',
              variant: 'destructive',
            });
            handleSubmit();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleSubmit, toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = timeLeft / (paper.duration * 60);
    if (percentage > 0.5) return 'text-green-400';
    if (percentage > 0.25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < paper.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    const question = paper.questions[index];
    const hasAnswer = answers[question.id]?.trim().length > 0;
    const isCurrent = index === currentQuestion;

    if (isCurrent) return 'current';
    if (hasAnswer) return 'completed';
    return 'unanswered';
  };

  const getAnsweredCount = () => {
    return paper.questions.filter(q => answers[q.id]?.trim().length > 0).length;
  };

  const progress = (getAnsweredCount() / paper.questions.length) * 100;
  const currentQ = paper.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{paper.title}</h1>
              <p className="text-gray-300 text-sm">
                {paper.subject} • {paper.examBoard} • {paper.year}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Timer className={`h-5 w-5 ${getTimeColor()}`} />
                <span className={`text-lg font-mono ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Timer controls */}
              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <Button
                    onClick={() => setIsRunning(true)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsRunning(false)}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Submit
                </Button>

                <Button
                  onClick={onExit}
                  size="sm"
                  variant="outline"
                  className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">
                Question {currentQuestion + 1} of {paper.questions.length}
              </span>
              <span className="text-gray-300 text-sm">
                {getAnsweredCount()} of {paper.questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
                  {paper.questions.map((question, index) => {
                    const status = getQuestionStatus(index);
                    return (
                      <Button
                        key={question.id}
                        onClick={() => setCurrentQuestion(index)}
                        variant="outline"
                        size="sm"
                        className={`
                          ${
                            status === 'current'
                              ? 'bg-blue-500 text-white border-blue-500'
                              : status === 'completed'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'border-white/20 text-white hover:bg-white/10'
                          }
                        `}
                      >
                        {index + 1}
                        {status === 'completed' && (
                          <CheckCircle className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          Question {currentQuestion + 1}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {currentQ.marks} marks
                          </Badge>
                          {currentQ.topic && (
                            <Badge
                              variant="outline"
                              className="border-white/20 text-white"
                            >
                              {currentQ.topic}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={prevQuestion}
                          disabled={currentQuestion === 0}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          disabled={
                            currentQuestion === paper.questions.length - 1
                          }
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Question Text */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-white whitespace-pre-wrap text-lg leading-relaxed">
                        {currentQ.question}
                      </p>
                    </div>

                    {/* Answer Input */}
                    <div className="space-y-2">
                      <label className="text-white font-medium">
                        Your Answer:
                      </label>
                      <Textarea
                        value={answers[currentQ.id] || ''}
                        onChange={e =>
                          handleAnswerChange(currentQ.id, e.target.value)
                        }
                        placeholder="Type your answer here..."
                        className="min-h-[200px] bg-gray-800/50 border-white/10 text-white placeholder-gray-400 resize-y"
                        rows={10}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {answers[currentQ.id]?.length || 0} characters
                        </span>
                        <span className="text-gray-400">
                          Suggested: ~{currentQ.marks * 25} words
                        </span>
                      </div>
                    </div>

                    {/* Mark Scheme Hint */}
                    {currentQ.markScheme && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">
                            Mark Scheme Guide
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          {currentQ.markScheme}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Dialog */}
        {showSubmitDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-white/10 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white">Submit Paper?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-gray-300">
                    Are you sure you want to submit your paper?
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Questions answered:</span>
                      <span className="text-white">
                        {getAnsweredCount()}/{paper.questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time remaining:</span>
                      <span className={getTimeColor()}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowSubmitDialog(false)}
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Submit & Mark
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
