'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Zap,
  Lightbulb,
  CheckCircle,
  Loader2,
  Copy,
  Sparkles,
  BookOpen,
  Target,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  marks: number;
  topic?: string;
  markScheme?: string;
}

interface AIHelpDialogProps {
  question: Question;
  questionNumber: number;
  currentAnswer: string;
  onClose: () => void;
  onApplySuggestion: (suggestion: string) => void;
}

// Mock AI responses for different question types
const generateAIHelp = (question: Question, currentAnswer: string) => {
  const suggestions = [
    {
      type: 'Structure',
      title: 'Answer Structure',
      content: `For a ${question.marks}-mark question, consider organizing your answer into ${Math.ceil(question.marks / 2)} main points. Each point should be well-developed with evidence or examples.`,
      icon: BookOpen,
    },
    {
      type: 'Key Points',
      title: 'Key Points to Cover',
      content: `Based on the question, make sure to address: 1) Direct answer to the question, 2) Supporting evidence or examples, 3) Analysis or explanation of significance${question.marks >= 15 ? ', 4) Evaluation or conclusion' : ''}.`,
      icon: Target,
    },
    {
      type: 'Improvement',
      title: 'Enhance Your Answer',
      content:
        currentAnswer.length > 0
          ? 'Your current answer is a good start. Consider adding more specific examples and deeper analysis to fully address all aspects of the question.'
          : 'Start by clearly stating your main argument or answer, then provide supporting evidence and analysis.',
      icon: Sparkles,
    },
  ];

  // Add subject-specific suggestions
  if (question.topic) {
    suggestions.push({
      type: 'Subject Focus',
      title: `${question.topic} Focus`,
      content: `For ${question.topic} questions, ensure you use appropriate terminology and demonstrate understanding of key concepts. Consider how this relates to broader themes in the subject.`,
      icon: MessageSquare,
    });
  }

  return suggestions;
};

export default function AIHelpDialog({
  question,
  questionNumber,
  currentAnswer,
  onClose,
  onApplySuggestion,
}: AIHelpDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(() =>
    generateAIHelp(question, currentAnswer)
  );
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );

  const handleRegenerateHelp = async () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newSuggestions = generateAIHelp(question, currentAnswer);
    setSuggestions(newSuggestions);
    setIsGenerating(false);
  };

  const handleCopySuggestion = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedSuggestion(content);
    setTimeout(() => setSelectedSuggestion(null), 2000);
  };

  const handleApplySuggestion = (suggestion: string) => {
    const enhancedAnswer = currentAnswer
      ? `${currentAnswer}\n\n${suggestion}`
      : suggestion;
    onApplySuggestion(enhancedAnswer);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        <Card className="bg-gray-900 border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    AI Help - Question {questionNumber}
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {question.marks} marks
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Get AI-powered guidance for your answer
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Question Context */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <h4 className="text-white font-medium mb-2">Question:</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {question.question}
              </p>
              {question.topic && (
                <Badge
                  variant="outline"
                  className="border-white/20 text-white mt-2"
                >
                  {question.topic}
                </Badge>
              )}
            </div>

            {/* AI Suggestions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">AI Suggestions</h4>
                <Button
                  onClick={handleRegenerateHelp}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/5 border-white/10 h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-purple-400" />
                            <CardTitle className="text-white text-sm">
                              {suggestion.title}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className="border-white/20 text-white text-xs"
                            >
                              {suggestion.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {suggestion.content}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                handleCopySuggestion(suggestion.content)
                              }
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10 text-xs"
                            >
                              {selectedSuggestion === suggestion.content ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {selectedSuggestion === suggestion.content
                                ? 'Copied!'
                                : 'Copy'}
                            </Button>
                            <Button
                              onClick={() =>
                                handleApplySuggestion(suggestion.content)
                              }
                              variant="outline"
                              size="sm"
                              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Current Answer Context */}
            {currentAnswer && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-medium text-sm">
                    Your Current Answer
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-gray-300 text-sm">{currentAnswer}</p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium text-sm">
                  Pro Tips
                </span>
              </div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>
                  • Use specific examples and evidence to support your points
                </li>
                <li>• Structure your answer with clear paragraphs</li>
                <li>• Address all parts of the question</li>
                <li>• Show your reasoning and analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
