'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useMarkSubmission, useMarkingInfo } from '@/hooks/use-marking';
import { FeedbackDisplay } from '@/components/marking/feedback-display';
import { UsageDisplay } from '@/components/marking/usage-display';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Brain } from 'lucide-react';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';

const markingFormSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(5, 'Answer must be at least 5 characters'),
  markScheme: z.string().optional(),
  marksTotal: z.number().min(1).max(100).optional(),
  subject: z.string().optional(),
  examBoard: z.string().optional(),
  preferredProvider: z.string().optional(),
});

type MarkingFormData = z.infer<typeof markingFormSchema>;

const subjects = [
  'English Literature',
  'English Language',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'French',
  'Spanish',
  'German',
  'Art & Design',
  'Computer Science',
  'Business Studies',
  'Economics',
  'Psychology',
  'Sociology',
  'Religious Studies',
  'Physical Education',
  'Music',
  'Drama',
  'Other',
];

const examBoards = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'CCEA', 'Other'];

export function MarkingForm() {
  const [feedback, setFeedback] = useState<any>(null);
  const [isMarking, setIsMarking] = useState(false);
  const { data: markingInfo, isLoading: infoLoading } = useMarkingInfo();
  const markSubmission = useMarkSubmission();
  const { toast } = useToast();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const isPro = markingInfo?.userTier === 'PRO';

  useEffect(() => {
    if (!isPro && markingInfo?.usage && !markingInfo.usage.canUse) {
      setShowUpgradePrompt(true);
    }
  }, [markingInfo, isPro]);

  const form = useForm<MarkingFormData>({
    resolver: zodResolver(markingFormSchema),
    defaultValues: {
      question: '',
      answer: '',
      markScheme: '',
      marksTotal: 20,
      subject: '',
      examBoard: '',
      preferredProvider: '',
    },
  });

  const onSubmit = async (data: MarkingFormData) => {
    try {
      // Optimistic update: show marking in progress state immediately
      setIsMarking(true);

      // Reset form immediately to allow new submissions
      form.reset();

      // Call the API in the background
      const result = await markSubmission.mutateAsync({
        question: data.question,
        answer: data.answer,
        markScheme: data.markScheme || undefined,
        marksTotal: data.marksTotal || undefined,
        subject: data.subject || undefined,
        examBoard: data.examBoard || undefined,
      });

      // Update feedback when API call completes
      setFeedback(result);
      setIsMarking(false);

      toast({
        title: 'Feedback Generated! 🎉',
        description: `Your work has been marked. Score: ${result.feedback.score}/20 (${result.feedback.grade})`,
        variant: 'default',
      });
    } catch (error) {
      setIsMarking(false);
      toast({
        title: 'Marking Failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const canSubmit = (markingInfo?.usage?.canUse || isPro) && !isMarking;

  if (infoLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        context="limit_reached"
        currentUsage={markingInfo?.usage?.used}
        limit={markingInfo?.usage?.limit}
        onClose={() => setShowUpgradePrompt(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Usage Display */}
      <UsageDisplay usage={markingInfo?.usage} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marking Form */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader id="marking-form">
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Submit Your Work
            </CardTitle>
            <CardDescription className="text-gray-300">
              Paste your GCSE question and answer to get instant AI feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Question *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Paste your GCSE question here..."
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                          aria-describedby="question-description"
                        />
                      </FormControl>
                      <FormDescription
                        id="question-description"
                        className="text-gray-400 text-sm"
                      >
                        Enter the full question you're answering
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Your Answer *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Type or paste your answer here..."
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
                          aria-describedby="answer-description"
                        />
                      </FormControl>
                      <FormDescription
                        id="answer-description"
                        className="text-gray-400 text-sm"
                      >
                        Type or paste your complete answer to the question
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Subject</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="examBoard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Exam Board</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select exam board" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {examBoards.map(board => (
                              <SelectItem key={board} value={board}>
                                {board}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marksTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Total Marks
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="100"
                            onChange={e =>
                              field.onChange(
                                parseInt(e.target.value) || undefined
                              )
                            }
                            className="bg-white/10 border-white/20 text-white"
                            aria-describedby="marks-description"
                          />
                        </FormControl>
                        <FormDescription
                          id="marks-description"
                          className="text-gray-400 text-sm"
                        >
                          Maximum marks available for this question
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {markingInfo?.userTier === 'PRO' &&
                    markingInfo?.providers?.length > 1 && (
                      <FormField
                        control={form.control}
                        name="preferredProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              AI Model
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue placeholder="Auto-select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Auto-select</SelectItem>
                                {markingInfo.providers.map(provider => (
                                  <SelectItem
                                    key={provider.name}
                                    value={provider.name}
                                  >
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                </div>

                <FormField
                  control={form.control}
                  name="markScheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Mark Scheme (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Paste the mark scheme if available..."
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                          aria-describedby="mark-scheme-description"
                        />
                      </FormControl>
                      <FormDescription
                        id="mark-scheme-description"
                        className="text-gray-400 text-sm"
                      >
                        Providing a mark scheme helps improve marking accuracy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-blue-600 text-white"
                >
                  {isMarking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking in progress...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Get AI Feedback
                    </>
                  )}
                </Button>

                {!canSubmit && markingInfo?.usage && !isPro && (
                  <p className="text-sm text-red-400 text-center">
                    Daily limit reached ({markingInfo.usage.used}/
                    {markingInfo.usage.limit}).{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-red-400"
                      onClick={() => setShowUpgradePrompt(true)}
                    >
                      Upgrade to Pro
                    </Button>
                    {' for unlimited marking.'}
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Feedback Display */}
        {feedback && <FeedbackDisplay feedback={feedback} />}
        {isMarking && !feedback && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Marking in Progress
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your work is being reviewed by our AI. This usually takes a few
                seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">
                    Analyzing your answer
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Comparing to mark scheme
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Generating feedback
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
