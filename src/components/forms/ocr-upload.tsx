'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Upload, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

export function OCRArea({ onTextExtracted }: { onTextExtracted: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSummerPromotion, setIsSummerPromotion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // For now, we'll assume it's always summer promotion since we're removing Pro features
    setIsSummerPromotion(true);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.match('image.*')) {
      setUploadError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('limit')) {
          setUploadError('Daily usage limit exceeded. Please try again tomorrow.');
        } else {
          setUploadError(data.error || 'Failed to process image. Please try again.');
        }
        return;
      }

      if (data.text) {
        onTextExtracted(data.text);
        toast({
          title: 'Text extracted successfully',
          description: `Extracted ${data.text.length} characters in ${Math.round(data.processingTime)}ms`,
        });
      }
    } catch (error) {
      setUploadError('Failed to process image. Please try again.');
      console.error('OCR error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`bg-white/5 backdrop-blur-sm border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-white/20 hover:border-white/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Handwritten Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-6 text-white border-white/20 hover:bg-white/10"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span>Click to upload or drag and drop</span>
                  <span className="text-sm text-gray-400">Max 5MB (JPEG, PNG, etc.)</span>
                </div>
              )}
            </Button>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{uploadError}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature notice */}
      <div
        className={`rounded-lg p-4 border ${isSummerPromotion ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle
            className={`h-4 w-4 ${isSummerPromotion ? 'text-green-400' : 'text-blue-400'}`}
          />
          <span className="text-white font-medium">
            {isSummerPromotion
              ? 'Summer of Learning - OCR Unlocked!'
              : 'Handwriting Recognition'}
          </span>
        </div>
        <p className="text-gray-300 text-sm">
          {isSummerPromotion
            ? 'During our Summer of Learning promotion, handwriting recognition is free for everyone!'
            : 'Upload photos of handwritten work to automatically extract text for marking.'}
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Supports: 80+ languages, handwriting, printed text, mathematical
          equations, and complex layouts with high accuracy.
        </p>
      </div>
    </div>
  );
}
