'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, BookOpen } from 'lucide-react';

export function StudentExperience() {
  const experiences = [
    {
      icon: TrendingUp,
      stat: 'Instant',
      description: 'Feedback on your work',
      detail:
        'Get immediate detailed feedback on your assignments and practice questions to improve faster.',
    },
    {
      icon: Clock,
      stat: '24/7',
      description: 'Always available',
      detail:
        'Access AI-powered marking and feedback anytime, anywhere - no waiting for teacher availability.',
    },
    {
      icon: BookOpen,
      stat: 'Unlimited',
      description: 'Practice opportunities',
      detail:
        'Mark as many practice questions as you need to build confidence and improve your skills.',
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
            <span className="text-blue-400">Student</span> Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how students across the UK are transforming their academic
            performance with personalized AI feedback and intelligent marking.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {experiences.map((experience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-2xl border border-blue-400/30 text-center"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <experience.icon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {experience.stat}
              </div>
              <div className="text-lg font-semibold text-blue-400 mb-2">
                {experience.description}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {experience.detail}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Start improving your grades today
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Experience the power of AI-driven feedback to accelerate your
              learning and achieve better results in your studies.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">Detailed feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400">Instant results</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-400">24/7 availability</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
