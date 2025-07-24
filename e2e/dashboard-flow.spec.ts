import { test, expect } from '@playwright/test';

test('dashboard flow', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('/dashboard');
  
  // Check if we're redirected to sign-in (since we're not authenticated)
  await expect(page).toHaveURL('/auth/sign-in');
  
  // Sign in with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard');
  
  // Verify dashboard elements
  await expect(page.locator('h1')).toContainText('Dashboard');
  await expect(page.locator('text=Submissions')).toBeVisible();
  await expect(page.locator('text=Analytics')).toBeVisible();
  await expect(page.locator('text=Recent Activity')).toBeVisible();
  
  // Test submission count
  const submissionCount = await page.locator('[data-testid="submission-count"]').textContent();
  expect(parseInt(submissionCount || '0')).toBeGreaterThanOrEqual(0);
  
  // Test analytics chart
  await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  
  // Test recent submissions
  const recentSubmissions = page.locator('[data-testid="recent-submission"]');
  await expect(recentSubmissions).toHaveCount(5);
});