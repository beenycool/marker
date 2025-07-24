'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, BookOpen, Brain, Clock, Star } from 'lucide-react';

interface StudyGoalsSelectionProps {
  studyGoals: string[];
  preferredStudyTime: string;
  onStudyGoalsChange: (goals: string[]) => void;
  onPreferredStudyTimeChange: (time: string) => void;
}

const goalOptions = [
  {
    id: 'improve-grades',
    label: 'Improve My Grades',
    description: 'Get better marks in exams and assessments',
    icon: Trophy,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'exam-preparation',
    label: 'Exam Preparation',
    description: 'Prepare for upcoming GCSEs or A-Levels',
    icon: Target,
    color: 'from-red-500 to-red-600',
  },
  {
    id: 'understand-concepts',
    label: 'Better Understanding',
    description: 'Improve comprehension of difficult topics',
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'homework-help',
    label: 'Homework Support',
    description: 'Get help with assignments and coursework',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'revision-technique',
    label: 'Better Study Methods',
    description: 'Learn more effective revision techniques',
    icon: Star,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'time-management',
    label: 'Time Management',
    description: 'Organize study time more effectively',
    icon: Clock,
    color: 'from-indigo-500 to-indigo-600',
  },
];

const studyTimeOptions = [
  { value: 'morning', label: 'Morning (6am - 12pm)', emoji: '🌅' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)', emoji: '☀️' },
  { value: 'evening', label: 'Evening (6pm - 10pm)', emoji: '🌆' },
  { value: 'night', label: 'Night (10pm - 12am)', emoji: '🌙' },
  { value: 'flexible', label: 'Flexible / No preference', emoji: '🔄' },
];

export function StudyGoalsSelection({
  studyGoals,
  preferredStudyTime,
  onStudyGoalsChange,
  onPreferredStudyTimeChange,
}: StudyGoalsSelectionProps) {
  const toggleGoal = (goalId: string) => {
    if (studyGoals.includes(goalId)) {
      onStudyGoalsChange(studyGoals.filter(id => id !== goalId));
    } else {
      onStudyGoalsChange([...studyGoals, goalId]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          What are your study goals?
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Help us understand what you want to achieve so we can personalize your
          experience
        </p>
      </div>

      {/* Study Goals Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Select your learning objectives (choose any that apply):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalOptions.map(goal => {
            const Icon = goal.icon;
            const isSelected = studyGoals.includes(goal.id);

            return (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-primary shadow-md scale-[1.02]'
                    : 'hover:scale-[1.01]'
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${goal.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {goal.label}
                        </h5>
                        {isSelected && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selected Goals Display */}
      {studyGoals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Your Selected Goals:
          </h4>
          <div className="flex flex-wrap gap-2">
            {studyGoals.map(goalId => {
              const goal = goalOptions.find(g => g.id === goalId);
              return goal ? (
                <Badge key={goalId} variant="secondary" className="px-3 py-1">
                  {goal.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Study Time Preference */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          When do you prefer to study?
        </h4>
        <Select
          value={preferredStudyTime}
          onValueChange={onPreferredStudyTimeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your preferred study time..." />
          </SelectTrigger>
          <SelectContent>
            {studyTimeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">🎯</span>
          </div>
          <div>
            <h4 className="font-medium text-green-900 dark:text-green-100">
              Personalized Learning Path
            </h4>
            <p className="text-sm text-green-700 dark:text-green-200 mt-1">
              Based on your goals and preferences, we'll customize your
              dashboard, suggest relevant practice questions, and provide
              targeted feedback to help you achieve your objectives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
