'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Users,
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Shield,
  Lock,
  Award,
  Sun,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { LiveDemo } from './live-demo';
import { isSummerPromotionActive } from '@/lib/auth';

export function Hero() {
  const [isSummerPromotion, setIsSummerPromotion] = useState(false);

  useEffect(() => {
    const checkPromotion = async () => {
      try {
        const isActive = await isSummerPromotionActive();
        setIsSummerPromotion(isActive);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking summer promotion:', error);
        setIsSummerPromotion(false);
      }
    };

    checkPromotion();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-10"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-10"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-40 left-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-10"
          animate={{
            x: [0, 30, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Beta badge / Summer promotion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              {isSummerPromotion ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-sm font-medium animate-pulse">
                  <Sun className="h-4 w-4 mr-1" />
                  Summer of Learning - All Pro Features Free!
                </Badge>
              ) : (
                <Badge className="bg-blue-500 text-white px-4 py-2 text-sm font-medium">
                  🚀 Now in Beta
                </Badge>
              )}
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 sm:mb-8 leading-none tracking-tight"
            >
              <span className="text-white">
                {isSummerPromotion
                  ? 'Get Smarter Feedback This Summer — For Free'
                  : 'Smarter Feedback, Better Results'}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto lg:mx-0 px-4 sm:px-0 leading-relaxed font-light"
            >
              {isSummerPromotion
                ? 'Experience our complete AI-powered marking platform with all Pro features unlocked free during our Summer of Learning promotion. OCR, unlimited marks, and advanced feedback — all yours at no cost!'
                : 'The AI-powered marking assistant that provides instant, detailed feedback on student work. Built specifically for UK education standards with comprehensive GCSE support.'}
            </motion.p>

            {/* Key benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10 px-4 sm:px-0"
            >
              <motion.div
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 sm:px-6 py-3 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-400/20"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                <span className="text-sm sm:text-base text-gray-300 font-medium">
                  Instant AI Feedback
                </span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 sm:px-6 py-3 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-purple-400/30 hover:shadow-lg hover:shadow-purple-400/20"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <span className="text-sm sm:text-base text-gray-300 font-medium">
                  Save Hours
                </span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 sm:px-6 py-3 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-green-400/30 hover:shadow-lg hover:shadow-green-400/20"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                <span className="text-sm sm:text-base text-gray-300 font-medium">
                  Improve Grades
                </span>
              </motion.div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start mb-10 sm:mb-16 px-4 sm:px-0"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <Link href="/dashboard">Upload Your Papers</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 sm:px-12 py-6 sm:py-7 text-xl sm:text-2xl font-bold rounded-lg shadow-lg hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                >
                  <Link href="/sign-up">Start Marking Free</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* No credit card required */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-center lg:text-left mb-8 sm:mb-10"
            >
              <p className="text-gray-400 text-sm font-medium">
                ✨ No credit card required • Start your free trial today
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto lg:mx-0 px-4 sm:px-0"
            >
              {isSummerPromotion ? (
                // Summer promotion stats
                <>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mr-2" />
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        Everything FREE
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      200+ marks/day
                    </p>
                  </motion.div>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2" />
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        OCR Included
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      Pro features free
                    </p>
                  </motion.div>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mr-2" />
                      <span className="text-lg sm:text-2xl font-bold text-white">
                        All Subjects
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      GCSE supported
                    </p>
                  </motion.div>
                </>
              ) : (
                // Regular stats
                <>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mr-2" />
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        Free
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      20 marks/day
                    </p>
                  </motion.div>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2" />
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        Pro
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      200 marks/day
                    </p>
                  </motion.div>
                  <motion.div
                    className="text-center lg:text-left"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mr-2" />
                      <span className="text-lg sm:text-2xl font-bold text-white">
                        All Subjects
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      GCSE supported
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>

          {/* Right side - Live Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-1 lg:order-2 flex justify-center lg:block"
          >
            <div className="w-full max-w-md lg:max-w-none">
              <LiveDemo />
            </div>
          </motion.div>
        </div>

        {/* Trust elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">SOC2 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">Education Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">
                Student Data Protected
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
