'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ShareResultsProps {
  markingResponse: {
    score: number;
    totalMarks?: number;
    subject?: string;
    improvements?: string[];
    strengths?: string[];
    grade_boundary_estimate?: string;
  };
}

export function ShareResults({ markingResponse }: ShareResultsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const generateShareableUrl = async (): Promise<string> => {
    // Create a shareable summary (without personal data)
    const shareData = {
      score: markingResponse.score,
      totalMarks: markingResponse.totalMarks || 'N/A',
      subject: markingResponse.subject || 'GCSE Practice',
      grade: markingResponse.grade_boundary_estimate || 'Practice result',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/share-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      });

      if (response.ok) {
        const { shareId } = await response.json();
        return `${window.location.origin}/shared/${shareId}`;
      }
    } catch (error) {
      console.error('Failed to create shareable link:', error);
    }

    // Fallback: create a simple share text
    return `${window.location.origin}?score=${markingResponse.score}&total=${markingResponse.totalMarks}&subject=${encodeURIComponent(markingResponse.subject || 'GCSE')}`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const url = await generateShareableUrl();
      setShareUrl(url);
      
      const shareText = `I scored ${markingResponse.score}/${markingResponse.totalMarks || '?'} on my ${markingResponse.subject || 'GCSE'} practice! ${markingResponse.grade_boundary_estimate ? `(${markingResponse.grade_boundary_estimate})` : ''} Check your work too:`;

      if (navigator.share) {
        await navigator.share({
          title: `My ${markingResponse.subject || 'GCSE'} Practice Results`,
          text: shareText,
          url: url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Sharing failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Card className="mt-4 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-400">
          <Share2 className="h-5 w-5" />
          Share Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 mb-4">
          Show your results to teachers, classmates, or study groups. Great for comparing progress!
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleShare}
            disabled={isSharing}
            variant="secondary"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSharing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating Link...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Results
              </div>
            )}
          </Button>

          {shareUrl && (
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              {copied ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  Copied!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </div>
              )}
            </Button>
          )}
        </div>

        {shareUrl && (
          <div className="mt-3 p-3 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mb-2">Share this link:</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-blue-300 bg-gray-900/50 px-2 py-1 rounded flex-1 truncate">
                {shareUrl}
              </code>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => window.open(shareUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-3">
          💡 <strong>Study tip:</strong> Share with classmates to compare different approaches to the same questions!
        </p>
      </CardContent>
    </Card>
  );
}