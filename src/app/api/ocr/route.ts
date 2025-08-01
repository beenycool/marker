import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
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
function validateRequest(req: NextRequest): { valid: boolean; error?: string } {
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

  return { valid: true };
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

// OCR service call with timeout and Cloudflare Tunnel security
async function callOCRService(
  formData: FormData,
  ocrEndpoint: string,
  tunnelToken: string
): Promise<OCRServiceResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT);

  try {
    const response = await fetch(`${ocrEndpoint}/ocr`, {
      method: 'POST',
      body: formData,
      headers: {
        'CF-Access-Client-Id': process.env.OCR_TUNNEL_CLIENT_ID || '',
        'CF-Access-Client-Secret': process.env.OCR_TUNNEL_CLIENT_SECRET || '',
        'Authorization': `Bearer ${tunnelToken}`,
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

// GDPR-COMPLIANT: No personal data storage
// Only track anonymous aggregate statistics
function trackOCRUsage(): void {
  // Increment anonymous counter only
  // No personal data (extracted text) is stored
  logger.info('OCR processing completed (anonymous)', {
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  ocrMetrics.recordRequest();

  try {
    // Anonymous rate limiting (IP-based)
    const rateLimitResponse = await rateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Request validation
    const validation = validateRequest(req);
    if (!validation.valid) {
      const response = NextResponse.json(
        { error: validation.error, requestId },
        { status: 400 }
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
    const languages = ['en']; // TrOCR is primarily English-trained
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
    const tunnelToken = process.env.OCR_TUNNEL_TOKEN;

    if (!ocrEndpoint || !tunnelToken) {
      throw new Error('OCR service configuration missing');
    }

    // Prepare form data for OCR service
    const ocrFormData = new FormData();
    ocrFormData.append('image', new Blob([fileBuffer], { type: file.type }), file.name);

    // OCR processing with circuit breaker and retry logic
    const ocrResult = await ocrCircuitBreaker.execute(async () => {
      return await ocrRetryHandler.execute(
        () => callOCRService(ocrFormData, ocrEndpoint, tunnelToken),
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

    // GDPR-COMPLIANT: Track anonymous usage only
    trackOCRUsage();

    // Log successful processing (no personal data)
    logger.info('OCR processed successfully', {
      requestId,
      fileSize: file.size,
      confidence: result.confidence,
      textLength: result.text.length,
      processingTime
    });

    const response = NextResponse.json({
      success: true,
      result,
      requestId
    }, {
      headers: {
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
    const ocrEndpoint = process.env.OCR_SERVICE_ENDPOINT;
    const tunnelToken = process.env.OCR_TUNNEL_TOKEN;

    if (!ocrEndpoint || !tunnelToken) {
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
          'CF-Access-Client-Id': process.env.OCR_TUNNEL_CLIENT_ID || '',
          'CF-Access-Client-Secret': process.env.OCR_TUNNEL_CLIENT_SECRET || '',
          'Authorization': `Bearer ${tunnelToken}`,
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
        'Advanced handwritten text recognition',
        'Mathematical expressions and formulas', 
        'Student handwriting optimization',
        'High accuracy for educational content',
        'Intelligent caching',
        'Rate limiting protection',
        'Circuit breaker reliability'
      ],
      model: 'microsoft/trocr-base-handwritten',
      supportedLanguages: ['en'],
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
