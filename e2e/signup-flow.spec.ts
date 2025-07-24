import { test, expect } from '@playwright/test';

test.describe('User Journey - Sign up, Onboarding, Submit Work, View Feedback', () => {
  test('should complete the full user journey', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await expect(page).toHaveTitle(/AI Marking Assistant/);

    // Click sign up button
    await page.click('text=Sign Up');

    // Fill sign up form
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Create Account")');

    // Wait for onboarding page
    await expect(page).toHaveURL(/\/onboarding/);

    // Complete onboarding steps
    await page.click('text=I am a student');
    await page.click('button:has-text("Next")');

    // Select year group
    await page.selectOption('select[name="yearGroup"]', '10');
    await page.click('button:has-text("Next")');

    // Select subjects
    await page.click('text=Mathematics');
    await page.click('text=English Literature');
    await page.click('button:has-text("Next")');

    // Select exam board
    await page.click('text=AQA');
    await page.click('button:has-text("Next")');

    // Select study goals
    await page.click('text=Improve my grades');
    await page.click('button:has-text("Complete Onboarding")');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Navigate to marking page
    await page.click('text=Submit Work');
    await expect(page).toHaveURL(/\/mark/);

    // Fill marking form
    await page.fill(
      'textarea[name="question"]',
      'What is the capital of France?'
    );
    await page.fill(
      'textarea[name="answer"]',
      'The capital of France is Paris.'
    );
    await page.click('button:has-text("Get AI Feedback")');

    // Wait for feedback
    await page.waitForSelector('text=Feedback Generated');
    await expect(page.locator('text=Score')).toBeVisible();
    await expect(page.locator('text=Grade')).toBeVisible();

    // Navigate to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Check recent submissions
    await expect(page.locator('text=Recent Submissions')).toBeVisible();
    await expect(
      page.locator('text=What is the capital of France?')
    ).toBeVisible();

    // Sign out
    await page.click('text=Sign Out');
    await expect(page).toHaveURL('/');
  });
});
