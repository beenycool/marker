'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Cloud, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

export function Pricing() {
  const reasons = [
    {
      icon: Heart,
      title: 'Built by Students, for Students',
      description:
        'We\'re students who built this tool because we needed it ourselves. No corporate agenda, no profit motives - just a genuine desire to help fellow students succeed.',
    },
    {
      icon: Users,
      title: 'Community-Driven Development',
      description:
        'Our development is guided by real student feedback. Every feature is built to solve actual problems students face, not imagined use cases.',
    },
    {
      icon: Cloud,
      title: 'Generous Free Infrastructure',
      description:
        'Thanks to Cloudflare\'s free tier and OpenRouter\'s generous API credits, we can provide powerful AI marking without charging students.',
    },
    {
      icon: Zap,
      title: 'No Hidden Costs',
      description:
        'What you see is what you get. No premium features, no paywalls, no "upgrade to unlock." Everything we build is available to everyone.',
    },
    {
      icon: Shield,
      title: 'Privacy-First Design',
      description:
        'Your data stays private and anonymous. We don\'t track you, sell your information, or use your work to train AI models.',
    },
    {
      icon: Globe,
      title: 'Open Source Philosophy',
      description:
        'Transparency is at our core. Our code is open and auditable, ensuring we stay true to our mission of free, honest education tools.',
    },
  ];

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
            <Badge className="mb-6 text-sm font-medium px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Heart className="h-4 w-4 mr-1" />
              Always Free
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              <span className="text-green-400">Always</span> Free. No Strings Attached.
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              We believe quality education tools should be accessible to everyone. Here\'s why we\'ll always be free.
            </p>
          </motion.div>
        </div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-500 h-full hover:translate-y-[-8px] hover:shadow-2xl hover:border-white/30 hover:shadow-white/10">
                <CardHeader className="text-center pb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-6 mx-auto shadow-lg">
                    <reason.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white mb-3 font-bold">
                    {reason.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-300 text-lg leading-relaxed">
                    {reason.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using AIMARKER to improve their grades for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="py-4 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/">Start Marking Now</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="py-4 px-8 text-lg font-bold rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            >
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm">
            <span className="inline-flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Trusted by students worldwide • No credit card required • Always free
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
