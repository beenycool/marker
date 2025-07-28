import { test, expect } from '@playwright/test';

test('past papers flow', async ({ page }) => {
  // Navigate to past papers page
  await page.goto('/past-papers');

  // Sign in with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for navigation to past papers page
  await page.waitForURL('/past-papers');

  // Verify page elements
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

  // Try to answer a question
  await page.click('[data-testid="answer-button"]');
  await page.fill('[data-testid="answer-input"]', 'This is my answer');
  await page.click('[data-testid="submit-answer"]');

  // Wait for feedback
  await page.waitForSelector('[data-testid="feedback-result"]');
  await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();
});
