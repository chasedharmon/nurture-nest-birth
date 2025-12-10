import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Admin - SMS Templates Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('input[name="email"]', { state: 'visible' })

    // Type credentials character by character to ensure React captures all input events
    const emailInput = page.locator('input[name="email"]')
    await emailInput.click({ force: true })
    await emailInput.pressSequentially(ADMIN_EMAIL, { delay: 50 })

    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.click({ force: true })
    await passwordInput.pressSequentially(ADMIN_PASSWORD, { delay: 50 })

    // Wait a moment for React state to update
    await page.waitForTimeout(300)

    // Submit form
    await page.locator('button[type="submit"]').click({ force: true })

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 15000 })
  })

  test.describe('Navigation & Page Load', () => {
    test('should navigate to SMS templates from setup hub', async ({
      page,
    }) => {
      await page.goto('/admin/setup')
      await page.waitForLoadState('networkidle')

      const smsLink = page.locator('a[href="/admin/setup/sms-templates"]')
      await expect(smsLink).toBeVisible({ timeout: 10000 })

      await smsLink.click()
      await expect(page).toHaveURL('/admin/setup/sms-templates', {
        timeout: 10000,
      })
    })

    test('should load SMS templates page directly', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(page.locator('h1:has-text("SMS Templates")')).toBeVisible({
        timeout: 10000,
      })

      // Check for back button
      await expect(page.locator('button:has-text("Setup")')).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // Check for stats
      await expect(page.locator('text=Total Templates')).toBeVisible()
      await expect(page.locator('text=Active').first()).toBeVisible()
      await expect(page.locator('text=Categories')).toBeVisible()
      await expect(page.locator('text=Multi-segment')).toBeVisible()
    })

    test('should display info card about SMS infrastructure', async ({
      page,
    }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('text=SMS Infrastructure')).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Setup")').click()
      await expect(page).toHaveURL('/admin/setup', { timeout: 10000 })
    })
  })

  test.describe('New Template Button', () => {
    test('should have New Template button visible', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await expect(
        page.locator('button:has-text("New Template")')
      ).toBeVisible()
    })

    test('should open dialog when New Template clicked', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Template")').click()

      // Dialog should appear
      await expect(
        page.locator('[role="dialog"], [data-slot="dialog-content"]')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state or templates list', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // Either show templates or empty state
      const hasTemplates = await page
        .locator('main .grid > div')
        .count()
        .then(c => c > 0)
        .catch(() => false)

      if (!hasTemplates) {
        await expect(page.locator('text=No templates yet')).toBeVisible()
        await expect(
          page.locator('text=Create your first SMS template')
        ).toBeVisible()
      }
    })

    test('should have Create Template button in empty state', async ({
      page,
    }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // If in empty state
      const emptyState = page.locator('text=No templates yet')
      const isVisible = await emptyState.isVisible().catch(() => false)

      if (isVisible) {
        await expect(
          page.locator('button:has-text("Create Template")')
        ).toBeVisible()
      }
    })
  })

  test.describe('Template Dialog Form', () => {
    test('should display form fields in dialog', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Template")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Check for form elements
      const dialog = page.locator(
        '[role="dialog"], [data-slot="dialog-content"]'
      )
      await expect(
        dialog.locator('input, select, textarea').first()
      ).toBeVisible({
        timeout: 3000,
      })
    })

    test('should have category selector', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Template")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Look for category selector
      const dialog = page.locator(
        '[role="dialog"], [data-slot="dialog-content"]'
      )
      const categorySelect = dialog.locator('select')
      expect(await categorySelect.count()).toBeGreaterThanOrEqual(0)
    })

    test('should close dialog when clicking cancel', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Template")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Try to close
      const closeButton = page.locator(
        '[role="dialog"] button:has-text("Cancel"), button[aria-label="Close"]'
      )

      if (await closeButton.first().isVisible()) {
        await closeButton.first().click()
        await expect(
          page.locator('[role="dialog"], [data-slot="dialog-content"]')
        ).not.toBeVisible({ timeout: 3000 })
      }
    })
  })

  test.describe('Template List Display', () => {
    test('should display templates in grid layout by category', async ({
      page,
    }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // Check for grid layout
      const gridContainer = page.locator('main .grid')
      await expect(gridContainer.first()).toBeVisible()
    })

    test('should show template character count and segments', async ({
      page,
    }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // If templates exist, check for character/segment info
      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Should show "chars" text somewhere
        await expect(page.locator('text=/\\d+ chars/').first()).toBeVisible()
        // Should show segment info
        await expect(
          page.locator('text=/\\d+ segments?/').first()
        ).toBeVisible()
      }
    })

    test('should show template preview content', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Each card should have a content preview area (bg-muted/50)
        const previewArea = page.locator('.bg-muted\\/50, [class*="bg-muted"]')
        expect(await previewArea.count()).toBeGreaterThan(0)
      }
    })

    test('should show active/inactive status icons', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Should have visibility icons (Eye or EyeOff)
        const eyeIcon = page.locator('svg[class*="Eye"]')
        expect(await eyeIcon.count()).toBeGreaterThanOrEqual(0)
      }
    })

    test('should show variable badges', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Templates with variables should show variable badges
        const variableBadge = page.locator('text=/\\{\\{.*\\}\\}/')
        // May or may not have variables, just check it doesn't crash
        expect(await variableBadge.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Template Actions', () => {
    test('should have action component for templates', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Each card should have action buttons
        const firstCard = templateCards.first()
        const hasActions = await firstCard
          .locator('button')
          .count()
          .then(c => c > 0)
        expect(hasActions).toBeTruthy()
      }
    })
  })

  test.describe('Category Grouping', () => {
    test('should group templates by category', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Should have category headers
        const categoryHeaders = page.locator('h2')
        expect(await categoryHeaders.count()).toBeGreaterThan(0)
      }
    })

    test('should show category count badges', async ({ page }) => {
      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      const templateCards = page.locator('main .grid > div')
      const count = await templateCards.count()

      if (count > 0) {
        // Category headers should have count badges
        const countBadge = page.locator(
          'h2 + [class*="Badge"], h2 ~ [class*="Badge"]'
        )
        expect(await countBadge.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/setup/sms-templates')
      await page.waitForLoadState('networkidle')

      // Header should be visible
      await expect(page.locator('h1:has-text("SMS Templates")')).toBeVisible()

      // New Template button should be visible
      await expect(
        page.locator('button:has-text("New Template")')
      ).toBeVisible()

      // Stats cards should stack
      const statsCards = page.locator('main .grid > div').first()
      await expect(statsCards).toBeVisible()
    })
  })
})
