'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Camera,
  BarChart3,
  FileText,
  Users,
  Clock,
  Target,
  BookOpen,
  Award,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Marking',
    description:
      'Advanced AI models provide accurate, consistent marking based on GCSE standards. Get detailed feedback that matches official marking criteria with 95% accuracy.',
    badge: 'Core Feature',
    color: 'bg-blue-500',
  },
  {
    icon: Camera,
    title: 'Advanced OCR Technology',
    description:
      'Upload photos of handwritten work and get instant text conversion with 99% accuracy. Works with messy handwriting, diagrams, and equations - a major differentiator from other platforms.',
    badge: 'Premium',
    color: 'bg-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description:
      "Track your improvement over time with detailed analytics and insights. See exactly where you're losing marks and get personalized study recommendations.",
    badge: 'Dashboard',
    color: 'bg-green-500',
  },
  {
    icon: FileText,
    title: 'Past Papers',
    description:
      'Complete past papers with guided marking and instant feedback',
    badge: 'Study Tool',
    color: 'bg-orange-500',
  },
  {
    icon: Target,
    title: 'AO Highlighting',
    description:
      "See exactly which Assessment Objectives you've met in your work",
    badge: 'GCSE Specific',
    color: 'bg-indigo-500',
  },
  {
    icon: Users,
    title: 'Study Collaboration',
    description: 'Share progress and feedback with study groups and mentors',
    badge: 'Collaboration',
    color: 'bg-teal-500',
  },
  {
    icon: Clock,
    title: 'Instant Feedback',
    description:
      'Get comprehensive feedback in seconds, not hours. Save 90% of your marking time while getting more detailed feedback than manual marking.',
    badge: 'Speed',
    color: 'bg-yellow-500',
  },
  {
    icon: Award,
    title: 'Grade Prediction',
    description: 'Accurate grade predictions based on your current performance',
    badge: 'Insights',
    color: 'bg-pink-500',
  },
];

export function Features() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-white/10 text-white mb-6 text-sm font-medium px-4 py-2">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Everything you need to{' '}
              <span className="text-blue-400">excel at GCSE</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Designed for students, our platform provides comprehensive tools
              for GCSE success.
            </p>
          </motion.div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-500 group h-full hover:border-white/30 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-4px]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2 sm:p-3 rounded-xl ${feature.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 group-hover:scale-110`}
                    >
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-white/10 text-white text-xs font-medium border border-white/20"
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg font-bold group-hover:text-blue-300 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 rounded-full border border-white/10 backdrop-blur-sm">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">
              All subjects supported • Real GCSE standards • Instant results
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
