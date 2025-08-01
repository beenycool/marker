'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Lightbulb, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  subject: string;
  onHelpReceived: (help: string) => void;
}

export function AIHelpDialog({
  open,
  onOpenChange,
  question,
  subject,
  onHelpReceived,
}: AIHelpDialogProps) {
  const [helpRequest, setHelpRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateAIHelp = async () => {
    if (!helpRequest.trim()) {
      toast({
        title: 'Please enter your question',
        description: 'Tell us what you need help with.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          subject,
          helpRequest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate help');
      }

      onHelpReceived(data.help);
      onOpenChange(false);
      setHelpRequest('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate help',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Get AI Help
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h3 className="text-white font-medium text-sm mb-1">Question</h3>
            <p className="text-gray-300 text-sm">{question}</p>
          </div>

          {/* Tips */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-sm">
                Helpful Tips
              </span>
            </div>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>
                • Use specific examples and evidence to support your points
              </li>
              <li>• Address all parts of the question</li>
              <li>• Show your working for calculation questions</li>
              <li>• Use subject-specific terminology correctly</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="help-request" className="text-white text-sm font-medium">
              What do you need help with?
            </label>
            <Textarea
              id="help-request"
              value={helpRequest}
              onChange={(e) => setHelpRequest(e.target.value)}
              placeholder="e.g., I'm stuck on the first part, can you explain the key concepts I should consider?"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={generateAIHelp}
              disabled={isGenerating || !helpRequest.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Get Help
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
