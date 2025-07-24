'use client';

import { motion } from 'framer-motion';
import { BookOpen, Shield, Users } from 'lucide-react';

export function UKEducation() {
  const features = [
    {
      icon: BookOpen,
      title: 'GCSE Curriculum Aligned',
      description:
        'Purpose-built to match GCSE marking criteria and assessment objectives across all subjects.',
    },
    {
      icon: Shield,
      title: 'Exam Board Standards',
      description:
        'Trained on real marking schemes from AQA, Edexcel, OCR and WJEC to ensure accuracy.',
    },
    {
      icon: Users,
      title: 'Education Expert Approved',
      description:
        'Developed by education experts who understand the challenges of modern learning.',
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Built for
            <br />
            <span className="text-blue-400">UK Education</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Designed specifically for the UK education system with deep
            understanding of GCSE requirements, marking standards, and
            curriculum objectives.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-6 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300"
                whileHover={{ scale: 1.1, y: -5 }}
              >
                <feature.icon className="h-8 w-8 text-blue-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">15+</div>
              <div className="text-gray-400">GCSE Subjects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">4</div>
              <div className="text-gray-400">Exam Boards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">AI</div>
              <div className="text-gray-400">Powered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400">Available</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
