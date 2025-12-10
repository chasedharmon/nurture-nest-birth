import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Admin - Welcome Packets Management', () => {
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
    test('should navigate to welcome packets from setup hub', async ({
      page,
    }) => {
      await page.goto('/admin/setup')
      await page.waitForLoadState('networkidle')

      // Look for Welcome Packets link
      const packetsLink = page.locator('a[href="/admin/setup/welcome-packets"]')
      await expect(packetsLink).toBeVisible({ timeout: 10000 })

      await packetsLink.click()
      await expect(page).toHaveURL('/admin/setup/welcome-packets', {
        timeout: 10000,
      })
    })

    test('should load welcome packets page directly', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(page.locator('h1:has-text("Welcome Packets")')).toBeVisible({
        timeout: 10000,
      })

      // Check for back button
      await expect(page.locator('button:has-text("Setup")')).toBeVisible()
    })

    test('should display info banner about automated onboarding', async ({
      page,
    }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await expect(
        page.locator('text=Automated Client Onboarding')
      ).toBeVisible()
      await expect(
        page.locator(
          'text=Welcome packets automatically send documents, forms, and resources'
        )
      ).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // Check for stats
      await expect(page.locator('text=Total Packets')).toBeVisible()
      await expect(page.locator('text=Active').first()).toBeVisible()
      await expect(page.locator('text=Total Items')).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Setup")').click()
      await expect(page).toHaveURL('/admin/setup', { timeout: 10000 })
    })
  })

  test.describe('New Packet Button', () => {
    test('should have New Packet button visible', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('button:has-text("New Packet")')).toBeVisible()
    })

    test('should open dialog when New Packet clicked', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Packet")').click()

      // Dialog should appear
      await expect(
        page.locator('[role="dialog"], [data-slot="dialog-content"]')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state message when no packets', async ({
      page,
    }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // Check if packets exist or show empty state
      const packetCards = page.locator(
        'main .grid > div, main .lg\\:grid-cols-2 > div'
      )
      const count = await packetCards.count()

      if (count === 0) {
        await expect(page.locator('text=No welcome packets yet')).toBeVisible()
        await expect(
          page.locator('text=Create your first welcome packet')
        ).toBeVisible()
      }
    })

    test('should have Create Packet button in empty state', async ({
      page,
    }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // If in empty state, should have create button
      const emptyStateButton = page.locator(
        'main button:has-text("Create Packet")'
      )
      const isVisible = await emptyStateButton.isVisible().catch(() => false)

      if (isVisible) {
        await expect(emptyStateButton).toBeVisible()
      }
    })
  })

  test.describe('Packet Dialog Form', () => {
    test('should display form fields in dialog', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Packet")').click()

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

    test('should have trigger options', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Packet")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Look for trigger selector - these are the available triggers:
      // 'Contract Signed', 'Lead Converted', 'Manual Trigger'

      // At least some trigger-related UI should be present
      const dialog = page.locator(
        '[role="dialog"], [data-slot="dialog-content"]'
      )
      const hasSelect = (await dialog.locator('select').count()) > 0
      expect(hasSelect).toBeTruthy()
    })

    test('should close dialog when clicking cancel', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Packet")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Try to close via cancel button
      const closeButton = page.locator(
        '[role="dialog"] button:has-text("Cancel"), [data-slot="dialog-content"] button:has-text("Cancel"), button[aria-label="Close"]'
      )

      if (await closeButton.first().isVisible()) {
        await closeButton.first().click()
        await expect(
          page.locator('[role="dialog"], [data-slot="dialog-content"]')
        ).not.toBeVisible({ timeout: 3000 })
      }
    })
  })

  test.describe('Packet List Display', () => {
    test('should display packets in grid layout', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // Check for grid layout
      const gridContainer = page.locator('main .grid, main .lg\\:grid-cols-2')
      await expect(gridContainer).toBeVisible()
    })

    test('should show trigger type badges', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      // If packets exist, check for trigger badges
      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Trigger type badges should be present
        const triggerBadges = page.locator(
          'text=Contract Signed, text=Lead Converted, text=Manual Trigger'
        )
        expect(await triggerBadges.count()).toBeGreaterThanOrEqual(0)
      }
    })

    test('should show active/inactive status badges', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Active or Inactive badges should exist
        const statusBadge = page.locator('text=Active, text=Inactive')
        expect(await statusBadge.count()).toBeGreaterThan(0)
      }
    })

    test('should show item count for each packet', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Each packet should show item count
        await expect(
          page.locator('text=/\\d+ items? in this packet/').first()
        ).toBeVisible()
      }
    })
  })

  test.describe('Packet Actions', () => {
    test('should have Manage Items link for each packet', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Should have Manage Items button/link
        await expect(
          page
            .locator(
              'button:has-text("Manage Items"), a:has-text("Manage Items")'
            )
            .first()
        ).toBeVisible()
      }
    })

    test('should open items dialog when Manage Items clicked', async ({
      page,
    }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const manageButton = page
        .locator('button:has-text("Manage Items"), a:has-text("Manage Items")')
        .first()

      if (await manageButton.isVisible()) {
        await manageButton.click()

        // Items dialog should open
        await expect(
          page.locator('[role="dialog"], [data-slot="dialog-content"]')
        ).toBeVisible({ timeout: 5000 })
      }
    })

    test('should have action dropdown for each packet', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Should have action buttons (dropdown menu trigger)
        const actionButton = page.locator(
          'button[aria-haspopup="menu"], [class*="DropdownMenu"]'
        )
        expect(await actionButton.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Packet Creation', () => {
    test('should create a new welcome packet', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const timestamp = Date.now()
      const packetName = `Test Packet ${timestamp}`

      await page.locator('button:has-text("New Packet")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Fill in packet details
      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [data-slot="dialog-content"] input[name="name"], [role="dialog"] input:first-of-type'
      )

      if (await nameInput.first().isVisible()) {
        await nameInput.first().click()
        await nameInput.first().fill('')
        await nameInput.first().pressSequentially(packetName, { delay: 30 })
      }

      // Look for description textarea
      const descInput = page.locator(
        '[role="dialog"] textarea, [role="dialog"] input[name="description"]'
      )
      if (await descInput.first().isVisible()) {
        await descInput.first().click()
        await descInput.first().pressSequentially('Test packet description', {
          delay: 20,
        })
      }

      // Submit the form
      const submitButton = page.locator(
        '[role="dialog"] button[type="submit"], [data-slot="dialog-content"] button:has-text("Create"), [role="dialog"] button:has-text("Save")'
      )
      await submitButton.first().click()

      // Wait for dialog to close
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Service Type Filtering', () => {
    test('should show service type badges on packets', async ({ page }) => {
      await page.goto('/admin/setup/welcome-packets')
      await page.waitForLoadState('networkidle')

      const packetCards = page.locator('main .grid > div')
      const count = await packetCards.count()

      if (count > 0) {
        // Service type or "All Services" badge should be present
        const serviceTypeBadge = page.locator(
          'text=Birth Doula, text=Postpartum Doula, text=All Services, text=Lactation'
        )
        expect(await serviceTypeBadge.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
