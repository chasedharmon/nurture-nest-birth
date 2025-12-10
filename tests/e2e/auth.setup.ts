import { test as setup, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'
const AUTH_FILE = 'tests/e2e/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[name="email"]', { state: 'visible' })

  // Fill credentials
  const emailInput = page.locator('input[name="email"]')
  await emailInput.click({ force: true })
  await emailInput.pressSequentially(ADMIN_EMAIL, { delay: 50 })

  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.click({ force: true })
  await passwordInput.pressSequentially(ADMIN_PASSWORD, { delay: 50 })

  // Wait for React state
  await page.waitForTimeout(300)

  // Submit form
  await page.locator('button[type="submit"]').click({ force: true })

  // Wait for successful redirect with extended timeout
  await expect(page).toHaveURL('/admin', { timeout: 30000 })

  // Save storage state (cookies, localStorage) for reuse
  await page.context().storageState({ path: AUTH_FILE })
})
