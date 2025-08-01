import { Hero } from '@/components/landing/hero';
import { UKEducation } from '@/components/landing/uk-education';
import { UnifiedFeatures } from '@/components/landing/unified-features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StudentExperience } from '@/components/landing/student-experience';
import { SampleQuestions } from '@/components/landing/sample-questions';
import { FAQ } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Hero />
      <UKEducation />
      <div id="features">
        <UnifiedFeatures />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <StudentExperience />
      <div id="sample-questions">
        <SampleQuestions />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
}
