import { defineConfig } from '@playwright/test';
import base from './playwright.account-live.config';

// Uses the same allowlisted development services, journal and guarded teardown.
export default defineConfig(base, {
  testDir: './tests/wardrobe-live',
  outputDir: 'wardrobe-live-results',
});
