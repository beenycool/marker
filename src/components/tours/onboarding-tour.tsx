'use client';

import { useEffect } from 'react';
import { useJoyride } from '@/components/providers/joyride-provider';
import { Step } from 'react-joyride';

export function OnboardingTour() {
  const { startTour } = useJoyride();

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    
    if (!hasSeenTour) {
      // Start tour after a short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startOnboardingTour();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboardingTour = () => {
    const steps: Step[] = [
      {
        target: 'body',
        content: 'Welcome to AI Marker! Let me show you how to get the most out of our GCSE marking platform.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="question-input"]',
        content: 'Start by entering the exam question here. Be as specific as possible for the best marking results.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="answer-input"]',
        content: 'Enter your answer here. You can type it out or use our OCR feature to scan handwritten work.',
        placement: 'top',
      },
      {
        target: '[data-tour="subject-select"]',
        content: 'Select your subject to get marking that follows the specific exam board criteria.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="mark-scheme"]',
        content: 'Optionally provide the mark scheme for even more accurate marking aligned with official criteria.',
        placement: 'top',
      },
      {
        target: '[data-tour="submit-button"]',
        content: 'Click here to submit your work for AI marking. You\'ll get detailed feedback in seconds!',
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-link"]',
        content: 'Visit your dashboard to track your progress, see analytics, and monitor improvement over time.',
        placement: 'bottom',
      },
    ];

    startTour(steps);
    
    // Mark tour as seen
    localStorage.setItem('hasSeenOnboardingTour', 'true');
  };

  return null; // This component doesn't render anything visible
}

// Hook for manually triggering tours
export function useOnboardingTour() {
  const { startTour } = useJoyride();

  const startManualTour = () => {
    const steps: Step[] = [
      {
        target: 'body',
        content: 'Let me show you around the AI Marker platform!',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="question-input"]',
        content: 'Enter your exam question here for accurate marking.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="answer-input"]',
        content: 'Your answer goes here - typed or uploaded via OCR.',
        placement: 'top',
      },
      {
        target: '[data-tour="submit-button"]',
        content: 'Submit for instant AI feedback and detailed marking.',
        placement: 'top',
      },
    ];

    startTour(steps);
  };

  const startDashboardTour = () => {
    const steps: Step[] = [
      {
        target: '[data-tour="analytics-section"]',
        content: 'View your performance analytics and track improvement over time.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="recent-submissions"]',
        content: 'See your recent submissions and their scores at a glance.',
        placement: 'left',
      },
      {
        target: '[data-tour="clear-history"]',
        content: 'Clear your session data when needed. All data is stored locally for privacy.',
        placement: 'bottom',
      },
    ];

    startTour(steps);
  };

  return {
    startManualTour,
    startDashboardTour,
  };
}