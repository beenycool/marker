'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OnboardingData } from './onboarding-flow';
import { CheckCircle, Sparkles, Rocket, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompletionStepProps {
  onboardingData: OnboardingData;
}

export function CompletionStep({ onboardingData }: CompletionStepProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();

  const completeOnboarding = async () => {
    setIsCompleting(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setIsCompleting(false);
      }
    } catch (error) {
      setIsCompleting(false);
    }
  };

  const getYearGroupLabel = (yearGroup: string) => {
    const labels: Record<string, string> = {
      'year-7': 'Year 7',
      'year-8': 'Year 8',
      'year-9': 'Year 9',
      'year-10': 'Year 10',
      'year-11': 'Year 11',
      'year-12': 'Year 12',
      'year-13': 'Year 13',
      university: 'University',
    };
    return labels[yearGroup] || yearGroup;
  };

  const getStudyTimeLabel = (time: string) => {
    const labels: Record<string, string> = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
      flexible: 'Flexible',
    };
    return labels[time] || time;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Perfect! You're all set! 🎉
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          We've created your personalized learning profile. Here's what we've
          set up for you:
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-6">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Your Learning Profile
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Academic Info
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Year Group:
                  </span>
                  <span className="font-medium">
                    {getYearGroupLabel(onboardingData.yearGroup)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Subjects:
                  </span>
                  <span className="font-medium">
                    {onboardingData.subjects.length} selected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Study Time:
                  </span>
                  <span className="font-medium">
                    {getStudyTimeLabel(onboardingData.preferredStudyTime)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Your Subjects
              </h5>
              <div className="flex flex-wrap gap-1">
                {onboardingData.subjects.slice(0, 3).map((subject, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full"
                  >
                    {subject}
                  </span>
                ))}
                {onboardingData.subjects.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    +{onboardingData.subjects.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📚</span>
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Personalized Dashboard
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your dashboard is customized with relevant content for your
              subjects and year group
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🤖</span>
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              AI Marking Ready
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI feedback will be tailored to your exam boards and difficulty
              level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Goal-Focused Learning
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We'll suggest practice questions aligned with your study goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Complete Button */}
      <div className="text-center pt-4">
        <Button
          onClick={completeOnboarding}
          disabled={isCompleting}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold"
        >
          {isCompleting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Setting up your account...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Start Learning with AIMarker
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          You can always update these preferences later in your settings
        </p>
      </div>
    </div>
  );
}
