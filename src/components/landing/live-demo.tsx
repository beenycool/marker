'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  CheckCircle,
  Brain,
  Award,
  Target,
  Lightbulb,
  Copy,
  BookOpen,
} from 'lucide-react';

const demoData = {
  question:
    'Explain how natural selection leads to evolution. Use an example to support your answer.',
  studentAnswer:
    'Natural selection is when organisms with better traits survive and reproduce more. For example, peppered moths in England became darker during the Industrial Revolution because the dark moths could hide better on polluted trees. The light moths were eaten by birds. Over time, more dark moths survived and had babies, so the population became mostly dark moths. This shows evolution because the moth population changed over generations.',
  subject: 'Biology',
  examBoard: 'AQA',
  marksTotal: 10,
  aiAnalysis: {
    score: 8,
    maxScore: 10,
    grade: 'A',
    aosMet: ['AO1', 'AO2', 'AO3'],
    improvementSuggestions: [
      'Could explain genetic basis of traits',
      'Add more detail about reproductive success',
      'Mention role of variation in populations',
    ],
    aiResponse:
      'Strong answer demonstrating good understanding of natural selection. The peppered moth example is well-chosen and accurately described. You correctly identify the key stages: variation, selection pressure, differential survival, and inheritance. To improve, consider explaining how traits are passed genetically and emphasize the role of variation in populations.',
    modelUsed: 'Claude 3.5 Sonnet',
  },
};

export function LiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A*':
        return 'bg-green-500';
      case 'A':
        return 'bg-green-400';
      case 'B':
        return 'bg-blue-500';
      case 'C':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-orange-500';
      case 'E':
        return 'bg-red-400';
      default:
        return 'bg-red-500';
    }
  };

  const steps = ['Question & Answer', 'AI Analysis', 'Results & Feedback'];

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentStep === 0) {
        setCurrentStep(1);
        setIsAnalyzing(true);
      } else if (currentStep === 1 && isAnalyzing) {
        setTimeout(() => {
          setIsAnalyzing(false);
          setCurrentStep(2);
          setShowResults(true);
        }, 3000);
      } else if (currentStep === 2) {
        setTimeout(() => {
          setCurrentStep(0);
          setShowResults(false);
        }, 12000);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [currentStep, isAnalyzing]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-blue-400" />
            Live AI Marking Demo
          </CardTitle>
          <div className="flex gap-2 mt-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep
                      ? 'bg-blue-400'
                      : index < currentStep
                        ? 'bg-green-400'
                        : 'bg-gray-600'
                  }`}
                />
                <span
                  className={`text-xs ${
                    index === currentStep
                      ? 'text-blue-400'
                      : index < currentStep
                        ? 'text-green-400'
                        : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {demoData.subject} Question
                  </h4>
                  <p className="text-sm text-gray-300">{demoData.question}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400/50 text-xs"
                    >
                      {demoData.examBoard}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400/50 text-xs"
                    >
                      {demoData.marksTotal} marks
                    </Badge>
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">
                    Student Answer
                  </h4>
                  <p className="text-sm text-gray-300">
                    {demoData.studentAnswer}
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                </div>
                <h4 className="font-semibold text-blue-400 mb-2">
                  AI Analysis in Progress
                </h4>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Analyzing content structure</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Checking assessment objectives</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Evaluating against mark scheme</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Brain className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span>
                      Generating feedback with {demoData.aiAnalysis.modelUsed}
                      ...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && showResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Score Overview */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-green-400">
                          {demoData.aiAnalysis.score}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-400">
                          Grade: {demoData.aiAnalysis.grade}
                        </p>
                        <p className="text-sm text-gray-400">
                          {demoData.aiAnalysis.score}/
                          {demoData.aiAnalysis.maxScore} marks
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getGradeColor(demoData.aiAnalysis.grade)}/20 text-green-400`}
                    >
                      <Award className="h-3 w-3 mr-1" />
                      Grade {demoData.aiAnalysis.grade}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${(demoData.aiAnalysis.score / demoData.aiAnalysis.maxScore) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400">Performance</span>
                    <span className="text-gray-400">
                      {(
                        (demoData.aiAnalysis.score /
                          demoData.aiAnalysis.maxScore) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>

                {/* Assessment Objectives */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Assessment Objectives Met
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {demoData.aiAnalysis.aosMet.map((ao, index) => (
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
                    ))}
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    How to Improve
                  </h4>
                  <div className="space-y-2">
                    {demoData.aiAnalysis.improvementSuggestions
                      .slice(0, 2)
                      .map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20"
                        >
                          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-300 text-sm">{suggestion}</p>
                        </motion.div>
                      ))}
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Detailed Feedback
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          demoData.aiAnalysis.aiResponse
                        )
                      }
                      className="border-white/20 text-white hover:bg-white/10 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {demoData.aiAnalysis.aiResponse}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Marked by {demoData.aiAnalysis.modelUsed}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
