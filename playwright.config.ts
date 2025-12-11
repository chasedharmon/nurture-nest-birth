import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

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

    // Data seed project - seeds test data after auth
    {
      name: 'data-seed',
      testMatch: /data-seed\.setup\.ts/,
      dependencies: ['setup'],
    },

    // Chromium with authenticated state for admin tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['data-seed'],
      testIgnore: [
        /auth\.setup\.ts/,
        /data-seed\.setup\.ts/,
        /client-portal\.spec\.ts/,
      ],
    },

    // Mobile with authenticated state
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['data-seed'],
      testIgnore: [
        /auth\.setup\.ts/,
        /data-seed\.setup\.ts/,
        /client-portal\.spec\.ts/,
      ],
    },

    // Chromium with client authenticated state
    // Only client-portal.spec.ts needs actual client auth (navigates to /client/* routes)
    // Other client-*.spec.ts files (like client-team-assignments) test admin features
    {
      name: 'chromium-client',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/client.json',
      },
      dependencies: ['data-seed'],
      testMatch: /client-portal\.spec\.ts/,
    },

    // Mobile with client authenticated state
    {
      name: 'mobile-client',
      use: {
        ...devices['iPhone 13'],
        storageState: 'tests/e2e/.auth/client.json',
      },
      dependencies: ['data-seed'],
      testMatch: /client-portal\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
