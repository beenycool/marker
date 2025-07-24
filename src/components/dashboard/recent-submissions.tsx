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
import { Clock, FileText, Award, BookOpen, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentSubmissionsProps {
  submissions: Array<{
    id: string;
    question: string;
    subject: string | null;
    examBoard: string | null;
    createdAt: string;
    score: number;
    grade: string;
  }>;
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export function RecentSubmissions({
  submissions,
  isLoading = false,
}: RecentSubmissionsProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '9':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case '8':
        return 'bg-green-400/20 text-green-300 border-green-400/30';
      case '7':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case '6':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case '5':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case '4':
        return 'bg-orange-400/20 text-orange-300 border-orange-400/30';
      case '3':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case '2':
        return 'bg-red-400/20 text-red-300 border-red-400/30';
      case '1':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'U':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex-shrink-0">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-gray-600" />
                      <Skeleton className="h-4 w-12" />
                    </div>

                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-gray-600" />
                      <Skeleton className="h-4 w-16" />
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Skeleton className="w-8 h-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your latest work submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No submissions yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start by submitting your first GCSE answer for AI feedback
            </p>
            <Button className="bg-blue-600 text-white">Submit Work</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Submissions
        </CardTitle>
        <CardDescription className="text-gray-300">
          Your latest work submissions and feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map(submission => (
            <div
              key={submission.id}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className="text-white font-medium truncate"
                    title={submission.question}
                  >
                    {submission.question}
                  </h4>
                  <Badge
                    className={getGradeColor(submission.grade)}
                    aria-label={`Grade: ${submission.grade}`}
                  >
                    {submission.grade}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div
                    className="flex items-center gap-1"
                    aria-label={`Score: ${submission.score} out of 20`}
                  >
                    <Award className="h-3 w-3" />
                    <span>{submission.score}/20</span>
                  </div>

                  {submission.subject && (
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Subject: ${submission.subject}`}
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>{submission.subject}</span>
                    </div>
                  )}

                  {submission.examBoard && (
                    <div className="flex items-center gap-1">
                      <span>{submission.examBoard}</span>
                    </div>
                  )}

                  <div
                    className="flex items-center gap-1"
                    aria-label={`Submitted ${formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(submission.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  aria-label="View submission details"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {submissions.length >= 10 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              View All Submissions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
