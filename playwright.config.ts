import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',       // only run tests inside tests/e2e
  fullyParallel: true,
  reporter: 'html',
  webServer: {                  // launch dev server automatically
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
