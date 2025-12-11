import { test as setup, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'
const AUTH_FILE = 'tests/e2e/.auth/admin.json'

// Client credentials - uses dev fallback password (password123)
// This email should correspond to an existing lead with status='client' in the database
const CLIENT_EMAIL =
  process.env.TEST_CLIENT_EMAIL || 'makharmon@kearneycats.com'
const CLIENT_PASSWORD = 'password123'
const CLIENT_AUTH_FILE = 'tests/e2e/.auth/client.json'

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

setup('authenticate as client', async ({ page }) => {
  // Navigate to client login page
  await page.goto('/client/login')
  await page.waitForLoadState('networkidle')

  // The client login page has a two-step flow:
  // Step 1: Enter email and choose password auth
  const emailChoiceInput = page.locator('input#email-choice')
  await emailChoiceInput.waitFor({ state: 'visible', timeout: 10000 })
  await emailChoiceInput.fill(CLIENT_EMAIL)

  // Wait for the "Sign in with Password" button to be enabled
  const passwordButton = page.locator(
    'button:has-text("Sign in with Password")'
  )
  await expect(passwordButton).toBeEnabled({ timeout: 5000 })
  await passwordButton.click()

  // Step 2: Enter password
  const passwordInput = page.locator('input#password')
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 })
  await passwordInput.fill(CLIENT_PASSWORD)

  // Submit the form
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to client dashboard
  await expect(page).toHaveURL('/client/dashboard', { timeout: 15000 })

  // Save storage state (cookies) for reuse
  await page.context().storageState({ path: CLIENT_AUTH_FILE })
})
