'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useMarkingInfo } from '@/hooks/use-marking';

export function UsageDisplay() {
  const { data: markingInfo, isLoading } = useMarkingInfo();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!markingInfo) return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [markingInfo]);

  if (isLoading || !markingInfo) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { used, limit, canUse } = markingInfo.usage;
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80 && percentage < 100;
  const isAtLimit = !canUse;

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">
                {used} of {limit} submissions used
              </span>
              <span className="text-gray-300">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {isAtLimit && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-white font-medium">
                  Daily limit reached
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                You've used all {limit} submissions for today.
              </p>
              <p className="text-gray-400 text-xs">
                Resets in: {timeLeft}
              </p>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-medium">
                  Running low on submissions
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                You've used {used} of {limit} daily submissions.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Resets in: {timeLeft}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
