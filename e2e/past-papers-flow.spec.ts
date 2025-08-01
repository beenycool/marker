import { test, expect } from '@playwright/test';

test('anonymous past papers flow', async ({ page }) => {
  // Navigate directly to past papers page (no login required)
  await page.goto('/past-papers');

  // Should be accessible immediately without authentication
  await expect(page.locator('h1')).toContainText('Past Papers');
  await expect(page.locator('[data-testid="subject-selector"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="exam-board-selector"]')
  ).toBeVisible();
  await expect(page.locator('[data-testid="year-selector"]')).toBeVisible();

  // Select subject
  await page.selectOption('[data-testid="subject-selector"]', 'Mathematics');

  // Select exam board
  await page.selectOption('[data-testid="exam-board-selector"]', 'AQA');

  // Select year
  await page.selectOption('[data-testid="year-selector"]', '2023');

  // Click search button
  await page.click('[data-testid="search-button"]');

  // Wait for results
  await page.waitForSelector('[data-testid="paper-result"]');

  // Verify results are displayed
  const results = page.locator('[data-testid="paper-result"]');
  await expect(results).toHaveCount(1);

  // Click on first result
  await results.first().click();

  // Wait for paper viewer
  await page.waitForURL('/past-papers/**');
  await expect(page.locator('[data-testid="paper-viewer"]')).toBeVisible();

  // Verify paper content  
  await expect(page.locator('[data-testid="question"]')).toHaveCount(1);

  // Try to answer a question anonymously
  await page.click('[data-testid="answer-button"]');
  await page.fill('[data-testid="answer-input"]', 'This is my answer');
  await page.click('[data-testid="submit-answer"]');

  // Wait for feedback
  await page.waitForSelector('[data-testid="feedback-result"]');
  await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();

  // Clear usage-stats before test to avoid pollution
  await page.evaluate(() => {
    try {
      localStorage.removeItem('usage-stats');
    } catch (error) {
      console.warn('Failed to clear usage-stats from localStorage:', error);
    }
  });

  // Verify anonymous usage tracking in localStorage with retry mechanism
  await expect(async () => {
    const usageData = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('usage-stats');
        if (!data) return null;
        
        const parsed = JSON.parse(data);
        // Validate expected data structure
        return {
          isValid: typeof parsed === 'object' && parsed !== null,
          hasTotalSubmissions: typeof parsed.totalSubmissions === 'number',
          hasAnonymousSubmissions: typeof parsed.anonymousSubmissions === 'number',
          hasLastActivity: typeof parsed.lastActivity === 'string',
          data: parsed
        };
      } catch (error) {
        console.error('Error accessing or parsing usage-stats:', error);
        return { error: true, message: error instanceof Error ? error.message : String(error) };
      }
    });

    if (usageData?.error) {
      throw new Error(`localStorage access error: ${usageData.message}`);
    }

    expect(usageData).not.toBeNull();
    expect(usageData?.isValid).toBe(true);
    expect(usageData?.hasTotalSubmissions).toBe(true);
    expect(usageData?.hasAnonymousSubmissions).toBe(true);
    expect(usageData?.hasLastActivity).toBe(true);
    
    // Additional validation: ensure anonymous submissions are tracked
    expect(usageData?.data.anonymousSubmissions).toBeGreaterThan(0);
    expect(usageData?.data.totalSubmissions).toBeGreaterThan(0);
  }).toPass({
    timeout: 5000,
    intervals: [500, 1000, 2000]
  });
});
