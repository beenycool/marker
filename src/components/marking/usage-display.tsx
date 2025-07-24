'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UsageDisplayProps {
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    canUse: boolean;
  };
}

export function UsageDisplay({ usage }: UsageDisplayProps) {
  if (!usage) return null;

  const percentage = (usage.used / usage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.remaining <= 0;

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Daily Usage
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAtLimit && (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limit Reached
              </Badge>
            )}
            {isNearLimit && !isAtLimit && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Near Limit
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Submissions Today</span>
            <span className="text-white font-medium">
              {usage.used} / {usage.limit}
            </span>
          </div>

          <Progress
            value={percentage}
            className={`h-2 ${isAtLimit ? 'bg-red-500/20' : isNearLimit ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Remaining</span>
            <span
              className={`${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'}`}
            >
              {usage.remaining} submissions
            </span>
          </div>

          {isAtLimit && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-blue-400" />
                <span className="text-white font-medium">
                  Need more submissions?
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Upgrade to Pro for 200 submissions daily, advanced AI models,
                and premium features.
              </p>
              <Button asChild size="sm" className="bg-blue-600 text-white">
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-medium">
                  Running low on submissions
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                Consider upgrading to Pro for unlimited daily submissions and
                advanced features.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
