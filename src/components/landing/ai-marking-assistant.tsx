'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  BarChart3,
  Lightbulb,
  Clock,
  Target,
} from 'lucide-react';

export function AIMarkingAssistant() {
  const capabilities = [
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
      icon: Lightbulb,
      title: 'Smart Suggestions',
      description:
        'Receive personalized recommendations for improvement, practice questions, and study focus areas.',
      color: 'yellow',
    },
    {
      icon: Clock,
      title: 'Time Management',
      description:
        'Learn optimal time allocation for different question types and develop effective exam strategies.',
      color: 'indigo',
    },
    {
      icon: Target,
      title: 'Grade Predictions',
      description:
        "Get accurate grade predictions and understand what's needed to reach your target grades.",
      color: 'pink',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        hover: 'group-hover:bg-blue-500/20',
      },
      green: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        hover: 'group-hover:bg-green-500/20',
      },
      purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        hover: 'group-hover:bg-purple-500/20',
      },
      yellow: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        hover: 'group-hover:bg-yellow-500/20',
      },
      indigo: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        hover: 'group-hover:bg-indigo-500/20',
      },
      pink: {
        bg: 'bg-pink-500/10',
        text: 'text-pink-400',
        hover: 'group-hover:bg-pink-500/20',
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Your AI <span className="text-blue-400">Marking Assistant</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the power of AI-driven assessment that understands your
            work like a human marker, but with the speed and consistency only AI
            can provide.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => {
            const colors = getColorClasses(capability.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group hover:bg-gray-800/70"
              >
                <motion.div
                  className={`w-14 h-14 mb-4 ${colors.bg} ${colors.hover} rounded-xl flex items-center justify-center transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <capability.icon className={`h-7 w-7 ${colors.text}`} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                  {capability.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-8 border border-white/10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  How it works
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Upload your work or type your answers directly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>AI analyzes against official marking criteria</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Receive detailed feedback and grade predictions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Track progress and identify improvement areas</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">98%</div>
                  <div className="text-sm text-gray-400">Marking Accuracy</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">3s</div>
                  <div className="text-sm text-gray-400">Average Response</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">15+</div>
                  <div className="text-sm text-gray-400">GCSE Subjects</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">24/7</div>
                  <div className="text-sm text-gray-400">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
