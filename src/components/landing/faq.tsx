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
import { HelpCircle, Users, BookOpen, Shield, Zap, Clock } from 'lucide-react';

const faqs = [
  {
    question: 'How accurate is the AI marking?',
    answer:
      'Our AI models are trained on thousands of GCSE papers and marking schemes. While we strive for high accuracy, we recommend using our feedback as a comprehensive guide for your learning.',
    icon: Zap,
  },
  {
    question: 'Which subjects are supported?',
    answer:
      'We support all major GCSE subjects including English, Mathematics, Sciences, History, Geography, and more. Our AI is continuously learning and improving across all subjects.',
    icon: BookOpen,
  },
  {
    question: 'Is my data safe and private?',
    answer:
      'Yes, we take privacy seriously. All submissions are encrypted and stored securely. We never share your work with third parties, and you can delete your data at any time.',
    icon: Shield,
  },
  {
    question: 'Can I use this for group study sessions?',
    answer:
      'Yes! You can share your feedback and progress with study groups. Everyone gets the same powerful collaboration features.',
    icon: Users,
  },
  {
    question: 'How fast is the marking process?',
    answer:
      "Most submissions are marked within 10-30 seconds. Complex questions may take slightly longer, but you'll always get faster feedback than traditional marking.",
    icon: Clock,
  },
  {
    question: "What if I disagree with the AI's assessment?",
    answer:
      'AI marking is a tool to help you learn. If you disagree with the feedback, you can ask follow-up questions to clarify the reasoning and get additional explanations.',
    icon: HelpCircle,
  },
];

export function FAQ() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-white/10 text-white mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Frequently asked <span className="text-blue-400">questions</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Got questions? We've got answers. If you can't find what you're
              looking for, feel free to contact us.
            </p>
          </motion.div>
        </div>

        {/* FAQ grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-800/50 backdrop-blur-sm border-white/10 hover:bg-gray-800/70 hover:border-blue-400/30 transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <faq.icon className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg leading-tight">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 leading-relaxed">
                    {faq.answer}
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
          <div className="bg-gray-900/10 rounded-lg p-8 border border-white/10 backdrop-blur-sm max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-300 mb-6">
              We're here to help! Contact us and we'll get back to you as soon
              as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@aimarker.tech"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium transition-all duration-300"
              >
                Contact Support
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
