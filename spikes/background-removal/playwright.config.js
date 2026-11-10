import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', workers: 1, timeout: 60000, use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' }, webServer: { command: 'node server.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false } });
