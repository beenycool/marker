'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Star, Crown } from 'lucide-react';

export function Waitlist() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-orange-500 text-white mb-6 text-sm font-medium px-4 py-2">
              🔥 Early Access
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Ready to get started?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light mb-8">
              Start improving your grades with AI-powered marking and feedback.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Founding Member Pricing
              </h3>
              <p className="text-gray-300 text-sm">Lock in 50% off for life</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <Star className="h-8 w-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Early Access
              </h3>
              <p className="text-gray-300 text-sm">
                Be first to try new features
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Direct Feedback
              </h3>
              <p className="text-gray-300 text-sm">Shape product development</p>
            </div>
          </motion.div>

          {/* Email form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-12"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 font-bold rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <p className="text-sm text-gray-400">
                  No credit card required • Start with 20 free marks per day
                </p>
              </form>
            ) : (
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-bold text-green-400">
                    You're on the list!
                  </h3>
                </div>
                <p className="text-gray-300">
                  Thanks for joining! We'll email you when early access opens.
                </p>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 rounded-full border border-white/10 backdrop-blur-sm">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">
                Free to start • No credit card required
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
