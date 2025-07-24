'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface SubjectSelectionProps {
  subjects: string[];
  examBoards: Record<string, string>;
  onSubjectsChange: (subjects: string[]) => void;
  onExamBoardsChange: (examBoards: Record<string, string>) => void;
}

const availableSubjects = [
  'Mathematics',
  'English Language',
  'English Literature',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Computer Science',
  'Psychology',
  'Sociology',
  'Economics',
  'Business Studies',
  'Art & Design',
  'Music',
  'Physical Education',
  'Religious Studies',
  'Modern Foreign Languages',
  'Design & Technology',
  'Drama',
];

const examBoards: Record<string, string[]> = {
  Mathematics: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'English Language': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'English Literature': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Biology: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Chemistry: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Physics: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  History: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Geography: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Computer Science': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Psychology: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Sociology: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Economics: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Business Studies': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Art & Design': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Music: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Physical Education': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Religious Studies': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Modern Foreign Languages': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  'Design & Technology': ['AQA', 'Edexcel', 'OCR', 'WJEC'],
  Drama: ['AQA', 'Edexcel', 'OCR', 'WJEC'],
};

export function SubjectSelection({
  subjects,
  examBoards: selectedExamBoards,
  onSubjectsChange,
  onExamBoardsChange,
}: SubjectSelectionProps) {
  const [selectedSubject, setSelectedSubject] = useState('');

  const addSubject = () => {
    if (selectedSubject && !subjects.includes(selectedSubject)) {
      onSubjectsChange([...subjects, selectedSubject]);
      setSelectedSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    onSubjectsChange(subjects.filter(s => s !== subject));
    const newExamBoards = { ...selectedExamBoards };
    delete newExamBoards[subject];
    onExamBoardsChange(newExamBoards);
  };

  const updateExamBoard = (subject: string, examBoard: string) => {
    onExamBoardsChange({
      ...selectedExamBoards,
      [subject]: examBoard,
    });
  };

  const availableToAdd = availableSubjects.filter(
    subject => !subjects.includes(subject)
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          What subjects are you studying?
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Select your subjects and their exam boards for personalized content
        </p>
      </div>

      {/* Add Subject Section */}
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add a subject
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addSubject}
              disabled={!selectedSubject}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Subjects */}
      {subjects.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Your Subjects ({subjects.length})
          </h4>
          <div className="grid gap-4">
            {subjects.map(subject => (
              <Card
                key={subject}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="font-medium">
                          {subject}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubject(subject)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                          Exam Board:
                        </label>
                        <Select
                          value={selectedExamBoards[subject] || ''}
                          onValueChange={value =>
                            updateExamBoard(subject, value)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select exam board..." />
                          </SelectTrigger>
                          <SelectContent>
                            {examBoards[subject]?.map(board => (
                              <SelectItem key={board} value={board}>
                                {board}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {subjects.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No subjects selected yet. Add your first subject above!</p>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">⚡</span>
          </div>
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100">
              Exam Board Matters
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
              Different exam boards have different specifications and marking
              criteria. Selecting the correct exam board ensures you get the
              most accurate and relevant feedback for your studies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
