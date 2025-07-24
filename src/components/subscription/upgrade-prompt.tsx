'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import {
  trackUpgradePromptShown,
  trackUpgradePromptClicked,
} from '@/lib/analytics';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  context: 'limit_reached' | 'pro_feature';
  currentUsage?: number;
  limit?: number;
  onClose?: () => void;
}

export function UpgradePrompt({
  context,
  currentUsage = 0,
  limit = 20,
  onClose,
}: UpgradePromptProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Remove Clerk dependency - track without user ID
    trackUpgradePromptShown('anonymous', context);
  }, [context]);

  const handleUpgrade = () => {
    // Remove Clerk dependency - track without user ID
    trackUpgradePromptClicked('anonymous', context);
    router.push('/pricing');
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const progressPercentage = (currentUsage / limit) * 100;

  const messages = {
    limit_reached: {
      title: 'Daily Limit Reached',
      description: `You've used ${currentUsage} of ${limit} free marks today. Upgrade to Pro for unlimited marking!`,
      cta: 'Upgrade to Pro',
    },
    pro_feature: {
      title: 'Pro Feature',
      description:
        'This feature is only available with a Pro subscription. Get access to advanced AI models, OCR upload, and unlimited marking!',
      cta: 'Get Pro Access',
    },
  };

  const message = messages[context];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{message.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{message.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {context === 'limit_reached' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Usage</span>
                <span>
                  {currentUsage}/{limit}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleUpgrade} className="flex-1">
              {message.cta}
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check if user should see upgrade prompt
export function useUpgradePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptContext, setPromptContext] = useState<
    'limit_reached' | 'pro_feature'
  >('limit_reached');

  const triggerUpgradePrompt = (context: 'limit_reached' | 'pro_feature') => {
    setPromptContext(context);
    setShowPrompt(true);
  };

  const closePrompt = () => {
    setShowPrompt(false);
  };

  return {
    showPrompt,
    promptContext,
    triggerUpgradePrompt,
    closePrompt,
  };
}
