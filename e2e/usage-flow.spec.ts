import { test, expect } from '@playwright/test';

test('usage limit flow', async ({ page }) => {
  // Navigate to the marking page
  await page.goto('/mark');
  
  // Sign in with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to marking page
  await page.waitForURL('/mark');
  
  // Fill in the marking form
  await page.fill('textarea[name="question"]', 'What is the capital of France?');
  await page.fill('textarea[name="answer"]', 'Paris');
  await page.selectOption('select[name="subject"]', 'Geography');
  await page.click('button[type="submit"]');
  
  // Wait for feedback
  await page.waitForSelector('[data-testid="feedback-result"]');
  
  // Verify feedback is displayed
  await expect(page.locator('[data-testid="feedback-result"]')).toBeVisible();
  
  // Check usage counter
  const usageText = await page.locator('[data-testid="usage-counter"]').textContent();
  expect(usageText).toContain('1');
  
  // Try to exceed usage limit (assuming free tier limit is 5)
  for (let i = 0; i < 5; i++) {
    await page.goto('/mark');
    await page.fill('textarea[name="question"]', `Test question ${i}`);
    await page.fill('textarea[name="answer"]', `Test answer ${i}`);
    await page.selectOption('select[name="subject"]', 'Mathematics');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="feedback-result"]');
  }
  
  // Verify upgrade prompt appears
  await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
});