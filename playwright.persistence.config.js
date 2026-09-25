import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/v2-persistence.e2e.js', '**/v2-audio-unlock.e2e.js', '**/v2-world-lifecycle.e2e.js', '**/v2-page-return.e2e.js'],
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:4174/magic-type-quest/', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/magic-type-quest/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
