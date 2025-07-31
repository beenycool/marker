import { MarkingForm } from '@/components/forms/marking-form';
import { OnboardingTour } from '@/components/tours/onboarding-tour';
import { TourTrigger } from '@/components/tours/tour-trigger';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Marking Assistant
            </h1>
            <p className="text-gray-300">
              Submit your GCSE work and get instant, detailed feedback from our AI
              examiners.
            </p>
          </div>
          <TourTrigger />
        </div>

        {/* Main Content */}
        <MarkingForm />
        
        {/* Tour Component */}
        <OnboardingTour />
      </div>
    </div>
  );
}
