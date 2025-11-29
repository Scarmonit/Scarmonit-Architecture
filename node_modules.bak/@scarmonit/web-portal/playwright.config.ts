import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.(ts|js)/,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: true
  }
});
