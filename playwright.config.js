import { defineConfig } from '@playwright/test';

const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: deployedBaseURL || 'http://127.0.0.1:4173/magic-type-quest/',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: deployedBaseURL ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/magic-type-quest/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
