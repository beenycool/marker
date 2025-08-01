import { test, expect } from '@playwright/test';

test.describe('Improved Rate Limiting Tests', () => {
  test('dynamic rate limiting with verification', async ({ page }) => {
    await page.goto('/mark');
    await expect(page.locator('h1')).toContainText('Mark Your Work');

    // First successful request
    await page.fill('textarea[name="question"]', 'What is 2+2?');
    await page.fill('textarea[name="answer"]', '4');
    await page.selectOption('select[name="subject"]', 'Mathematics');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="feedback-result"]');
    await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();

    // Dynamic rate limit testing
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '8', 10);
    let successfulRequests = 0;
    let rateLimitHitAt: number | null = null;
    const responseTimes: number[] = [];

    for (let i = 0; i < maxRequests; i++) {
      const startTime = Date.now();
      
      await page.goto('/mark');
      await page.fill('textarea[name="question"]', `Test question ${i + 1}`);
      await page.fill('textarea[name="answer"]', `Test answer ${i + 1}`);
      await page.selectOption('select[name="subject"]', 'Mathematics');
      
      await page.click('button[type="submit"]');
      
      try {
        const response = await page.waitForResponse(
          (response: any) => response.url().includes('/api/mark'),
          { timeout: 15000 }
        );
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        if (response.status() === 429) {
          rateLimitHitAt = i + 1;
          
          // Verify rate limit response
          const responseBody = await response.json();
          expect(responseBody).toHaveProperty('error');
          
          // Check UI shows rate limit error
          const rateLimitError = page.locator('[data-testid="rate-limit-error"]');
          await rateLimitError.waitFor({ state: 'visible', timeout: 5000 });
          
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          successfulRequests++;
          
          // Verify successful feedback
          const feedbackResult = page.locator('[data-testid="feedback-result"]');
          await feedbackResult.waitFor({ state: 'visible', timeout: 5000 });
          
          // Dynamic delay based on response time
          const delay = Math.max(200, Math.min(1000, responseTimes[responseTimes.length - 1] * 0.5));
          await page.waitForTimeout(delay);
        }
      } catch (error) {
        console.log(`Request ${i + 1} failed:`, error);
        break;
      }
    }

    // Assertions to verify rate limiting behavior
    expect(successfulRequests).toBeGreaterThan(0);
    expect(rateLimitHitAt).not.toBeNull();
    expect(responseTimes.length).toBeGreaterThan(0);
    
    // Verify response times are reasonable
    const maxResponseTime = Math.max(...responseTimes);
    expect(maxResponseTime).toBeLessThan(10000);
    
    console.log(`Rate limit triggered at request ${rateLimitHitAt}`);
    console.log(`Successful requests: ${successfulRequests}`);
    console.log(`Average response time: ${Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)}ms`);
  });

  test('parameterized rate limit configuration', async ({ page }) => {
    const config = {
      maxRequests: parseInt(process.env.TEST_RATE_LIMIT_MAX || '6', 10),
      minDelay: parseInt(process.env.TEST_RATE_LIMIT_MIN_DELAY || '100', 10),
      maxDelay: parseInt(process.env.TEST_RATE_LIMIT_MAX_DELAY || '2000', 10),
      timeout: parseInt(process.env.TEST_RATE_LIMIT_TIMEOUT || '15000', 10),
    };

    await page.goto('/mark');
    
    let requestsMade = 0;
    let rateLimitedAt: number | null = null;

    for (let i = 0; i < config.maxRequests; i++) {
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
        
        if (response.status() === 429) {
          rateLimitedAt = requestsMade + 1;
          break;
        } else if (response.status() >= 200 && response.status() < 300) {
          requestsMade++;
          
          // Dynamic delay based on configuration
          const delay = Math.max(
            config.minDelay,
            Math.min(config.maxDelay, 500)
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
    
    console.log(`Rate limit threshold detected: ${rateLimitedAt} requests`);
  });
});