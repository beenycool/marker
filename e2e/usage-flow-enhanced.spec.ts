import { test, expect } from '@playwright/test';
import { RateLimitTestHelper, rateLimitConfig } from './test-config';

test.describe('Rate Limiting Tests', () => {
  test('anonymous rate limiting with dynamic configuration', async ({ page }) => {
    // Navigate to marking page
    await page.goto('/mark');
    await expect(page.locator('h1')).toContainText('Mark Your Work');

    // First successful request to establish baseline
    await page.fill('textarea[name="question"]', 'What is the capital of France?');
    await page.fill('textarea[name="answer"]', 'Paris');
    await page.selectOption('select[name="subject"]', 'Geography');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="feedback-result"]');
    await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();

    // Check initial usage tracking
    const initialUsage = await page.evaluate(() => localStorage.getItem('usage-stats'));
    expect(initialUsage).toBeTruthy();

    // Use the enhanced rate limit test helper
    const testHelper = new RateLimitTestHelper({
      ...rateLimitConfig,
      maxTestRequests: 10, // Test up to 10 requests to find threshold
      requestDelay: 500,   // Shorter delay for faster testing
    });

    const metrics = await testHelper.executeRateLimitTest(page);
    testHelper.logMetrics(metrics);

    // Assertions to verify rate limiting behavior
    expect(metrics.successfulRequests).toBeGreaterThan(0);
    expect(metrics.rateLimitTriggered).toBe(true);
    expect(metrics.rateLimitThreshold).toBeDefined();
    
    // Verify the threshold is reasonable (between 3-8 requests for testing)
    expect(metrics.rateLimitThreshold).toBeGreaterThanOrEqual(3);
    expect(metrics.rateLimitThreshold).toBeLessThanOrEqual(8);

    // Verify usage tracking was updated
    const finalUsage = await page.evaluate(() => localStorage.getItem('usage-stats'));
    expect(finalUsage).toBeTruthy();
    expect(finalUsage).not.toBe(initialUsage);
  });

  test('rate limiting with adaptive timing', async ({ page }) => {
    await page.goto('/mark');
    
    const maxRequests = 15;
    const requestTimestamps: number[] = [];
    let rateLimitHit = false;
    let successfulRequests = 0;

    for (let i = 0; i < maxRequests; i++) {
      const requestStart = Date.now();
      
      await page.goto('/mark');
      await page.fill('textarea[name="question"]', `Adaptive test ${i}`);
      await page.fill('textarea[name="answer"]', `Test answer ${i}`);
      await page.selectOption('select[name="subject"]', 'Mathematics');
      
      await page.click('button[type="submit"]');
      
      try {
        const response = await page.waitForResponse(
          (response: any) => response.url().includes('/api/mark'),
          { timeout: 10000 }
        );
        
        const requestEnd = Date.now();
        requestTimestamps.push(requestEnd - requestStart);
        
        if (response.status() === 429) {
          rateLimitHit = true;
          
          // Verify rate limit response structure
          const responseBody = await response.json();
          expect(responseBody).toHaveProperty('error');
          expect(typeof responseBody.error).toBe('string');
          
          // Check UI shows rate limit error
          const rateLimitError = page.locator('[data-testid="rate-limit-error"]');
          await rateLimitError.waitFor({ state: 'visible', timeout: 5000 });
          
          console.log(`Rate limit triggered after ${successfulRequests + 1} requests`);
          console.log(`Average response time: ${requestTimestamps.reduce((a, b) => a + b, 0) / requestTimestamps.length}ms`);
          
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          successfulRequests++;
          
          // Verify successful feedback
          const feedbackResult = page.locator('[data-testid="feedback-result"]');
          await feedbackResult.waitFor({ state: 'visible', timeout: 5000 });
          
          // Dynamic delay based on response time
          const lastResponseTime = requestTimestamps[requestTimestamps.length - 1];
          const delay = Math.max(200, Math.min(1000, lastResponseTime * 0.5));
          await page.waitForTimeout(delay);
        }
      } catch (error) {
        console.log(`Request ${i + 1} failed or timed out:`, error);
        break;
      }
    }

    expect(rateLimitHit).toBe(true);
    expect(successfulRequests).toBeGreaterThan(0);
    expect(requestTimestamps.length).toBeGreaterThan(0);
    
    // Verify response times are reasonable (under 5 seconds)
    const maxResponseTime = Math.max(...requestTimestamps);
    expect(maxResponseTime).toBeLessThan(5000);
  });

  test('parameterized rate limiting with environment variables', async ({ page }) => {
    // Use environment-specific configuration
    const config = {
      maxRequests: parseInt(process.env.TEST_RATE_LIMIT_MAX || '8', 10),
      minDelay: parseInt(process.env.TEST_RATE_LIMIT_MIN_DELAY || '100', 10),
      maxDelay: parseInt(process.env.TEST_RATE_LIMIT_MAX_DELAY || '2000', 10),
      timeout: parseInt(process.env.TEST_RATE_LIMIT_TIMEOUT || '15000', 10),
    };

    await page.goto('/mark');
    
    let requestsMade = 0;
    let rateLimitedAt: number | null = null;
    const responseTimes: number[] = [];

    for (let i = 0; i < config.maxRequests; i++) {
      const startTime = Date.now();
      
      await page.goto('/mark');
      await page.fill('textarea[name="question"]', `Parameterized test ${i}`);
      await page.fill('textarea[name="answer"]', `Parameterized answer ${i}`);
      await page.selectOption('select[name="subject"]', 'Science');
      
      await page.click('button[type="submit"]');
      
      try {
        const response = await page.waitForResponse(
          (response: any) => response.url().includes('/api/mark'),
          { timeout: config.timeout }
        );
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        if (response.status() === 429) {
          rateLimitedAt = requestsMade + 1;
          
          // Verify rate limit details
          const responseBody = await response.json();
          expect(responseBody).toHaveProperty('error');
          
          const errorMessage = responseBody.error.toLowerCase();
          expect(errorMessage).toMatch(/limit|rate|quota/);
          
          // Check UI elements
          const rateLimitElement = page.locator('[data-testid="rate-limit-error"]');
          await rateLimitElement.waitFor({ state: 'visible' });
          
          console.log(`Rate limit hit at request ${rateLimitedAt}`);
          console.log(`Response times: ${responseTimes.join(', ')}ms`);
          
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          requestsMade++;
          
          // Verify successful feedback
          const feedbackElement = page.locator('[data-testid="feedback-result"]');
          await feedbackElement.waitFor({ state: 'visible' });
          
          // Dynamic delay based on response time
          const delay = Math.max(
            config.minDelay,
            Math.min(config.maxDelay, responseTimes[responseTimes.length - 1] * 0.3)
          );
          await page.waitForTimeout(delay);
        }
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error);
        break;
      }
    }

    expect(rateLimitedAt).not.toBeNull();
    expect(requestsMade).toBeGreaterThan(0);
    expect(responseTimes.length).toBeGreaterThan(0);
    
    // Log summary
    console.log(`Test completed: ${requestsMade} successful requests before rate limit`);
    console.log(`Rate limit threshold: ${rateLimitedAt}`);
    console.log(`Average response time: ${Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)}ms`);
  });

  test('rate limit recovery and reset behavior', async ({ page }) => {
    await page.goto('/mark');
    
    // First, hit the rate limit
    let rateLimited = false;
    let successfulBeforeLimit = 0;
    
    for (let i = 0; i < 20; i++) {
      await page.goto('/mark');
      await page.fill('textarea[name="question"]', `Recovery test ${i}`);
      await page.fill('textarea[name="answer"]', `Recovery answer ${i}`);
      await page.selectOption('select[name="subject"]', 'English');
      
      await page.click('button[type="submit"]');
      
      try {
        const response = await page.waitForResponse(
          (response: any) => response.url().includes('/api/mark'),
          { timeout: 10000 }
        );
        
        if (response.status() === 429) {
          rateLimited = true;
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          successfulBeforeLimit++;
          await page.waitForTimeout(500);
        }
      } catch (error) {
        break;
      }
    }
    
    expect(rateLimited).toBe(true);
    expect(successfulBeforeLimit).toBeGreaterThan(0);
    
    // Test recovery - wait and try again
    console.log(`Waiting for rate limit reset after ${successfulBeforeLimit} requests...`);
    
    // Wait for rate limit reset (adjust based on your rate limit window)
    await page.waitForTimeout(60000); // 1 minute
    
    // Try another request
    await page.goto('/mark');
    await page.fill('textarea[name="question"]', 'Recovery test after reset');
    await page.fill('textarea[name="answer"]', 'Should work now');
    await page.selectOption('select[name="subject"]', 'History');
    
    await page.click('button[type="submit"]');
    
    const response = await page.waitForResponse(
      (response: any) => response.url().includes('/api/mark'),
      { timeout: 10000 }
    );
    
    expect(response.status()).toBe(200);
    
    const feedbackResult = page.locator('[data-testid="feedback-result"]');
    await feedbackResult.waitFor({ state: 'visible' });
  });
});