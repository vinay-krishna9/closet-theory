import { defineConfig } from '@playwright/test';
import base from './playwright.config';
import { loadConfiguration } from './live-tests/fixtures';

loadConfiguration();
export default defineConfig(base, {
  testDir: './live-tests',
  globalSetup: './live-tests/setup.ts',
  globalTeardown: './live-tests/teardown.ts',
  timeout: 60000,
  retries: 0,
  maxFailures: 1,
});
