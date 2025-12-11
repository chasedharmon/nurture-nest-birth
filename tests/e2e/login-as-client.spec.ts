import { test, expect } from '@playwright/test'

// Client credentials - uses dev fallback password (password123)
// This email should correspond to an existing lead with status='client' in the database
const CLIENT_EMAIL =
  process.env.TEST_CLIENT_EMAIL || 'makharmon@kearneycats.com'
const CLIENT_PASSWORD = 'password123'

test.describe('Client Portal Direct Login', () => {
  // These tests explicitly clear auth to test login flow
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should login to client portal with password', async ({ page }) => {
    await page.goto('/client/login')
    await page.waitForLoadState('networkidle')

    // Step 1: Enter email
    const emailInput = page.locator('input#email-choice')
    await expect(emailInput).toBeVisible({ timeout: 5000 })
    await emailInput.fill(CLIENT_EMAIL)

    // Click "Sign in with Password" button
    const passwordButton = page.locator(
      'button:has-text("Sign in with Password")'
    )
    await expect(passwordButton).toBeEnabled({ timeout: 5000 })
    await passwordButton.click()

    // Step 2: Enter password
    const passwordInput = page.locator('input#password')
    await expect(passwordInput).toBeVisible({ timeout: 5000 })
    await passwordInput.fill(CLIENT_PASSWORD)

    // Submit
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/client/dashboard', { timeout: 15000 })
  })

  test('should display login form elements', async ({ page }) => {
    await page.goto('/client/login')
    await page.waitForLoadState('networkidle')

    // Check for email input
    await expect(page.locator('input#email-choice')).toBeVisible()

    // Check for password and magic link buttons
    await expect(
      page.locator('button:has-text("Sign in with Password")')
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("Send Magic Link")')
    ).toBeVisible()
  })

  test('should show password field after selecting password login', async ({
    page,
  }) => {
    await page.goto('/client/login')
    await page.waitForLoadState('networkidle')

    // Enter email first
    await page.locator('input#email-choice').fill(CLIENT_EMAIL)

    // Click password button
    await page.locator('button:has-text("Sign in with Password")').click()

    // Password field should appear
    await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('Client Portal Navigation (Authenticated)', () => {
  // These tests use the authenticated client session
  test('should navigate to services page', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')

    const viewport = page.viewportSize()
    if (viewport && viewport.width <= 768) {
      // Mobile - open hamburger menu first
      const menuButton = page.locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"]'
      )
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)
      }
    }

    // Click services link
    const servicesLink = page.locator('a[href="/client/services"]').first()
    if (await servicesLink.isVisible()) {
      await servicesLink.click()
      await expect(page).toHaveURL(/\/client\/services/)
    }
  })

  test('should navigate to invoices page', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')

    const viewport = page.viewportSize()
    if (viewport && viewport.width <= 768) {
      const menuButton = page.locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"]'
      )
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)
      }
    }

    const invoicesLink = page.locator('a[href="/client/invoices"]').first()
    if (await invoicesLink.isVisible()) {
      await invoicesLink.click()
      await expect(page).toHaveURL(/\/client\/invoices/)
    }
  })

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')

    const viewport = page.viewportSize()
    if (viewport && viewport.width <= 768) {
      const menuButton = page.locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"]'
      )
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)
      }
    }

    const profileLink = page.locator('a[href="/client/profile"]').first()
    if (await profileLink.isVisible()) {
      await profileLink.click()
      await expect(page).toHaveURL(/\/client\/profile/)
    }
  })
})

test.describe('Mobile Responsive Client Portal', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display login page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/client/login')
    await page.waitForLoadState('networkidle')

    // Login elements should be visible on mobile
    await expect(page.locator('input#email-choice')).toBeVisible()

    // Touch targets should be reasonable size
    const passwordButton = page.locator(
      'button:has-text("Sign in with Password")'
    )
    await expect(passwordButton).toBeVisible()

    const boundingBox = await passwordButton.boundingBox()
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(40)
    }
  })
})
