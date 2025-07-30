import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ocrRateLimiter } from '@/lib/ocr/rate-limiter';
import { ocrCache } from '@/lib/ocr/cache';
import { ocrCircuitBreaker } from '@/lib/ocr/circuit-breaker';
import { ocrRetryHandler } from '@/lib/ocr/retry';
import { ocrMetrics } from '@/lib/ocr/metrics';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const OCR_TIMEOUT = 30000; // 30 seconds
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
];

interface OCRServiceResponse {
  text: string;
  confidence: number;
  processingTime?: number;
  regions?: number;
  language?: string;
  metadata?: any;
}

// Security headers for enhanced protection
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'none'");
  return response;
}

// Enhanced validation with security checks
function validateRequest(req: NextRequest): { valid: boolean; error?: string; apiKey?: string } {
  // API key validation
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.OCR_API_KEY) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Content-Type validation
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return { valid: false, error: 'Invalid content type. Use multipart/form-data' };
  }

  // Request size validation (basic check)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    return { valid: false, error: 'Request too large' };
  }

  return { valid: true, apiKey };
}

// Enhanced file validation
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file.name || file.name.length === 0) {
    return { valid: false, error: 'Invalid file name' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, GIF, WebP, or BMP images.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  if (file.size < 100) {
    return { valid: false, error: 'File too small. Minimum size is 100 bytes.' };
  }

  return { valid: true };
}

// OCR service call with timeout and compression
async function callOCRService(
  formData: FormData,
  ocrEndpoint: string,
  ocrApiKey: string
): Promise<OCRServiceResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT);

  try {
    const response = await fetch(`${ocrEndpoint}/ocr`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${ocrApiKey}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'AIMARKER-CloudflareWorker/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OCR service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OCR service timeout');
    }
    throw error;
  }
}

