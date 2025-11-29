import { test, expect } from '@playwright/test';

// Stub MCP bridge responses
async function setupMcpRoutes(page) {
  await page.route('**/mcp/call', async route => {
    const req = route.request();
    const postData = req.postData() ? JSON.parse(req.postData()!) : {};
    const name = postData.name;
    let text = 'Mock response';
    if (name === 'check_system_status') {
      const comp = postData.args?.component;
      if (comp === 'web') text = 'Web: Online (Cloudflare Pages)';
      else if (comp === 'api') text = 'API: Online (Cloudflare Workers)';
      else text = 'Web: Online (Cloudflare Pages)\nAPI: Online (Cloudflare Workers)';
    } else if (name === 'check_datalore_status') {
      text = '✅ Datalore Cloud Integration: Connected\nLicense ID: TEST-LIC';
    } else if (name === 'diagnose_agents') {
      text = 'Agents diagnostics\nDir: /repo/.github/agents\nExists: true\nCount: 4\nCache age: 1s\nLast load: 2025-11-29T08:05:00.000Z';
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ type: 'text', text }] })
    });
  });
}

test.describe('Scarmonit Control Center - Diagnostics', () => {
  test('initial health and agent diagnostics flow', async ({ page }) => {
    await setupMcpRoutes(page);
    await page.goto('/');

    // Wait for system status cards to render
    await expect(page.getByTestId('status-card-web-portal')).toBeVisible();

    // Trigger agent diagnostics
    await page.getByTestId('btn-diagnose-agents').click();

    // Verify diagnostics appear
    const diag = page.getByTestId('text-agent-diagnostics');
    await expect(diag).toContainText('4 agents');
    await expect(diag).toContainText('cache');

    // Activity log should have an entry about Agent diagnostics
    const logContainer = page.getByTestId('activity-log');
    await expect(logContainer).toContainText('Agent diagnostics: 4 agents');
  });
});

