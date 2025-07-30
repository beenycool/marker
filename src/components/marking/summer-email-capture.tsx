'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Mail, Check } from 'lucide-react';

export function SummerEmailCapture() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsLoading(true);
    
    try {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Store email for school-year reminder (GDPR compliant)
      const response = await fetch('/api/summer-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          consentDate: new Date().toISOString(),
          purpose: 'school_year_pricing_reminder' 
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="mt-6 border-green-500/20 bg-green-50/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-400">
            <Check className="h-5 w-5" />
            <div>
              <p className="font-medium">Thanks! We'll email you once when school starts.</p>
              <p className="text-sm text-gray-400 mt-1">
                You can unsubscribe anytime. We won't spam you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <Sun className="h-5 w-5" />
          Summer of Free Learning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 mb-4">
          Enjoy unlimited AI marking FREE all summer! When school starts in September, 
          we'll email you <strong>once</strong> about special student pricing.
        </p>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input 
              type="email" 
              placeholder="your.email@school.ac.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800/50 border-gray-700 placeholder:text-gray-500"
              required
            />
          </div>
          <Button 
            type="submit"
            disabled={isLoading || !email}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium px-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Remind Me
              </div>
            )}
          </Button>
        </form>
        
        <p className="text-xs text-gray-400 mt-3">
          📧 One email in September about student pricing • No spam • Unsubscribe anytime<br/>
          🔒 GDPR compliant • We only store your email for this single purpose
        </p>
      </CardContent>
    </Card>
  );
}