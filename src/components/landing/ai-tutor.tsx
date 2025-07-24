'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  MessageCircle,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

export function AITutor() {
  const features = [
    {
      icon: Brain,
      title: 'Instant Understanding',
      description:
        'AI analyzes your work instantly, identifying strengths and areas for improvement with detailed explanations.',
    },
    {
      icon: MessageCircle,
      title: '24/7 Support',
      description:
        'Get help whenever you need it. Your AI tutor is always available to answer questions and provide guidance.',
    },
    {
      icon: Target,
      title: 'Personalized Learning',
      description:
        'Tailored feedback and recommendations based on your individual learning style and progress.',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description:
        'Monitor your improvement over time with detailed analytics and insights into your learning journey.',
    },
    {
      icon: Clock,
      title: 'Time Efficient',
      description:
        'Focus on learning, not waiting. Get immediate feedback to accelerate your understanding.',
    },
    {
      icon: BookOpen,
      title: 'Curriculum Focused',
      description:
        'All feedback aligned with GCSE curriculum requirements and examination standards.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Your Personal <span className="text-blue-400">AI Tutor</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of education with an AI tutor that understands
            your needs, provides instant feedback, and helps you achieve your
            academic goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 p-6 rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all duration-300 group hover:bg-gray-900/70"
            >
              <motion.div
                className="w-12 h-12 mb-4 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <feature.icon className="h-6 w-6 text-blue-400" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to experience AI-powered learning?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Improve your academic performance with personalized AI feedback
              tailored to your learning needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Instant feedback
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Personalized learning
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                24/7 availability
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
