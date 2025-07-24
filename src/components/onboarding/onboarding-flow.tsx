'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { YearSelection } from './year-selection';
import { SubjectSelection } from './subject-selection';
import { StudyGoalsSelection } from './study-goals-selection';
import { CompletionStep } from './completion-step';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface OnboardingData {
  yearGroup: string;
  subjects: string[];
  examBoards: Record<string, string>;
  studyGoals: string[];
  preferredStudyTime: string;
}

const steps = [
  {
    id: 'year',
    title: 'Academic Year',
    description: 'Select your current year group',
  },
  {
    id: 'subjects',
    title: 'Subjects & Exam Boards',
    description: 'Choose your subjects and exam boards',
  },
  {
    id: 'goals',
    title: 'Study Goals',
    description: 'Tell us about your learning objectives',
  },
  { id: 'complete', title: 'All Set!', description: 'Your profile is ready' },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    yearGroup: '',
    subjects: [],
    examBoards: {},
    studyGoals: [],
    preferredStudyTime: '',
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!onboardingData.yearGroup;
      case 1:
        return (
          onboardingData.subjects.length > 0 &&
          onboardingData.subjects.every(
            subject => onboardingData.examBoards[subject]
          )
        );
      case 2:
        return onboardingData.studyGoals.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to AIMarker! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Let's personalize your learning experience
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        <Progress value={progress} className="w-full h-2" />

        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center px-2 ${
                index <= currentStep ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? 'bg-primary text-white'
                    : index === currentStep
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <p className="text-xs font-medium">{step.title}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col">
          <div className="flex-1">
            {currentStep === 0 && (
              <YearSelection
                value={onboardingData.yearGroup}
                onChange={value => updateData('yearGroup', value)}
              />
            )}
            {currentStep === 1 && (
              <SubjectSelection
                subjects={onboardingData.subjects}
                examBoards={onboardingData.examBoards}
                onSubjectsChange={value => updateData('subjects', value)}
                onExamBoardsChange={value => updateData('examBoards', value)}
              />
            )}
            {currentStep === 2 && (
              <StudyGoalsSelection
                studyGoals={onboardingData.studyGoals}
                preferredStudyTime={onboardingData.preferredStudyTime}
                onStudyGoalsChange={value => updateData('studyGoals', value)}
                onPreferredStudyTimeChange={value =>
                  updateData('preferredStudyTime', value)
                }
              />
            )}
            {currentStep === 3 && (
              <CompletionStep onboardingData={onboardingData} />
            )}
          </div>

          {currentStep < steps.length - 1 && (
            <div className="flex justify-between pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
