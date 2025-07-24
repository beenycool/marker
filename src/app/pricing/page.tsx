import { getCurrentUser } from '@/lib/auth';
import { PricingCard } from '@/components/subscription/pricing-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS, PRICE_ID } from '@/lib/stripe';
import {
  Crown,
  Zap,
  Star,
  Users,
  BookOpen,
  Brain,
  Camera,
  BarChart3,
  Download,
  Headphones,
} from 'lucide-react';

export default async function PricingPage() {
  const user = await getCurrentUser();

  const freeFeatures = [
    { icon: Zap, text: '20 AI marks per day' },
    { icon: Brain, text: 'Gemini AI model' },
    { icon: BookOpen, text: 'All GCSE subjects' },
    { icon: BarChart3, text: 'Basic progress tracking' },
    { icon: Users, text: 'Community support' },
  ];

  const proFeatures = [
    { icon: Crown, text: '200 AI marks per day' },
    { icon: Brain, text: 'All AI models (Gemini, Kimi, DeepSeek)' },
    { icon: BookOpen, text: 'All GCSE subjects + exam boards' },
    { icon: Camera, text: 'OCR handwriting recognition' },
    { icon: BarChart3, text: 'Advanced analytics & insights' },
    { icon: Download, text: 'Export to Google Classroom' },
    { icon: Headphones, text: 'Priority support' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-blue-500 text-white px-4 py-2 mb-6">
            🚀 Limited Time Offer
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent <span className="text-blue-400">Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your GCSE journey. Start free and
            upgrade when you're ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <PricingCard
            title="Free"
            price={0}
            interval="forever"
            features={[...PLANS.FREE.features]}
            isCurrentPlan={user?.subscriptionTier === 'FREE'}
            disabled={!user}
          />

          <PricingCard
            title="Pro"
            price={2.99}
            interval="month"
            features={[...PLANS.PRO.features]}
            isPopular={true}
            isCurrentPlan={user?.subscriptionTier === 'PRO'}
            priceId={PRICE_ID.PRO_MONTHLY}
            disabled={!user}
          />
        </div>

        {/* Feature Comparison */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-4xl mx-auto mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">
              What's Included
            </CardTitle>
            <CardDescription className="text-gray-300">
              Compare features across all plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Free Features */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-white font-semibold text-lg">
                    Free Plan
                  </h3>
                </div>
                <ul className="space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <feature.icon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Features */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-blue-400" />
                  <h3 className="text-white font-semibold text-lg">Pro Plan</h3>
                </div>
                <ul className="space-y-3">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <feature.icon className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-300">
                  Yes, you can cancel your subscription at any time. You'll
                  retain access to Pro features until the end of your billing
                  period.
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">
                  What happens to my data if I cancel?
                </h3>
                <p className="text-gray-300">
                  Your submission history and progress data are always
                  preserved. You can reactivate your subscription at any time to
                  regain full access.
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">
                  Do you offer student discounts?
                </h3>
                <p className="text-gray-300">
                  We're working on student verification and discounts. Stay
                  tuned for updates or contact support for more information.
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">
                  How accurate is the AI marking?
                </h3>
                <p className="text-gray-300">
                  Our AI models are trained on GCSE marking schemes and achieve
                  high accuracy. However, AI feedback should supplement, not
                  replace, teacher guidance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login prompt */}
        {!user && (
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              Please sign in to start your free trial or upgrade to Pro
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/sign-in"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
