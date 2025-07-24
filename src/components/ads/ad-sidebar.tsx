'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdSidebarProps {
  userTier: 'FREE' | 'PRO';
  className?: string;
}

export function AdSidebar({ userTier, className = '' }: AdSidebarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Don't render for Pro users
  if (userTier === 'PRO' || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className={`w-full ${className}`}
      >
        <Card className="bg-blue-100 border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10 p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              <CardTitle className="text-white text-sm">
                Upgrade to Pro
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">
                Remove Ads Forever
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Upgrade to Pro and enjoy an ad-free experience with premium
                features.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">No more ads</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">200 marks/day</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">OCR handwriting</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">All AI models</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">£2.99</div>
              <div className="text-xs text-gray-400 mb-3">per month</div>

              <Button
                asChild
                size="sm"
                className="w-full bg-blue-600 text-white"
              >
                <a href="/pricing">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade Now
                </a>
              </Button>
            </div>

            <div className="text-center">
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                6-month trial available
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
