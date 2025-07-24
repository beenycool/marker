'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Upload, Brain, FileText, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Work',
    description:
      'Take a photo of handwritten work or type directly into our platform',
    color: 'bg-blue-500',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description:
      'Our advanced AI analyzes your work against GCSE marking schemes',
    color: 'bg-purple-500',
  },
  {
    icon: FileText,
    title: 'Detailed Feedback',
    description:
      'Get comprehensive marks, comments, and improvement suggestions',
    color: 'bg-green-500',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your improvement and focus on weak areas',
    color: 'bg-orange-500',
  },
];

export function HowItWorks() {
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
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              How it works <span className="text-blue-400">for students</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              From upload to improvement - see exactly how AI marking transforms
              your GCSE preparation.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                  {index + 1}
                </div>

                {/* Step card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-white/30 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-4px] h-full">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`p-4 rounded-xl ${step.color} bg-opacity-20 mb-4`}
                    >
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow connector (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-gray-500"
                    >
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
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
            <Brain className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">
              Ready in under 30 seconds • No technical setup required
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
