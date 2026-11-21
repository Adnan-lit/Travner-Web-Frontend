import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level tests run against the Angular dev server with all /api calls
 * mocked, so they need neither a backend nor a database. The dev server is
 * started automatically unless one is already listening on the base URL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // No dev proxy: page routes like /admin and /marketplace must be served by
    // the SPA router, and every /api request is intercepted by the tests.
    // angular.json sets a proxy globally, so it must be explicitly overridden.
    command: 'npx ng serve --host 127.0.0.1 --port 4200 --proxy-config e2e/proxy-empty.conf.json',
    url: 'http://127.0.0.1:4200',
    // A developer's `npm start` proxies /api and /ws to a real backend; reuse
    // would silently defeat the mocked-API harness.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
