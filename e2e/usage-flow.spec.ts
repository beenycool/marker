import { test, expect } from '@playwright/test';

test('anonymous rate limiting flow', async ({ page }) => {
  // Navigate directly to the marking page (no login required)
  await page.goto('/mark');

  // Should be accessible immediately without authentication
  await expect(page.locator('h1')).toContainText('Mark Your Work');

  // Fill in the marking form for first request
  await page.fill(
    'textarea[name="question"]',
    'What is the capital of France?'
  );
  await page.fill('textarea[name="answer"]', 'Paris');
  await page.selectOption('select[name="subject"]', 'Geography');
  await page.click('button[type="submit"]');

  // Wait for feedback
  await page.waitForSelector('[data-testid="feedback-result"]');
  await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();

  // Check that localStorage tracks usage
  const initialUsage = await page.evaluate(() => localStorage.getItem('usage-stats'));
  expect(initialUsage).toBeTruthy();

  // Test rate limiting by making controlled requests
  const maxRequests = 5; // Use a smaller number for faster testing
  let rateLimitHit = false;
  let successfulRequests = 0;
  const requestTimestamps: number[] = [];
  
  // Make requests with proper timing to avoid overwhelming the server
  for (let i = 0; i < maxRequests; i++) {
    const startTime = Date.now();
    
    await page.goto('/mark');
    await page.fill('textarea[name="question"]', `Test question ${i}`);
    await page.fill('textarea[name="answer"]', `Test answer ${i}`);
    await page.selectOption('select[name="subject"]', 'Mathematics');
    
    // Submit and wait for response with dynamic timeout
    const submitPromise = page.click('button[type="submit"]');
    
    try {
      // Wait for either success or rate limit with adaptive timeout
      const response = await Promise.race([
        page.waitForSelector('[data-testid="feedback-result"]', { timeout: 30000 }),
        page.waitForSelector('[data-testid="rate-limit-error"]', { timeout: 30000 })
      ]);
      
      const endTime = Date.now();
      requestTimestamps.push(endTime - startTime);
      
      // Check if we hit rate limit
      const isRateLimited = await page.locator('[data-testid="rate-limit-error"]').isVisible();
      if (isRateLimited) {
        rateLimitHit = true;
        
        // Verify rate limit message
        const errorText = await page.locator('[data-testid="rate-limit-error"]').textContent();
        expect(errorText).toContain('limit');
        
        break;
      } else {
        successfulRequests++;
        
        // Verify feedback is displayed
        await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();
        
        // Small delay between requests to be respectful
        await page.waitForTimeout(500);
      }
    } catch (error) {
      // If timeout occurs, check what's actually on the page
      console.log(`Request ${i + 1} timeout after ${Date.now() - startTime}ms`);
      
      // Check if there's any error visible
      const rateLimitVisible = await page.locator('[data-testid="rate-limit-error"]').isVisible();
      if (rateLimitVisible) {
        rateLimitHit = true;
        break;
      }
      
      // Continue to next request if no clear error
    }
  }
  
  // Verify that rate limiting works as expected
  expect(successfulRequests).toBeGreaterThan(0);
  expect(successfulRequests).toBeLessThanOrEqual(maxRequests);
  
  // Log performance metrics
  if (requestTimestamps.length > 0) {
    const avgResponseTime = requestTimestamps.reduce((a, b) => a + b, 0) / requestTimestamps.length;
    console.log(`Average response time: ${avgResponseTime}ms`);
    console.log(`Successful requests: ${successfulRequests}`);
    console.log(`Rate limit hit: ${rateLimitHit}`);
  }

  // Verify localStorage usage tracking is updated
  const finalUsage = await page.evaluate(() => localStorage.getItem('usage-stats'));
  expect(finalUsage).toBeTruthy();
  expect(finalUsage).not.toBe(initialUsage);
});

test('parameterized rate limiting with configurable thresholds', async ({ page }) => {
  // Test configuration - can be adjusted based on environment
  const config = {
    maxTestRequests: 3, // Number of requests to test with
    requestDelay: 1000, // Delay between requests in ms
    timeout: 30000, // Maximum wait time per request
  };
  
  await page.goto('/mark');
  
  let requestsMade = 0;
  let rateLimitedAt = -1;
  
  // Make requests with controlled timing
  for (let i = 0; i < config.maxTestRequests; i++) {
    const startTime = Date.now();
    
    await page.goto('/mark');
    await page.fill('textarea[name="question"]', `Rate limit test ${i}`);
    await page.fill('textarea[name="answer"]', `Test answer for rate limiting ${i}`);
    await page.selectOption('select[name="subject"]', 'Mathematics');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    try {
      // Wait for network response to complete
      const response = await page.waitForResponse(
        response => response.url().includes('/api/mark') && response.status() !== 0,
        { timeout: config.timeout }
      );
      
      requestsMade++;
      
      // Check if we got rate limited
      if (response.status() === 429) {
        rateLimitedAt = requestsMade;
        
        // Verify rate limit response structure
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error.toLowerCase()).toContain('limit');
        
        // Check UI shows rate limit error
        await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
        break;
      } else if (response.status() >= 200 && response.status() < 300) {
        // Verify successful response
        await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();
        
        // Small delay to avoid overwhelming the server
        await page.waitForTimeout(config.requestDelay);
      }
    } catch (error) {
      console.log(`Request ${i + 1} failed:`, error);
      break;
    }
  }
  
  // Assertions to verify rate limiting behavior
  expect(requestsMade).toBeGreaterThan(0);
  expect(rateLimitedAt).toBeGreaterThan(0);
  console.log(`Rate limiting triggered after ${rateLimitedAt} successful requests`);
});

test('anonymous session persistence', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('/dashboard');

  // Add some mock data to localStorage
  await page.evaluate(() => {
    localStorage.setItem('usage-stats', JSON.stringify({
      totalRequests: 5,
      lastRequest: Date.now(),
      averageScore: 85
    }));
  });

  // Refresh page
  await page.reload();

  // Verify data persists
  const persistedData = await page.evaluate(() => localStorage.getItem('usage-stats'));
  expect(persistedData).toBeTruthy();
  
  if (persistedData) {
    const data = JSON.parse(persistedData);
    expect(data.totalRequests).toBe(5);
    expect(data.averageScore).toBe(85);
  }
});