// Optimized database operation with error handling
async function storeOCRUsage(apiKey: string, result: OCRServiceResponse): Promise<void> {
  try {
    const dbClient = await db;
    await dbClient.from('submissions').insert({
      api_key: apiKey,
      question: 'OCR Extraction',
      answer: result.text.substring(0, 10000), // Limit text length
      subject: 'OCR',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Log but don't fail the request for database issues
    logger.error('Failed to store OCR usage in database', error);
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  ocrMetrics.recordRequest();

  try {
    // Request validation
    const validation = validateRequest(req);
    if (!validation.valid) {
      const response = NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Invalid API key' ? 401 : 400 }
      );
      return addSecurityHeaders(response);
    }

    const apiKey = validation.apiKey!;

    // Rate limiting check
    const rateLimitResult = ocrRateLimiter.isAllowed(apiKey);
    if (!rateLimitResult.allowed) {
      ocrMetrics.recordRateLimit();
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          remaining: 0
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
      return addSecurityHeaders(response);
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      const response = NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // File validation
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      const response = NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Get file buffer for caching
    const fileBuffer = await file.arrayBuffer();
    const languages = ['en']; // Could be extended to parse from request
    const cacheKey = ocrCache.generateKey(fileBuffer, languages);

    // Check cache first
    const cachedResult = ocrCache.get(cacheKey);
    if (cachedResult) {
      ocrMetrics.recordCacheHit();
      ocrMetrics.recordSuccess(cachedResult.processingTime || 0);
      
      logger.info('OCR cache hit', {
        fileSize: file.size,
        processingTime: cachedResult.processingTime
      });

      const response = NextResponse.json({
        success: true,
        result: {
          ...cachedResult,
          cached: true,
          cacheKey: cacheKey.substring(0, 16) + '...'
        }
      });
      return addSecurityHeaders(response);
    }

    ocrMetrics.recordCacheMiss();

    // Environment variables validation
    const ocrEndpoint = process.env.OCR_SERVICE_ENDPOINT;
    const ocrApiKey = process.env.OCR_SERVICE_API_KEY;

    if (!ocrEndpoint || !ocrApiKey) {
      throw new Error('OCR service configuration missing');
    }

    // Prepare form data for OCR service
    const ocrFormData = new FormData();
    ocrFormData.append('image', new Blob([fileBuffer], { type: file.type }), file.name);
    ocrFormData.append('languages', JSON.stringify(languages));

    // OCR processing with circuit breaker and retry logic
    const ocrResult = await ocrCircuitBreaker.execute(async () => {
      return await ocrRetryHandler.execute(
        () => callOCRService(ocrFormData, ocrEndpoint, ocrApiKey),
        'OCR service call'
      );
    });

    const processingTime = Date.now() - startTime;
    ocrMetrics.recordSuccess(processingTime);

    // Enhanced result structure
    const result = {
      text: ocrResult.text || '',
      confidence: ocrResult.confidence || 0,
      processingTime,
      metadata: {
        fileSize: file.size,
        fileName: file.name.substring(0, 100), // Limit filename length
        processedAt: new Date().toISOString(),
        language: ocrResult.language || 'en',
        detectedRegions: ocrResult.regions || 0,
        cacheKey: cacheKey.substring(0, 16) + '...',
        ...ocrResult.metadata
      }
    };

    // Cache the result
    ocrCache.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hour TTL

    // Store usage in database (async, non-blocking)
    storeOCRUsage(apiKey, ocrResult).catch(error => {
      logger.error('Async database storage failed', error);
    });

    // Log successful processing
    logger.info('OCR processed successfully', {
      fileSize: file.size,
      confidence: result.confidence,
      textLength: result.text.length,
      processingTime,
      rateLimitRemaining: rateLimitResult.remaining
    });

    const response = NextResponse.json({
      success: true,
      result
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
        'X-Processing-Time': processingTime.toString()
      }
    });
    
    return addSecurityHeaders(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    ocrMetrics.recordFailure();

    // Circuit breaker specific error
    if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
      ocrMetrics.recordCircuitBreakerTrip();
      logger.warn('OCR request blocked by circuit breaker');
      
      const response = NextResponse.json(
        {
          error: 'OCR service temporarily unavailable. Please try again later.',
          retryAfter: 30
        },
        { status: 503 }
      );
      return addSecurityHeaders(response);
    }

    // Log error details for debugging
    logger.error('OCR API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
    });

    const response = NextResponse.json(
      {
        error: 'OCR processing failed. Please try again with a clearer image.',
        processingTime,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
    
    return addSecurityHeaders(response);
  }
}

export async function GET(req: NextRequest) {
  try {
    // API key validation
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.OCR_API_KEY) {
      const response = NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    const ocrEndpoint = process.env.OCR_SERVICE_ENDPOINT;
    const ocrApiKey = process.env.OCR_SERVICE_API_KEY;

    if (!ocrEndpoint || !ocrApiKey) {
      throw new Error('OCR service configuration missing');
    }

    // Health check with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let serviceHealthy = false;
    let healthData: any = {};

    try {
      const healthResponse = await fetch(`${ocrEndpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${ocrApiKey}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      healthData = await healthResponse.json();
      serviceHealthy = healthResponse.ok && healthData.status === 'healthy';
    } catch (error) {
      clearTimeout(timeoutId);
      logger.warn('OCR health check failed', { error: (error as Error).message });
    }

    // Get current metrics and circuit breaker state
    const metrics = ocrMetrics.getMetrics();
    const circuitBreakerState = ocrCircuitBreaker.getState();

    const response = NextResponse.json({
      available: true,
      serviceHealthy,
      supportedFormats: ['JPG', 'PNG', 'GIF', 'WebP', 'BMP'],
      maxFileSize: '5MB',
      features: [
        'Handwritten text recognition',
        'Mathematical expressions', 
        'Printed text extraction',
        'Multi-language support',
        'Intelligent caching',
        'Rate limiting protection',
        'Circuit breaker reliability'
      ],
      supportedLanguages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
      ],
      metrics: {
        requests: metrics.totalRequests,
        successRate: `${metrics.successRate}%`,
        cacheHitRate: `${metrics.cacheHitRate}%`,
        avgProcessingTime: `${Math.round(metrics.avgProcessingTime)}ms`
      },
      circuitBreaker: {
        state: circuitBreakerState.state,
        failures: circuitBreakerState.failures
      },
      serviceInfo: healthData
    });

    return addSecurityHeaders(response);

  } catch (error) {
    logger.error('OCR info API error', error);
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    
    return addSecurityHeaders(response);
  }
}
