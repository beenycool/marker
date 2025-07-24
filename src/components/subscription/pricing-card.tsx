'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStripeJs } from '@/lib/stripe';

interface PricingCardProps {
  title: string;
  price: number;
  interval: string;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  priceId?: string;
  disabled?: boolean;
}

export function PricingCard({
  title,
  price,
  interval,
  features,
  isPopular = false,
  isCurrentPlan = false,
  priceId,
  disabled = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!priceId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const stripe = await getStripeJs();
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description:
          error instanceof Error ? error.message : 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`relative bg-white/5 backdrop-blur-sm border-white/10 ${
        isPopular ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-6">
        <CardTitle className="text-white text-2xl font-bold">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-white">
            {price === 0 ? 'Free' : `£${price}`}
          </span>
          {price > 0 && <span className="text-gray-400 ml-2">/{interval}</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading || disabled || isCurrentPlan}
          className={`w-full ${
            isPopular ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
          } text-white transition-all duration-300`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : price === 0 ? (
            'Get Started'
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to {title}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
