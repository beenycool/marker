'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  Calculator,
  FlaskRound,
  Globe,
  PenTool,
} from 'lucide-react';

export function SampleQuestions() {
  const subjects = [
    { icon: Calculator, name: 'Mathematics', color: 'bg-blue-500' },
    { icon: FlaskRound, name: 'Science', color: 'bg-green-500' },
    { icon: PenTool, name: 'English', color: 'bg-purple-500' },
    { icon: Globe, name: 'Geography', color: 'bg-orange-500' },
    { icon: BookOpen, name: 'History', color: 'bg-red-500' },
    { icon: FileText, name: 'More Subjects', color: 'bg-gray-500' },
  ];

  const sampleQuestions = [
    {
      subject: 'Mathematics',
      question: 'Solve the quadratic equation: x² + 5x + 6 = 0',
      difficulty: 'Grade 7-9',
      marks: '3 marks',
    },
    {
      subject: 'English Literature',
      question:
        'Analyse how Shakespeare presents the theme of betrayal in Macbeth...',
      difficulty: 'Grade 4-6',
      marks: '8 marks',
    },
    {
      subject: 'Physics',
      question: 'Calculate the kinetic energy of a 2kg object moving at 10m/s',
      difficulty: 'Grade 7-9',
      marks: '4 marks',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="bg-blue-500/20 text-blue-400 mb-6 text-sm font-medium px-4 py-2 border border-blue-500/30">
            Interactive Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Try it <span className="text-blue-400">Yourself</span>
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-300 mb-6">
            Sample Questions
          </h3>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience our AI marking system firsthand with real GCSE questions.
            Select a subject and see instant, detailed feedback on your answers.
          </p>
        </motion.div>

        {/* Subject selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {subjects.map((subject, index) => (
              <motion.button
                key={subject.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-800/50 p-4 rounded-xl border border-white/10 hover:border-blue-400/30 transition-all duration-300 text-center group hover:bg-gray-800/70"
              >
                <div
                  className={`w-12 h-12 mx-auto mb-3 ${subject.color} bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300`}
                >
                  <subject.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors duration-300">
                  {subject.name}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Sample questions showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-3 gap-6 mb-12"
        >
          {sampleQuestions.map((sample, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                  {sample.subject}
                </Badge>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {sample.difficulty}
                  </div>
                  <div className="text-sm font-semibold text-green-400">
                    {sample.marks}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {sample.question}
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
              >
                Try This Question
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive demo area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-gray-700/50 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">
                  AI Marking Demo
                </h4>
                <Badge className="bg-green-500/20 text-green-400">
                  Live Demo
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Your Answer:
                  </label>
                  <textarea
                    placeholder="Type your answer here or upload an image of your handwritten work..."
                    className="w-full h-32 bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-400/50 focus:outline-none resize-none"
                  />
                  <div className="flex gap-3 mt-4">
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      Submit Answer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Upload Image
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    AI Feedback:
                  </label>
                  <div className="bg-gray-900/50 border border-white/10 rounded-lg p-3 h-32 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        Submit an answer to see instant AI feedback
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to get started with full access?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Experience unlimited marking, detailed analytics, and personalized
              feedback across all GCSE subjects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 px-8">
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8"
              >
                View All Features
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
