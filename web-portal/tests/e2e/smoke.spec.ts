import { test, expect } from '@playwright/test';

test('smoke test - page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Scarmonit/i);
});

