import { test as setup, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123'
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

  // Wait for redirect - might be /admin or /accept-terms
  await page.waitForURL(/\/(admin|accept-terms)/, { timeout: 30000 })

  // If redirected to accept-terms, accept them
  if (page.url().includes('accept-terms')) {
    console.log('[Auth Setup] User needs to accept terms')

    // Wait for the accept terms page to load
    await page.waitForLoadState('networkidle')

    // Check if terms checkbox needs to be checked (only click if not already checked)
    const termsCheckbox = page.locator('#terms')
    const privacyCheckbox = page.locator('#privacy')

    // Check current state and only click if needed
    const isTermsChecked = await termsCheckbox.isChecked()
    const isPrivacyChecked = await privacyCheckbox.isChecked()

    console.log(
      `[Auth Setup] Terms checked: ${isTermsChecked}, Privacy checked: ${isPrivacyChecked}`
    )

    if (!isTermsChecked) {
      await page.locator('label[for="terms"]').click()
    }
    if (!isPrivacyChecked) {
      await page.locator('label[for="privacy"]').click()
    }

    // Wait for button to be enabled
    await page.waitForTimeout(300)

    // Verify checkboxes are now checked
    await expect(termsCheckbox).toBeChecked()
    await expect(privacyCheckbox).toBeChecked()

    // Click the Continue button in the main content area (not the Subscribe button in footer)
    // The Continue button is within the main content area, Subscribe is in the footer newsletter
    const acceptButton = page.locator('main button:has-text("Continue")')
    await expect(acceptButton).toBeEnabled()
    await acceptButton.click()

    // Wait for navigation - could go to admin or stay on page with error
    // The server action calls router.push and router.refresh on success
    try {
      await expect(page).toHaveURL('/admin', { timeout: 30000 })
    } catch {
      // If we're still on accept-terms, check for error message
      if (page.url().includes('accept-terms')) {
        const errorAlert = page.locator('[role="alert"]')
        if ((await errorAlert.count()) > 0) {
          const errorText = await errorAlert.textContent()
          console.error('[Auth Setup] Terms acceptance error:', errorText)
        }
        // Check if button is still showing "Saving..."
        const savingButton = page.locator('button:has-text("Saving...")')
        if ((await savingButton.count()) > 0) {
          console.error('[Auth Setup] Form submission appears to be stuck')
        }
        throw new Error('Failed to accept terms - still on accept-terms page')
      }
      throw new Error('Unexpected URL after terms acceptance')
    }
  }

  // Verify we're on admin
  await expect(page).toHaveURL('/admin', { timeout: 10000 })

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
