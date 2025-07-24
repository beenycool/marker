'use client';

import { useState, useEffect } from 'react';
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
import { Check, Star, Zap, Crown, Sun, Gift } from 'lucide-react';
import Link from 'next/link';
import { isSummerPromotionActive } from '@/lib/auth';

const plans = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    description: 'Perfect for trying out AIMARKER',
    features: [
      '20 AI marks per day',
      'Basic feedback',
      'All GCSE subjects',
      'Web access',
      'Community support',
      'Ads supported',
    ],
    limitations: ['Standard AI model', 'No OCR support', 'Limited analytics'],
    cta: 'Get Started Free',
    popular: false,
    icon: Star,
    color: 'bg-gray-600',
  },
  {
    name: 'Pro',
    price: '£3.99',
    period: '/month',
    description: 'For serious students',
    features: [
      '200 AI marks per day',
      'Advanced AI models',
      'Handwritten OCR',
      'Detailed analytics',
      'Past paper access',
      'Priority support',
      'Export to classroom tools',
      'Follow-up questions',
      'No ads',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true,
    icon: Crown,
    color: 'bg-blue-500',
  },
];

export function Pricing() {
  const [isSummerPromotion, setIsSummerPromotion] = useState(false);

  useEffect(() => {
    const checkPromotion = async () => {
      try {
        const isActive = await isSummerPromotionActive();
        setIsSummerPromotion(isActive);
      } catch (error) {
        console.error('Error checking summer promotion:', error);
        setIsSummerPromotion(false);
      }
    };

    checkPromotion();
  }, []);

  // Summer promotion single plan
  const summerPromotionPlan = {
    name: 'Summer of Learning',
    price: '£0',
    period: 'until August 31',
    description: 'Everything is free during our summer promotion!',
    features: [
      '200+ AI marks per day',
      'Advanced AI models',
      'Handwritten OCR included',
      'Detailed analytics',
      'Past paper access',
      'Priority support',
      'Export to classroom tools',
      'Follow-up questions',
      'No ads',
      'All Pro features unlocked',
    ],
    limitations: [],
    cta: 'Start Learning Free',
    popular: true,
    icon: Sun,
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  };

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
            <Badge
              className={`mb-6 text-sm font-medium px-4 py-2 ${isSummerPromotion ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse' : 'bg-white/10 text-white'}`}
            >
              {isSummerPromotion ? (
                <span className="flex items-center gap-1">
                  <Sun className="h-4 w-4" />
                  Summer Promotion
                </span>
              ) : (
                'Pricing'
              )}
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              {isSummerPromotion ? (
                <>
                  Everything is <span className="text-yellow-400">free!</span>
                </>
              ) : (
                <>
                  Choose your{' '}
                  <span className="text-blue-400">learning plan</span>
                </>
              )}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              {isSummerPromotion
                ? 'During our Summer of Learning promotion, all Pro features are completely free. No credit card required!'
                : 'Start free, upgrade when you need more. No hidden fees, cancel anytime.'}
            </p>
          </motion.div>
        </div>

        {/* Special offer banner - only show if not summer promotion */}
        {!isSummerPromotion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 mb-8 max-w-2xl mx-auto shadow-lg shadow-orange-500/10"
          >
            <div className="flex items-center justify-center gap-2 text-center">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Zap className="h-5 w-5 text-orange-400" />
              </motion.div>
              <span className="text-white font-medium bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Yearly plan: 20% off + 6 months free trial
              </span>
            </div>
          </motion.div>
        )}

        {/* Pricing cards */}
        <div
          className={`${isSummerPromotion ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 gap-10'} max-w-5xl mx-auto`}
        >
          {isSummerPromotion ? (
            // Single summer promotion card
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative max-w-lg"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 animate-pulse">
                  <Gift className="h-4 w-4 mr-1" />
                  Limited Time Free
                </Badge>
              </div>

              <Card className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border-yellow-500/50 hover:bg-gradient-to-br hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-red-500/30 transition-all duration-500 h-full hover:translate-y-[-8px] hover:shadow-2xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40">
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mb-6 mx-auto shadow-lg">
                    <summerPromotionPlan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl text-white mb-4 font-bold">
                    {summerPromotionPlan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-black text-white">
                      {summerPromotionPlan.price}
                    </span>
                    <span className="text-gray-300 ml-2 text-lg">
                      {summerPromotionPlan.period}
                    </span>
                  </div>
                  <CardDescription className="text-gray-200 text-lg leading-relaxed">
                    {summerPromotionPlan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {summerPromotionPlan.features.map(feature => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Button
                      asChild
                      size="lg"
                      className="w-full py-4 text-lg font-bold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Link href="/sign-up">{summerPromotionPlan.cta}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Regular pricing cards
            plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-blue-500 text-white px-4 py-2">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-500 h-full hover:translate-y-[-8px] hover:shadow-2xl ${
                    plan.popular
                      ? 'border-blue-500/50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10'
                      : 'hover:border-white/30 hover:shadow-white/10'
                  }`}
                >
                  <CardHeader className="text-center pb-2">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${plan.color} mb-6 mx-auto shadow-lg`}
                    >
                      <plan.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-white mb-4 font-bold">
                      {plan.name}
                    </CardTitle>
                    <div className="mb-4">
                      <span className="text-5xl font-black text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-400 ml-2 text-lg">
                        {plan.period}
                      </span>
                    </div>
                    <CardDescription className="text-gray-300 text-lg leading-relaxed">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limitations */}
                    {plan.limitations.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400 font-medium">
                          Not included:
                        </p>
                        {plan.limitations.map(limitation => (
                          <div
                            key={limitation}
                            className="flex items-center gap-3"
                          >
                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                            </div>
                            <span className="text-gray-500 text-sm">
                              {limitation}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-6">
                      <Button
                        asChild
                        size="lg"
                        className={`w-full py-4 text-lg font-bold rounded-full transition-all duration-300 ${
                          plan.popular
                            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-white/10'
                        }`}
                      >
                        <Link href="/sign-up">{plan.cta}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            No setup fees • Cancel anytime • All prices in GBP
          </p>
        </motion.div>
      </div>
    </section>
  );
}
