'use client';

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useOnboardingTour } from './onboarding-tour';

interface TourTriggerProps {
  variant?: 'default' | 'dashboard';
  className?: string;
}

export function TourTrigger({ variant = 'default', className = '' }: TourTriggerProps) {
  const { startManualTour, startDashboardTour } = useOnboardingTour();

  const handleStartTour = () => {
    if (variant === 'dashboard') {
      startDashboardTour();
    } else {
      startManualTour();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStartTour}
      className={`border-blue-500/30 text-blue-400 hover:bg-blue-500/10 ${className}`}
    >
      <HelpCircle className="h-4 w-4 mr-2" />
      {variant === 'dashboard' ? 'Dashboard Tour' : 'Quick Tour'}
    </Button>
  );
}