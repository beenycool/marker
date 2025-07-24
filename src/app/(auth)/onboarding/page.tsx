import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  if ((user as any).onboardingCompleted) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <OnboardingFlow />
    </div>
  );
}
