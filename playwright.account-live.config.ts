import { defineConfig } from '@playwright/test';
import base from './playwright.account.config';
import { loadConfiguration } from './tests/account-live/fixtures';
loadConfiguration();
export default defineConfig(base, {
  testDir: './tests/account-live',
  outputDir: 'account-live-results',
  globalSetup: './tests/account-live/setup.ts',
  globalTeardown: './tests/account-live/teardown.ts',
  retries: 0,
  maxFailures: 1,
  timeout: 180000,
});
