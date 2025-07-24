'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdConfig {
  id: string;
  type: 'banner' | 'native' | 'video';
  title: string;
  description: string;
  imageUrl?: string;
  actionText: string;
  actionUrl: string;
  sponsor: string;
  category: 'education' | 'study-tools' | 'career' | 'technology';
}

interface AdBannerProps {
  userTier: 'FREE' | 'PRO';
  placement: 'dashboard' | 'marking' | 'sidebar' | 'footer';
  className?: string;
}

// Educational and study-related ads suitable for GCSE students
const educationalAds: AdConfig[] = [
  {
    id: 'seneca_learning',
    type: 'native',
    title: 'Seneca Learning - Free GCSE Revision',
    description:
      'Boost your GCSE grades with free, interactive revision courses backed by cognitive science.',
    imageUrl: '/ads/seneca-logo.svg',
    actionText: 'Start Free Revision',
    actionUrl: 'https://senecalearning.com',
    sponsor: 'Seneca Learning',
    category: 'education',
  },
  {
    id: 'bbc_bitesize',
    type: 'banner',
    title: 'BBC Bitesize - Trusted GCSE Resources',
    description:
      'Everything you need for GCSE success. Videos, quizzes, and revision guides.',
    imageUrl: '/ads/bbc-bitesize-logo.svg',
    actionText: 'Visit BBC Bitesize',
    actionUrl: 'https://bbc.co.uk/bitesize',
    sponsor: 'BBC',
    category: 'education',
  },
  {
    id: 'khan_academy',
    type: 'native',
    title: 'Khan Academy - World-Class Education',
    description:
      'Learn anything, anywhere. Free courses, lessons, and practice for students.',
    imageUrl: '/ads/khan-academy-logo.svg',
    actionText: 'Learn for Free',
    actionUrl: 'https://khanacademy.org',
    sponsor: 'Khan Academy',
    category: 'education',
  },
  {
    id: 'study_tools',
    type: 'banner',
    title: 'StudySmarter - AI Study Planner',
    description:
      'Create study schedules, flashcards, and track your progress with AI.',
    imageUrl: '/ads/study-tools-logo.svg',
    actionText: 'Try StudySmarter',
    actionUrl: 'https://studysmarter.co.uk',
    sponsor: 'StudySmarter',
    category: 'study-tools',
  },
  {
    id: 'career_guidance',
    type: 'native',
    title: 'Prospects - Career Guidance',
    description:
      'Discover career paths, university courses, and job opportunities.',
    imageUrl: '/ads/prospects-logo.svg',
    actionText: 'Explore Careers',
    actionUrl: 'https://prospects.ac.uk',
    sponsor: 'Prospects',
    category: 'career',
  },
];

export function AdBanner({
  userTier,
  placement,
  className = '',
}: AdBannerProps) {
  const [currentAd, setCurrentAd] = useState<AdConfig | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    // Only show ads for free tier users
    if (userTier === 'PRO') {
      setIsVisible(false);
      return;
    }

    // Filter ads based on placement
    const suitableAds = educationalAds.filter(ad => {
      if (placement === 'dashboard')
        return ad.type === 'banner' || ad.type === 'native';
      if (placement === 'marking') return ad.type === 'banner';
      if (placement === 'sidebar') return ad.type === 'native';
      if (placement === 'footer') return ad.type === 'banner';
      return true;
    });

    if (suitableAds.length === 0) {
      setIsVisible(false);
      return;
    }

    setCurrentAd(suitableAds[adIndex % suitableAds.length]);

    // Rotate ads every 30 seconds
    const interval = setInterval(() => {
      setAdIndex(prev => (prev + 1) % suitableAds.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [userTier, placement, adIndex]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAdClick = () => {
    if (currentAd) {
      // Track ad click for analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ad_click', {
          ad_id: currentAd.id,
          ad_sponsor: currentAd.sponsor,
          placement: placement,
          user_tier: userTier,
        });
      }

      window.open(currentAd.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render for Pro users or when not visible
  if (userTier === 'PRO' || !isVisible || !currentAd) {
    return null;
  }

  // Banner style (horizontal)
  if (currentAd.type === 'banner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`w-full ${className}`}
        >
          <Card className="bg-blue-100 border-blue-500/20 relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                      SPONSORED
                    </Badge>
                    <span className="text-xs text-gray-400">
                      by {currentAd.sponsor}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">
                      {currentAd.title}
                    </h3>
                    <p className="text-gray-300 text-xs">
                      {currentAd.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAdClick}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {currentAd.actionText}
                  </Button>
                  <Button
                    onClick={handleClose}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-white/10 p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Native style (integrated)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`w-full ${className}`}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group relative overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <Button
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <CardContent className="p-4" onClick={handleAdClick}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {currentAd.sponsor.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    SPONSORED
                  </Badge>
                  <span className="text-xs text-gray-400">
                    by {currentAd.sponsor}
                  </span>
                </div>

                <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-blue-300 transition-colors">
                  {currentAd.title}
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {currentAd.description}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <Button size="sm" className="bg-blue-600 text-white text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {currentAd.actionText}
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    <a href="/pricing">
                      <Crown className="h-3 w-3 mr-1" />
                      Remove Ads
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
