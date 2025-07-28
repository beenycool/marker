'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AIFeedbackWidgetProps {
  submissionId: string;
  feedbackId: string;
  promptVersion?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
}

export function AIFeedbackWidget({
  submissionId,
  feedbackId,
  promptVersion,
  onFeedbackSubmitted,
}: AIFeedbackWidgetProps) {
  const [rating, setRating] = useState<'helpful' | 'not_helpful' | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleRating = async (newRating: 'helpful' | 'not_helpful') => {
    if (submitted) return;

    setRating(newRating);

    // If rating as not helpful, show comment box
    if (newRating === 'not_helpful') {
      setShowComment(true);
    } else {
      // Submit immediately for helpful ratings
      await submitFeedback(newRating, '');
    }
  };

  const submitFeedback = async (
    feedbackRating: string,
    feedbackComment: string
  ) => {
    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback/ai-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          feedbackId,
          rating: feedbackRating,
          comment: feedbackComment,
          promptVersion,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      setSubmitted(true);
      setShowComment(false);

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve AI marking quality.',
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(result);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit AI feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    await submitFeedback(rating!, comment);
  };

  if (submitted) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <ThumbsUp className="h-4 w-4" />
            <span>Thank you for your feedback!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {!showComment ? (
            <>
              <p className="text-gray-300 text-sm">
                Was this AI feedback helpful?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRating('helpful')}
                  disabled={submitting}
                  className={`border-green-500/30 text-green-400 hover:bg-green-500/10 ${
                    rating === 'helpful' ? 'bg-green-500/20' : ''
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRating('not_helpful')}
                  disabled={submitting}
                  className={`border-red-500/30 text-red-400 hover:bg-red-500/10 ${
                    rating === 'not_helpful' ? 'bg-red-500/20' : ''
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Not Helpful
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>What could we improve?</span>
              </div>
              <Textarea
                placeholder="Tell us what was wrong or how we could improve the feedback..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComment(false)}
                  disabled={submitting}
                  className="border-gray-500/30 text-gray-400"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
