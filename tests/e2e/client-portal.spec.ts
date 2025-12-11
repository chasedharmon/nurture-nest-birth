import { test, expect } from '@playwright/test'

// Client portal tests - uses client auth from auth.setup.ts
// The client session is loaded from tests/e2e/.auth/client.json via playwright.config.ts

test.describe('Client Portal', () => {
  test.describe('Dashboard', () => {
    test('should load dashboard successfully', async ({ page }) => {
      await page.goto('/client/dashboard')
      await page.waitForLoadState('networkidle')

      // Should be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/client\/dashboard/)

      // Should show welcome or dashboard content
      const heading = page.locator('h1').first()
      await expect(heading).toBeVisible({ timeout: 10000 })
    })

    test('should display dashboard navigation', async ({ page }) => {
      await page.goto('/client/dashboard')
      await page.waitForLoadState('networkidle')

      // Check for navigation - may be sidebar or mobile hamburger
      const viewport = page.viewportSize()
      if (viewport && viewport.width > 768) {
        // Desktop - check for nav links
        const nav = page.locator('nav')
        await expect(nav.first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Documents Page', () => {
    test('should load documents page', async ({ page }) => {
      await page.goto('/client/documents')
      await page.waitForLoadState('networkidle')

      // Should not redirect to login
      await expect(page).toHaveURL(/\/client\/documents/)
    })
  })

  test.describe('Invoices Page', () => {
    test('should load invoices page', async ({ page }) => {
      await page.goto('/client/invoices')
      await page.waitForLoadState('networkidle')

      // Should not redirect to login
      await expect(page).toHaveURL(/\/client\/invoices/)
    })
  })

  test.describe('Profile Page', () => {
    test('should load profile page', async ({ page }) => {
      await page.goto('/client/profile')
      await page.waitForLoadState('networkidle')

      // Should not redirect to login
      await expect(page).toHaveURL(/\/client\/profile/)
    })
  })

  test.describe('Services Page', () => {
    test('should load services page', async ({ page }) => {
      await page.goto('/client/services')
      await page.waitForLoadState('networkidle')

      // Should not redirect to login
      await expect(page).toHaveURL(/\/client\/services/)
    })
  })

  test.describe('Meetings Page', () => {
    test('should load meetings page', async ({ page }) => {
      await page.goto('/client/meetings')
      await page.waitForLoadState('networkidle')

      // Should not redirect to login
      await expect(page).toHaveURL(/\/client\/meetings/)
    })
  })
})

test.describe('Client Portal Navigation', () => {
  test('should have accessible navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for mobile menu button
    const menuButton = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"]'
    )
    const hasMenuButton = await menuButton.isVisible().catch(() => false)

    if (hasMenuButton) {
      await menuButton.click()
      // Mobile nav should appear
      await page.waitForTimeout(300)
    }

    // Page should load without error
    await expect(page).toHaveURL(/\/client\/dashboard/)
  })
})

test.describe('Client Portal Unauthenticated Access', () => {
  // These tests explicitly clear auth to test unauthenticated behavior
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/client/dashboard')
    await expect(page).toHaveURL(/\/client\/login/, { timeout: 10000 })
  })

  test('should show login page', async ({ page }) => {
    await page.goto('/client/login')
    await page.waitForLoadState('networkidle')

    // Check for email input
    const emailInput = page.locator('input#email-choice, input[name="email"]')
    await expect(emailInput.first()).toBeVisible({ timeout: 5000 })
  })
})
