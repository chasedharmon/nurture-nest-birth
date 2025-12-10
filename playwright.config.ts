import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Testing Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project - authenticates once before other tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Chromium with authenticated state for admin tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },

    // Mobile with authenticated state
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
