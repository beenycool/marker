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
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Target,
  Lightbulb,
  Brain,
  Copy,
  Share2,
  ThumbsUp,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FeedbackDisplayProps {
  feedback: {
    success: boolean;
    submission: {
      id: string;
      createdAt: string;
    };
    feedback: {
      id: string;
      score: number;
      grade: string;
      aosMet: string[];
      improvementSuggestions: string[];
      aiResponse: string;
      modelUsed: string;
      confidenceScore?: number;
    };
    originalAnswer?: string;
    originalQuestion?: string;
    usage: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const { feedback: feedbackData } = feedback;
  const percentage = (feedbackData.score / 20) * 100; // Assuming 20 marks default
  const [clarifications, setClarifications] = useState<{ [key: number]: string }>({});
  const [loadingClarifications, setLoadingClarifications] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '9':
        return 'bg-green-500';
      case '8':
        return 'bg-green-400';
      case '7':
        return 'bg-blue-500';
      case '6':
        return 'bg-cyan-500';
      case '5':
        return 'bg-yellow-500';
      case '4':
        return 'bg-orange-400';
      case '3':
        return 'bg-orange-500';
      case '2':
        return 'bg-red-400';
      case '1':
        return 'bg-red-500';
      case 'U':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGradeIcon = (grade: string) => {
    if (['9', '8'].includes(grade)) return <CheckCircle className="h-4 w-4" />;
    if (['7', '6', '5', '4'].includes(grade))
      return <AlertCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getClarification = async (suggestionIndex: number, suggestion: string) => {
    if (clarifications[suggestionIndex] || loadingClarifications[suggestionIndex]) {
      return;
    }

    if (!feedback.originalAnswer) {
      toast({
        title: 'Unable to clarify',
        description: 'Original answer not available for clarification',
        variant: 'destructive',
      });
      return;
    }

    setLoadingClarifications(prev => ({ ...prev, [suggestionIndex]: true }));

    try {
      const response = await fetch('/api/feedback/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAnswer: feedback.originalAnswer,
          improvementSuggestion: suggestion,
          promptVersion: 'brutal-examiner-v1.2',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get clarification');
      }

      const data = await response.json();
      
      if (data.success) {
        setClarifications(prev => ({ 
          ...prev, 
          [suggestionIndex]: data.clarification 
        }));
      } else {
        throw new Error(data.error || 'Failed to get clarification');
      }
    } catch (error) {
      console.error('Clarification error:', error);
      toast({
        title: 'Clarification failed',
        description: 'Unable to get additional explanation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingClarifications(prev => ({ ...prev, [suggestionIndex]: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Score Overview */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Results
            </CardTitle>
            <Badge
              className={`${getGradeColor(feedbackData.grade)} text-white`}
            >
              {getGradeIcon(feedbackData.grade)}
              <span className="ml-1">Grade {feedbackData.grade}</span>
            </Badge>
          </div>
          <CardDescription className="text-gray-300">
            Marked by {feedbackData.modelUsed} •{' '}
            {new Date(feedback.submission.createdAt).toLocaleDateString()}
            {feedbackData.confidenceScore && (
              <span className="ml-2">
                • Confidence: {feedbackData.confidenceScore}/10
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Score</span>
              <span className="text-2xl font-bold text-white">
                {feedbackData.score}/20
              </span>
            </div>
            {feedbackData.confidenceScore && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-gray-400">
                    {feedbackData.confidenceScore}/10
                  </span>
                </div>
                <Progress
                  value={feedbackData.confidenceScore * 10}
                  className="h-2"
                />
              </div>
            )}
            <Progress value={percentage} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Performance</span>
              <span className="text-gray-400">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Objectives */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Assessment Objectives Met
          </CardTitle>
          <CardDescription className="text-gray-300">
            Key skills and knowledge demonstrated in your answer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {feedbackData.aosMet.length > 0 ? (
              feedbackData.aosMet.map((ao, index) => (
                <motion.div
                  key={ao}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {ao}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400">
                No assessment objectives identified
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            How to Improve
          </CardTitle>
          <CardDescription className="text-gray-300">
            Specific suggestions to enhance your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedbackData.improvementSuggestions.length > 0 ? (
              feedbackData.improvementSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm mb-2">{suggestion}</p>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => getClarification(index, suggestion)}
                              disabled={loadingClarifications[index]}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                            >
                              {loadingClarifications[index] ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Getting explanation...
                                </>
                              ) : (
                                <>
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  Explain further
                                </>
                              )}
                            </Button>
                          </DialogTrigger>
                          {clarifications[index] && (
                            <DialogContent className="bg-gray-900 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  Detailed Explanation
                                </DialogTitle>
                                <DialogDescription className="text-gray-300">
                                  Here's a more detailed explanation of this improvement suggestion
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <div className="bg-gray-800 p-4 rounded-lg">
                                  <div className="prose prose-invert prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                                      {clarifications[index]}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400">No specific suggestions provided</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Detailed Feedback
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(feedbackData.aiResponse)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <CardDescription className="text-gray-300">
            Comprehensive analysis of your work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                {feedbackData.aiResponse}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-blue-600 text-white">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Submit Another
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
