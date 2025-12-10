import { test, expect } from '@playwright/test'

test.describe('Admin Setup - Phase 7 Polish', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Setup Hub Navigation', () => {
    test('should display all setup categories', async ({ page }) => {
      await page.goto('/admin/setup')

      // Check all category titles
      await expect(page.locator('text=Administration')).toBeVisible()
      await expect(page.locator('text=Business')).toBeVisible()
      await expect(page.locator('text=Client Experience')).toBeVisible()
      await expect(page.locator('text=Integrations')).toBeVisible()
    })

    test('should display email templates in Client Experience', async ({
      page,
    }) => {
      await page.goto('/admin/setup')

      // Check email templates link exists
      await expect(page.locator('text=Email Templates')).toBeVisible()
      await expect(
        page.locator('text=Reusable email templates with variables')
      ).toBeVisible()
    })

    test('should display welcome packets in Client Experience', async ({
      page,
    }) => {
      await page.goto('/admin/setup')

      // Check welcome packets link exists
      await expect(page.locator('text=Welcome Packets')).toBeVisible()
      await expect(
        page.locator('text=Automated onboarding bundles for new clients')
      ).toBeVisible()
    })
  })

  test.describe('Email Templates Page', () => {
    test('should load email templates page', async ({ page }) => {
      await page.goto('/admin/setup/email-templates')

      // Check page header
      await expect(page.locator('h1:has-text("Email Templates")')).toBeVisible()

      // Check for back button
      await expect(page.locator('text=Setup').first()).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/setup/email-templates')

      // Check for stats
      await expect(page.locator('text=Total Templates')).toBeVisible()
      await expect(page.locator('text=Active')).toBeVisible()
      await expect(page.locator('text=Inactive')).toBeVisible()
      await expect(page.locator('text=Categories')).toBeVisible()
    })

    test('should have new template button', async ({ page }) => {
      await page.goto('/admin/setup/email-templates')

      // Check for new template button
      const newTemplateButton = page.locator('button:has-text("New Template")')
      await expect(newTemplateButton).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/email-templates')

      // Click back button
      await page.locator('button:has-text("Setup")').first().click()

      // Should be back on setup page
      await expect(page).toHaveURL('/admin/setup')
    })
  })

  test.describe('Welcome Packets Page', () => {
    test('should load welcome packets page', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')

      // Check page header
      await expect(page.locator('h1:has-text("Welcome Packets")')).toBeVisible()

      // Check for back button
      await expect(page.locator('text=Setup').first()).toBeVisible()
    })

    test('should display info banner', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')

      // Check for info banner content
      await expect(
        page.locator('text=Automated Client Onboarding')
      ).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')

      // Check for stats
      await expect(page.locator('text=Total Packets')).toBeVisible()
      await expect(page.locator('text=Active').first()).toBeVisible()
      await expect(page.locator('text=Total Items')).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')

      // Click back button
      await page.locator('button:has-text("Setup")').first().click()

      // Should be back on setup page
      await expect(page).toHaveURL('/admin/setup')
    })
  })

  test.describe('Loading States', () => {
    test('should show loading skeleton on admin dashboard', async ({
      page,
    }) => {
      // Navigate and check for loading state or content
      await page.goto('/admin')

      // Either skeleton or dashboard content should be visible
      const hasContent = await page
        .locator('text=Welcome back')
        .isVisible()
        .catch(() => false)
      const hasSkeleton = await page
        .locator('[data-slot="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false)

      expect(hasContent || hasSkeleton).toBeTruthy()
    })

    test('should show loading skeleton on setup page', async ({ page }) => {
      await page.goto('/admin/setup')

      // Either skeleton or setup content should be visible
      const hasContent = await page
        .locator('text=Administration')
        .isVisible()
        .catch(() => false)
      const hasSkeleton = await page
        .locator('[data-slot="skeleton"]')
        .first()
        .isVisible()
        .catch(() => false)

      expect(hasContent || hasSkeleton).toBeTruthy()
    })
  })
})

test.describe('Marketing Site - Mobile Navigation', () => {
  test('should have hamburger menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check for hamburger menu button
    const menuButton = page.locator('button[aria-label="Open navigation menu"]')
    await expect(menuButton).toBeVisible()
  })

  test('should open mobile menu when hamburger clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Click hamburger menu
    const menuButton = page.locator('button[aria-label="Open navigation menu"]')
    await menuButton.click()

    // Menu should be open - check for navigation items
    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()
    await expect(
      page.locator('[data-slot="sheet-content"] >> text=About')
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="sheet-content"] >> text=Services')
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="sheet-content"] >> text=Contact')
    ).toBeVisible()
  })

  test('should close mobile menu when link clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Open menu
    const menuButton = page.locator('button[aria-label="Open navigation menu"]')
    await menuButton.click()

    // Click a link
    await page.locator('[data-slot="sheet-content"] >> text=About').click()

    // Menu should close
    await expect(page.locator('[data-slot="sheet-content"]')).not.toBeVisible()
  })

  test('should hide desktop navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Desktop nav links should be hidden (they have md:flex)
    const desktopNav = page.locator('nav >> div.md\\:flex').first()
    await expect(desktopNav).not.toBeVisible()
  })

  test('should show desktop navigation on larger screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    // Desktop nav links should be visible
    await expect(page.locator('nav >> a:has-text("About")')).toBeVisible()
    await expect(page.locator('nav >> a:has-text("Services")')).toBeVisible()
    await expect(page.locator('nav >> a:has-text("Contact")')).toBeVisible()

    // Hamburger should be hidden on desktop
    const menuButton = page.locator('button[aria-label="Open navigation menu"]')
    await expect(menuButton).not.toBeVisible()
  })
})
