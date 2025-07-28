'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Camera,
  FileImage,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';
import { trackUpgradePromptShown } from '@/lib/analytics';
import { isSummerPromotionActive } from '@/lib/auth';

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export function OCRUpload({ onTextExtracted, disabled }: OCRUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    text: string;
    confidence: number;
    processingTime: number;
    language?: string;
    detectedRegions?: number;
  } | null>(null);
  const { toast } = useToast();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSummerPromotion, setIsSummerPromotion] = useState(false);

  // Remove Clerk dependency - assume no pro access for now
  const hasProAccess = isSummerPromotion;

  useEffect(() => {
    // Check if summer promotion is active
    const checkPromotion = async () => {
      try {
        const isActive = await isSummerPromotionActive();
        setIsSummerPromotion(isActive);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking summer promotion:', error);
        setIsSummerPromotion(false);
      }
    };

    checkPromotion();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!hasProAccess) {
      setShowUpgradePrompt(true);
      trackUpgradePromptShown();
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasProAccess) {
      setShowUpgradePrompt(true);
      trackUpgradePromptShown();
      e.preventDefault();
      return;
    }
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error) {
          if (data.error.includes('blurry') || data.error.includes('unclear')) {
            throw new Error(
              'The image appears blurry or unclear. Please try again with a better quality image.'
            );
          } else if (data.error.includes('handwriting')) {
            throw new Error(
              'The handwriting is difficult to read. Please write more clearly or try a different image.'
            );
          } else if (data.error.includes('lighting')) {
            throw new Error(
              'The lighting conditions are poor. Please try again in better lighting.'
            );
          } else if (data.error.includes('angle')) {
            throw new Error(
              'The image is taken at an angle. Please take a photo directly above the document.'
            );
          } else if (data.error.includes('glare')) {
            throw new Error(
              'There is glare on the image. Please adjust the lighting to reduce reflections.'
            );
          } else if (data.error.includes('resolution')) {
            throw new Error(
              'The image resolution is too low. Please use a higher resolution image.'
            );
          } else if (data.error.includes('file type')) {
            throw new Error(
              'Unsupported file type. Please upload JPG, PNG, GIF, or WebP images.'
            );
          } else if (data.error.includes('size')) {
            throw new Error('File too large. Maximum size is 5MB.');
          } else if (data.error.includes('Pro feature')) {
            throw new Error(
              'OCR is a Pro feature. Please upgrade to access handwriting recognition.'
            );
          } else if (data.error.includes('limit')) {
            throw new Error(
              'Daily usage limit exceeded. Please try again tomorrow.'
            );
          }
        }
        throw new Error(
          data.error ||
            'OCR processing failed. Please try again with a clearer image.'
        );
      }

      clearInterval(progressInterval);
      setProgress(100);

      const ocrResult = {
        text: data.result.text,
        confidence: data.result.confidence,
        processingTime: data.result.processingTime,
        language: data.result.metadata?.language,
        detectedRegions: data.result.metadata?.detectedRegions,
      };

      setResult(ocrResult);
      onTextExtracted(data.result.text);

      toast({
        title: 'OCR Complete! 📝',
        description: `Text extracted with ${(ocrResult.confidence * 100).toFixed(1)}% confidence`,
        variant: 'default',
      });
    } catch (error) {
      setProgress(0);

      toast({
        title: 'OCR Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to extract text from image. Please try again with a clearer image.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setResult(null);
    setProcessing(false);
  };

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        context="pro_feature"
        onClose={() => setShowUpgradePrompt(false)}
      />
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Handwritten Work
        </CardTitle>
        <CardDescription className="text-gray-300">
          Upload photos of handwritten answers for automatic text extraction
          powered by EasyOCR
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!selectedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Drop your image here or click to browse
            </h3>
            <p className="text-gray-400 mb-4">
              Supports JPG, PNG, WebP up to 5MB
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
              disabled={disabled || !hasProAccess}
            />
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              disabled={disabled || !hasProAccess}
              onClick={() => {
                if (!hasProAccess) {
                  setShowUpgradePrompt(true);
                  trackUpgradePromptShown();
                }
              }}
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <FileImage className="h-4 w-4 mr-2" />
                Choose Image
              </label>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative">
              <Image
                src={preview!}
                alt="Preview"
                width={400}
                height={256}
                className="w-full max-h-64 object-contain rounded-lg bg-gray-800"
                style={{ maxHeight: '256px' }}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 border-white/20 text-white hover:bg-white/10"
                onClick={reset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* File info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Ready for OCR
              </Badge>
            </div>

            {/* Processing */}
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">
                    Processing with EasyOCR...
                  </span>
                  <span className="text-gray-400 text-sm">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-white font-medium">
                    Text Extracted Successfully
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Confidence: </span>
                    <span className="text-white">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Processing Time: </span>
                    <span className="text-white">
                      {result.processingTime}ms
                    </span>
                  </div>
                  {result.language && (
                    <div>
                      <span className="text-gray-400">Language: </span>
                      <span className="text-white uppercase">
                        {result.language}
                      </span>
                    </div>
                  )}
                  {result.detectedRegions && (
                    <div>
                      <span className="text-gray-400">Regions: </span>
                      <span className="text-white">
                        {result.detectedRegions}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">
                    {result.text.substring(0, 200)}...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!result && (
                <Button
                  onClick={processOCR}
                  disabled={processing || disabled || !hasProAccess}
                  className="bg-blue-600 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Extract Text
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={reset}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {result ? 'Upload Another' : 'Reset'}
              </Button>
            </div>
          </div>
        )}

        {/* Pro feature notice */}
        <div
          className={`rounded-lg p-4 border ${isSummerPromotion ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-100 border-blue-500/20'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle
              className={`h-4 w-4 ${isSummerPromotion ? 'text-green-400' : 'text-blue-400'}`}
            />
            <span className="text-white font-medium">
              {isSummerPromotion
                ? 'Summer of Learning - OCR Unlocked!'
                : 'Pro Feature - Powered by EasyOCR'}
            </span>
          </div>
          <p className="text-gray-300 text-sm">
            {isSummerPromotion
              ? 'During our Summer of Learning promotion, all Pro features including OCR are free for everyone!'
              : 'Advanced OCR handwriting recognition using EasyOCR. Upload photos of handwritten work to automatically extract text for marking.'}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Supports: 80+ languages, handwriting, printed text, mathematical
            equations, and complex layouts with high accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
