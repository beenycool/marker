'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FeatureAnnouncementBannerProps {
  className?: string;
}

export function FeatureAnnouncementBanner({
  className,
}: FeatureAnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('feature-announcement-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('feature-announcement-dismissed', 'true');
  };

  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-4 shadow-lg"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="h-6 w-6 text-white animate-pulse" />
              <Gift className="h-5 w-5 text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-lg">
                  AIMARKER - Always Free!
                </h2>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  FREE FOREVER
                </Badge>
              </div>

              <p className="text-white/90 text-sm md:text-base">
                Advanced OCR, AI marking, and detailed feedback - all completely free with no signup required!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 animate-pulse opacity-50" />
      </motion.div>
    </AnimatePresence>
  );
}
