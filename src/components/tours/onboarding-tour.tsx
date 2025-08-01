'use client';

import { useEffect } from 'react';
import { useJoyride } from '@/components/providers/joyride-provider';
import { Step } from 'react-joyride';

export function OnboardingTour() {
  const { startTour } = useJoyride();

  useEffect(() => {
    try {
      // Check if user has seen the tour before
      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
      
      if (!hasSeenTour) {
        // Start tour after a short delay to ensure DOM is ready
        const timer = setTimeout(() => {
          startOnboardingTour();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      // localStorage is unavailable (e.g., private browsing, server-side rendering)
      // Silently skip the tour in these environments
      console.warn('localStorage unavailable, skipping onboarding tour');
    }
  }, []);

  const startOnboardingTour = () => {
    const steps: Step[] = [
      {
        target: 'body',
        content: 'Welcome to AI Marker! We\'re students who built this during our own GCSEs because we were tired of waiting for feedback. Let\'s show you around.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        content: '🔒 <strong>Privacy first:</strong> Everything here stays in your browser. We never save your work or track you. We get how important this is during exam time.',
        placement: 'center',
      },
      {
        target: '[data-tour="question-input"]',
        content: 'Enter your exam question here. The more specific you are, the better we can help with accurate marking.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="answer-input"]',
        content: 'Your answer goes here - type it directly or upload a photo of handwritten work using our OCR feature.',
        placement: 'top',
      },
      {
        target: '[data-tour="subject-select"]',
        content: 'Select your subject for marking tailored to specific exam board criteria and standards.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="mark-scheme"]',
        content: 'Include the mark scheme here for the most accurate marking aligned with official criteria.',
        placement: 'top',
      },
      {
        target: '[data-tour="submit-button"]',
        content: 'Submit your work to get detailed AI feedback and marking within seconds.',
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-link"]',
        content: 'Visit your dashboard to track progress and see analytics - all stored locally for privacy.',
        placement: 'bottom',
      },
    ];

    startTour(steps);
    
    // Mark tour as seen
    try {
      localStorage.setItem('hasSeenOnboardingTour', 'true');
    } catch (error) {
      console.warn('Failed to save onboarding tour state:', error);
      // Silently fail - the tour will show again next time, which is acceptable
    }
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
        content: 'Let us show you around AI Marker — built by students who needed faster feedback during our own GCSEs.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="question-input"]',
        content: 'Enter your exam question here - more detail helps with accurate marking.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="answer-input"]',
        content: 'Your answer goes here - type it directly or upload handwritten work.',
        placement: 'top',
      },
      {
        target: '[data-tour="submit-button"]',
        content: 'Submit to get instant, detailed feedback and marking.',
        placement: 'top',
      },
    ];

    startTour(steps);
  };

  const startDashboardTour = () => {
    const steps: Step[] = [
      {
        target: 'body',
        content: '🔒 <strong>Your personal dashboard:</strong> Everything here is stored locally in your browser for complete privacy. We never see or store your data.',
        placement: 'center',
      },
      {
        target: '[data-tour="analytics-section"]',
        content: 'View your performance analytics and track improvement over time.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="recent-submissions"]',
        content: 'See your recent submissions and scores. All data stays local for privacy.',
        placement: 'left',
      },
      {
        target: '[data-tour="clear-history"]',
        content: 'Clear your session data anytime - you have complete control over your information.',
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