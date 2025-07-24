'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Lightbulb, Zap, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIHelpDialog from './ai-help-dialog';

interface Question {
  id: string;
  question: string;
  marks: number;
  topic?: string;
  markScheme?: string;
}

interface AnswerSnippetProps {
  question: Question;
  questionNumber: number;
  answer: string;
  isActive: boolean;
  onAnswerChange: (answer: string) => void;
  onFocus: () => void;
}

const getDifficultyColor = (marks: number) => {
  if (marks <= 5) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (marks <= 15)
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
};

const isLongQuestion = (marks: number) => marks >= 10;

const getWordCountSuggestion = (marks: number) => {
  // Rough estimate: 25-30 words per mark
  return Math.round(marks * 27.5);
};

export default function AnswerSnippet({
  question,
  questionNumber,
  answer,
  isActive,
  onAnswerChange,
  onFocus,
}: AnswerSnippetProps) {
  const [showHint, setShowHint] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const wordCount = answer
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  const suggestedWords = getWordCountSuggestion(question.marks);
  const isLongQ = isLongQuestion(question.marks);
  const hasAnswer = answer.trim().length > 0;

  const getWordCountColor = () => {
    const ratio = wordCount / suggestedWords;
    if (ratio < 0.5) return 'text-red-400';
    if (ratio < 0.8) return 'text-yellow-400';
    if (ratio > 1.5) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`transition-all duration-300 ${
        isActive
          ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-gray-900'
          : ''
      }`}
    >
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/[0.07] transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                    hasAnswer
                      ? 'bg-green-500/20 border-green-500/50 text-green-300'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  {hasAnswer ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    questionNumber
                  )}
                </div>
                <CardTitle className="text-white text-lg">
                  Question {questionNumber}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {question.topic && (
                <Badge
                  variant="outline"
                  className="border-white/20 text-white text-xs"
                >
                  {question.topic}
                </Badge>
              )}
              <Badge className={getDifficultyColor(question.marks)}>
                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
              </Badge>
              {isLongQ && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Long Answer
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 cursor-pointer" onClick={onFocus}>
          {/* Question Text */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <p className="text-white whitespace-pre-wrap text-base leading-relaxed">
              {question.question}
            </p>
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white font-medium text-sm">
                Your Answer:
              </label>
              <div className="flex items-center gap-2">
                {isLongQ && (
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      setShowAIHelp(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI Help
                  </Button>
                )}
                {question.markScheme && (
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      setShowHint(!showHint);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 text-xs"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Hint
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              value={answer}
              onChange={e => onAnswerChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Type your answer here..."
              className={`min-h-[120px] bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 resize-y transition-all duration-200 ${
                isActive
                  ? 'border-blue-500/50 focus:border-blue-500'
                  : 'focus:border-white/20'
              }`}
              rows={isLongQ ? 8 : 5}
            />

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">
                  {answer.length} characters
                </span>
                <span className={`${getWordCountColor()} font-medium`}>
                  {wordCount} words
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Target className="h-3 w-3" />
                <span>Suggested: ~{suggestedWords} words</span>
              </div>
            </div>
          </div>

          {/* Mark Scheme Hint */}
          {showHint && question.markScheme && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium text-sm">
                  Mark Scheme Guide
                </span>
              </div>
              <p className="text-gray-300 text-sm">{question.markScheme}</p>
            </motion.div>
          )}

          {/* Answer Status */}
          {hasAnswer && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Answer provided</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Help Dialog */}
      <AnimatePresence>
        {showAIHelp && (
          <AIHelpDialog
            question={question}
            questionNumber={questionNumber}
            currentAnswer={answer}
            onClose={() => setShowAIHelp(false)}
            onApplySuggestion={onAnswerChange}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
