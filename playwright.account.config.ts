import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: 'account-test-results',
  testDir: './tests/account',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4175',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'node node_modules/next/dist/bin/next start --hostname localhost --port 4175',
    url: 'http://localhost:4175',
    reuseExistingServer: false,
    env: {
      APP_AUTH_MODE: 'clerk',
      APP_ORIGIN: 'http://localhost:4175',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    timeout: 60000,
  },
});
