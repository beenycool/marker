'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, GraduationCap, Users } from 'lucide-react';

interface YearSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

const yearGroups = [
  {
    id: 'year-7',
    label: 'Year 7',
    description: 'Ages 11-12',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'year-8',
    label: 'Year 8',
    description: 'Ages 12-13',
    icon: BookOpen,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'year-9',
    label: 'Year 9',
    description: 'Ages 13-14',
    icon: BookOpen,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'year-10',
    label: 'Year 10',
    description: 'Ages 14-15 • GCSE Start',
    icon: Users,
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'year-11',
    label: 'Year 11',
    description: 'Ages 15-16 • GCSE Final',
    icon: Users,
    color: 'from-red-500 to-red-600',
  },
  {
    id: 'year-12',
    label: 'Year 12',
    description: 'Ages 16-17 • A-Level Start',
    icon: GraduationCap,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'year-13',
    label: 'Year 13',
    description: 'Ages 17-18 • A-Level Final',
    icon: GraduationCap,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'university',
    label: 'University',
    description: 'Higher Education',
    icon: GraduationCap,
    color: 'from-pink-500 to-pink-600',
  },
];

export function YearSelection({ value, onChange }: YearSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          What year group are you in?
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          This helps us tailor content and difficulty to your level
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yearGroups.map(year => {
          const Icon = year.icon;
          const isSelected = value === year.id;

          return (
            <Card
              key={year.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                  : 'hover:scale-[1.01]'
              }`}
              onClick={() => onChange(year.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${year.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {year.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {year.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">💡</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Why do we ask this?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              Your year group helps us provide age-appropriate content, suggest
              relevant exam preparation materials, and set appropriate
              difficulty levels for AI marking feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
