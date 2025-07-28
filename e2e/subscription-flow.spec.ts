import { test, expect } from '@playwright/test';

test('subscription flow', async ({ page }) => {
  // Navigate to pricing page
  await page.goto('/pricing');

  // Sign in with test credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for navigation to pricing page
  await page.waitForURL('/pricing');

  // Select Pro plan
  await page.click('[data-testid="pro-plan"]');

  // Click upgrade button
  await page.click('[data-testid="upgrade-button"]');

  // Wait for Stripe checkout
  await page.waitForURL('https://checkout.stripe.com/**');

  // Fill in test card details
  await page.fill('input[name="cardnumber"]', '4242 4242 4242 4242');
  await page.fill('input[name="exp-date"]', '12/34');
  await page.fill('input[name="cvc"]', '123');
  await page.fill('input[name="postal"]', '12345');

  // Complete payment
  await page.click('button[type="submit"]');

  // Wait for success page
  await page.waitForURL('/dashboard');

  // Verify subscription status
  await expect(page.locator('[data-testid="subscription-status"]')).toHaveText(
    'PRO'
  );

  // Verify increased usage limit
  const usageText = await page
    .locator('[data-testid="usage-counter"]')
    .textContent();
  expect(usageText).toContain('200');
});
