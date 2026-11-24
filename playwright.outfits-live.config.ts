import { defineConfig } from '@playwright/test';
import base from './playwright.account-live.config';

export default defineConfig(base, {
  testDir: './tests/outfits-live',
  outputDir: 'outfits-live-results',
});
