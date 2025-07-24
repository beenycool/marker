'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Brain,
  MessageCircle,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  FileText,
  CheckCircle,
  BarChart3,
  Bot,
  Camera,
  Users,
  Award,
} from 'lucide-react';

type TabKey = 'marking' | 'tutor' | 'tools';

const featureTabs = {
  marking: {
    title: 'AI Marking',
    description: 'Instant, accurate feedback on your work',
    features: [
      {
        icon: FileText,
        title: 'Intelligent Marking',
        description:
          'Advanced AI analyzes answers against marking criteria, providing detailed feedback on accuracy, method, and presentation.',
        color: 'blue',
      },
      {
        icon: CheckCircle,
        title: 'Instant Results',
        description:
          'Get comprehensive marking results in seconds, not hours. Upload handwritten work or type answers directly.',
        color: 'green',
      },
      {
        icon: BarChart3,
        title: 'Detailed Analytics',
        description:
          'Track performance across topics, identify knowledge gaps, and monitor improvement over time with visual insights.',
        color: 'purple',
      },
      {
        icon: Target,
        title: 'Grade Predictions',
        description:
          "Get accurate grade predictions and understand what's needed to reach your target grades.",
        color: 'pink',
      },
      {
        icon: Camera,
        title: 'OCR Technology',
        description:
          'Upload photos of handwritten work and get instant text conversion with 99% accuracy. Works with messy handwriting.',
        color: 'indigo',
      },
      {
        icon: Clock,
        title: 'Time Management',
        description:
          'Learn optimal time allocation for different question types and develop effective exam strategies.',
        color: 'yellow',
      },
    ],
  },
  tutor: {
    title: 'AI Tutor',
    description: 'Your personal learning companion',
    features: [
      {
        icon: Brain,
        title: 'Instant Understanding',
        description:
          'AI analyzes your work instantly, identifying strengths and areas for improvement with detailed explanations.',
        color: 'blue',
      },
      {
        icon: MessageCircle,
        title: '24/7 Support',
        description:
          'Get help whenever you need it. Your AI tutor is always available to answer questions and provide guidance.',
        color: 'green',
      },
      {
        icon: Target,
        title: 'Personalized Learning',
        description:
          'Tailored feedback and recommendations based on your individual learning style and progress.',
        color: 'purple',
      },
      {
        icon: TrendingUp,
        title: 'Track Progress',
        description:
          'Monitor your improvement over time with detailed analytics and insights into your learning journey.',
        color: 'pink',
      },
      {
        icon: Clock,
        title: 'Time Efficient',
        description:
          'Focus on learning, not waiting. Get immediate feedback to accelerate your understanding.',
        color: 'indigo',
      },
      {
        icon: BookOpen,
        title: 'Curriculum Focused',
        description:
          'All feedback aligned with GCSE curriculum requirements and examination standards.',
        color: 'yellow',
      },
    ],
  },
  tools: {
    title: 'Progress Tools',
    description: 'Everything you need to excel',
    features: [
      {
        icon: Bot,
        title: 'AI-Powered Marking',
        description:
          'Advanced AI models provide accurate, consistent marking based on GCSE standards with 95% accuracy.',
        color: 'blue',
      },
      {
        icon: BarChart3,
        title: 'Progress Analytics',
        description:
          "Track your improvement over time with detailed analytics. See exactly where you're losing marks.",
        color: 'green',
      },
      {
        icon: FileText,
        title: 'Past Papers',
        description:
          'Complete past papers with guided marking and instant feedback for comprehensive exam preparation.',
        color: 'purple',
      },
      {
        icon: Target,
        title: 'AO Highlighting',
        description:
          "See exactly which Assessment Objectives you've met in your work with detailed breakdowns.",
        color: 'pink',
      },
      {
        icon: Users,
        title: 'Study Collaboration',
        description:
          'Share progress and feedback with study groups and mentors for collaborative learning.',
        color: 'indigo',
      },
      {
        icon: Award,
        title: 'Grade Prediction',
        description:
          'Accurate grade predictions based on your current performance and improvement trajectory.',
        color: 'yellow',
      },
    ],
  },
};

const getColorClasses = (color: string) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      hover: 'group-hover:bg-blue-500/20',
      border: 'border-blue-400/30',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      hover: 'group-hover:bg-green-500/20',
      border: 'border-green-400/30',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      hover: 'group-hover:bg-purple-500/20',
      border: 'border-purple-400/30',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      hover: 'group-hover:bg-yellow-500/20',
      border: 'border-yellow-400/30',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      hover: 'group-hover:bg-indigo-500/20',
      border: 'border-indigo-400/30',
    },
    pink: {
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      hover: 'group-hover:bg-pink-500/20',
      border: 'border-pink-400/30',
    },
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};

export function UnifiedFeatures() {
  const [activeTab, setActiveTab] = useState<TabKey>('marking');

  return (
    <section className="py-16 sm:py-24 bg-gray-850 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            All The Tools You Need To{' '}
            <span className="text-blue-400">Succeed</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From instant marking to personalized study plans, our AI is built to
            help you excel at GCSE.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {Object.entries(featureTabs).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabKey)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/50'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="font-semibold">{tab.title}</span>
                <span className="text-sm opacity-80">{tab.description}</span>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featureTabs[activeTab].features.map((feature, index) => {
            const colors = getColorClasses(feature.color || 'blue');
            return (
              <motion.div
                key={`${activeTab}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300 group hover:bg-gray-900/60 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1`}
              >
                <motion.div
                  className={`w-12 h-12 mb-4 ${colors.bg} ${colors.hover} rounded-xl flex items-center justify-center transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className={`h-6 w-6 ${colors.text}`} />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6">
              Built for GCSE excellence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">AI</div>
                <div className="text-sm text-gray-400">Powered Marking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">3s</div>
                <div className="text-sm text-gray-400">Average Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">15+</div>
                <div className="text-sm text-gray-400">GCSE Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-gray-400">Availability</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
