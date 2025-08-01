import { Page } from '@playwright/test';

export interface RateLimitTestConfig {
  maxTestRequests: number;
  requestDelay: number;
  timeout: number;
  minDelay: number;
  maxDelay: number;
}

export interface RateLimitMetrics {
  successfulRequests: number;
  rateLimitTriggered: boolean;
  rateLimitThreshold: number | null;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalRequests: number;
}

export const rateLimitConfig: RateLimitTestConfig = {
  maxTestRequests: 10,
  requestDelay: 500,
  timeout: 15000,
  minDelay: 200,
  maxDelay: 2000,
};

export class RateLimitTestHelper {
  private config: RateLimitTestConfig;

  constructor(config: RateLimitTestConfig) {
    this.config = config;
  }

  async executeRateLimitTest(page: Page): Promise<RateLimitMetrics> {
    const metrics: RateLimitMetrics = {
      successfulRequests: 0,
      rateLimitTriggered: false,
      rateLimitThreshold: null,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      totalRequests: 0,
    };

    const responseTimes: number[] = [];

    for (let i = 0; i < this.config.maxTestRequests; i++) {
      const requestStart = Date.now();
      
      await page.goto('/mark');
      await page.fill('textarea[name="question"]', `Rate limit test ${i}`);
      await page.fill('textarea[name="answer"]', `Test answer ${i}`);
      await page.selectOption('select[name="subject"]', 'Mathematics');
      
      await page.click('button[type="submit"]');
      
      try {
        const response = await page.waitForResponse(
          (response: any) => response.url().includes('/api/mark'),
          { timeout: this.config.timeout }
        );
        
        const requestEnd = Date.now();
        const responseTime = requestEnd - requestStart;
        responseTimes.push(responseTime);
        
        metrics.totalRequests = i + 1;
        
        if (response.status() === 429) {
          metrics.rateLimitTriggered = true;
          metrics.rateLimitThreshold = i + 1;
          
          // Verify rate limit response
          const responseBody = await response.json();
          if (responseBody && typeof responseBody === 'object') {
            expect(responseBody).toHaveProperty('error');
          }
          
          // Check UI shows rate limit error
          const rateLimitError = page.locator('[data-testid="rate-limit-error"]');
          await rateLimitError.waitFor({ state: 'visible', timeout: 5000 });
          
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          metrics.successfulRequests++;
          
          // Verify successful feedback
          const feedbackResult = page.locator('[data-testid="feedback-result"]');
          await feedbackResult.waitFor({ state: 'visible', timeout: 5000 });
          
          // Dynamic delay based on response time
          const delay = Math.max(
            this.config.minDelay,
            Math.min(this.config.maxDelay, responseTime * 0.5)
          );
          await page.waitForTimeout(delay);
        }
      } catch (error) {
        console.log(`Request ${i + 1} failed:`, error);
        break;
      }
    }

    // Calculate metrics
    if (responseTimes.length > 0) {
      metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      metrics.maxResponseTime = Math.max(...responseTimes);
      metrics.minResponseTime = Math.min(...responseTimes);
    }

    return metrics;
  }

  logMetrics(metrics: RateLimitMetrics): void {
    console.log('=== Rate Limit Test Results ===');
    console.log(`Total requests made: ${metrics.totalRequests}`);
    console.log(`Successful requests: ${metrics.successfulRequests}`);
    console.log(`Rate limit triggered: ${metrics.rateLimitTriggered}`);
    console.log(`Rate limit threshold: ${metrics.rateLimitThreshold || 'Not reached'}`);
    console.log(`Average response time: ${Math.round(metrics.averageResponseTime)}ms`);
    console.log(`Max response time: ${Math.round(metrics.maxResponseTime)}ms`);
    console.log(`Min response time: ${Math.round(metrics.minResponseTime)}ms`);
    console.log('===============================');
  }

  async waitForRateLimitReset(page: Page, waitTime: number = 60000): Promise<void> {
    console.log(`Waiting ${waitTime}ms for rate limit reset...`);
    await page.waitForTimeout(waitTime);
  }

  async verifyRateLimitHeaders(response: any): Promise<void> {
    const headers = response.headers();
    
    // Check for common rate limit headers
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'retry-after',
      'x-rate-limit-limit',
      'x-rate-limit-remaining',
      'x-rate-limit-reset',
    ];
    
    const foundHeaders = rateLimitHeaders.filter(header => headers[header]);
    
    if (foundHeaders.length > 0) {
      console.log('Rate limit headers found:', foundHeaders);
      
      // Verify header values
      for (const header of foundHeaders) {
        const value = headers[header];
        expect(value).toBeTruthy();
        
        if (header.includes('limit')) {
          expect(parseInt(value, 10)).toBeGreaterThan(0);
        }
      }
    }
  }
}

export class EnvironmentRateLimitConfig {
  static fromEnvironment(): RateLimitTestConfig {
    return {
      maxTestRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '8', 10),
      requestDelay: parseInt(process.env.RATE_LIMIT_DELAY || '500', 10),
      timeout: parseInt(process.env.RATE_LIMIT_TIMEOUT || '15000', 10),
      minDelay: parseInt(process.env.RATE_LIMIT_MIN_DELAY || '200', 10),
      maxDelay: parseInt(process.env.RATE_LIMIT_MAX_DELAY || '2000', 10),
    };
  }
}