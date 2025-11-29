import { test, expect } from '@playwright/test';

test.describe('Scarmonit UI Audit', () => {
  test('should load homepage and verify all interactive elements', async ({ page }) => {
    // 1. Monitor Console Errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 2. Visit Homepage
    console.log('Navigating to homepage...');
    await page.goto('/');
    
    // Check title to ensure we loaded something
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    expect(title).not.toBe('');

    // 3. Verify Visibility of Key Sections (based on known features)
    // We'll accept whatever is there, but log it.
    const bodyText = await page.innerText('body');
    console.log('Page content length:', bodyText.length);

    // 4. Audit Buttons
    const buttons = await page.getByRole('button').all();
    console.log(`Found ${buttons.length} buttons.`);
    
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.innerText();
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      
      console.log(`Button [${i}]: "${text}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
      
      // Assertion: Critical buttons should be visible and enabled
      if (isVisible) {
        await expect(btn).toBeEnabled();
      }
    }

    // 5. Audit Links
    const links = await page.getByRole('link').all();
    console.log(`Found ${links.length} links.`);
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const text = await link.innerText();
      const href = await link.getAttribute('href');
      
      console.log(`Link [${i}]: "${text}" -> ${href}`);
      
      // Assertion: Links should have hrefs
      expect(href).not.toBeNull();
    }

    // 6. Check for Console Errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors found:', consoleErrors);
    }
    expect(consoleErrors.length).toBe(0);
    
    // 7. Take Audit Screenshot
    await page.screenshot({ path: 'scarmonit-audit.png', fullPage: true });
  });
});