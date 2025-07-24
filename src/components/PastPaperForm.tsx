'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface PastPaperFormProps {
  pastPaper: PastPaper;
  totalMarks: number;
}

export default function PastPaperForm({
  pastPaper,
  totalMarks,
}: PastPaperFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const router = useRouter();

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer.trim().length > 0)
      .length;
  };

  const getCompletionPercentage = () => {
    return (getAnsweredCount() / pastPaper.questions.length) * 100;
  };

  const getDifficultyColor = (marks: number) => {
    if (marks <= 5) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (marks <= 15)
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  const handleSubmit = async () => {
    if (getAnsweredCount() === 0) {
      toast.error('Please answer at least one question before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/past-papers/${pastPaper.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent: Math.round((Date.now() - startTime) / 1000), // in seconds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit past paper');
      }

      const data = await response.json();

      toast.success('Past paper submitted successfully!');

      // Redirect to mark the submission
      router.push(`/mark?submission=${data.submission.id}`);
    } catch (error) {
      toast.error('Failed to submit past paper. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Questions Answered</span>
            <span>
              {getAnsweredCount()} / {pastPaper.questions.length}
            </span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total Marks Available</span>
            <span>{totalMarks} marks</span>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {pastPaper.questions.map((question, index) => (
          <Card
            key={question.id}
            className="bg-white/5 backdrop-blur-sm border-white/10"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">
                  Question {index + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {question.topic && (
                    <Badge
                      variant="outline"
                      className="border-white/20 text-white"
                    >
                      {question.topic}
                    </Badge>
                  )}
                  <Badge className={getDifficultyColor(question.marks)}>
                    {question.marks} marks
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-300 whitespace-pre-wrap">
                {question.question}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Your Answer:</label>
                <Textarea
                  value={answers[question.id] || ''}
                  onChange={e =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  placeholder="Enter your answer here..."
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
                />
              </div>

              {answers[question.id] && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Answer provided
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Section */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Past Paper
          </CardTitle>
          <CardDescription className="text-gray-300">
            {getAnsweredCount() === pastPaper.questions.length
              ? 'All questions answered. Ready to submit!'
              : `${pastPaper.questions.length - getAnsweredCount()} questions remaining`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              <p>
                Your answers will be automatically marked and you'll receive
                detailed feedback.
              </p>
              <p>
                You can review your submission and feedback after submitting.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Past Paper
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
