import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { db } from '@/lib/db';
import { EasyOCRProcessor } from '@/lib/ocr/easyocr';

const ocrProcessor = new EasyOCRProcessor();

export async function POST(req: NextRequest) {
  try {
    // Clerk removed: skipping userId check

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has Pro subscription for OCR
    if (user.subscriptionTier !== 'PRO') {
      return NextResponse.json(
        {
          error:
            'OCR is a Pro feature. Please upgrade to access handwriting recognition.',
        },
        { status: 403 }
      );
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(user.id);
    if (!usageCheck.canUse) {
      return NextResponse.json(
        { error: 'Daily usage limit exceeded' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Process image with EasyOCR
      const ocrResult = await ocrProcessor.processImage(buffer, file.type);

      // Store OCR usage in database
      const dbClient = await db;
      await dbClient.from('submissions').insert({
        user_id: user.id,
        question: 'OCR Extraction',
        answer: ocrResult.text,
        subject: 'OCR',
        exam_board: 'N/A',
      });

      // Increment usage
      await incrementUsage(user.id);

      return NextResponse.json({
        success: true,
        result: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
          metadata: {
            fileSize: file.size,
            fileName: file.name,
            processedAt: new Date().toISOString(),
            language: ocrResult.metadata?.language,
            detectedRegions: ocrResult.metadata?.detectedRegions,
          },
        },
      });
    } catch (ocrError) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('OCR processing failed:', ocrError);
      }
      return NextResponse.json(
        {
          error:
            'Failed to process image. Please try again with a clearer image.',
          details:
            ocrError instanceof Error ? ocrError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('OCR API error:', error);
    }
    return NextResponse.json(
      {
        error: 'OCR processing failed. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Clerk removed: skipping userId check

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if OCR service is available
    const isHealthy = await ocrProcessor.healthCheck();

    return NextResponse.json({
      available: user.subscriptionTier === 'PRO',
      serviceHealthy: isHealthy,
      tier: user.subscriptionTier,
      supportedFormats: ['JPG', 'PNG', 'GIF', 'WebP'],
      maxFileSize: '5MB',
      features: [
        'Handwritten text recognition',
        'Mathematical expressions',
        'Printed text extraction',
        'Multi-language support',
      ],
      supportedLanguages: [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ru',
        'ja',
        'ko',
        'zh',
      ],
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('OCR info API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
