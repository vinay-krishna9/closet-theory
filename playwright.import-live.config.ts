import { defineConfig } from '@playwright/test';
import base from './playwright.account-live.config';

export default defineConfig(base, {
  testDir: './tests/import-live',
  outputDir: 'import-live-results',
});
