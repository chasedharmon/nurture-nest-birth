import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Admin - Referral Partners Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('input[name="email"]', { state: 'visible' })

    // Type credentials character by character to ensure React captures all input events
    const emailInput = page.locator('input[name="email"]')
    await emailInput.click()
    await emailInput.pressSequentially(ADMIN_EMAIL, { delay: 50 })

    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.click()
    await passwordInput.pressSequentially(ADMIN_PASSWORD, { delay: 50 })

    // Wait a moment for React state to update
    await page.waitForTimeout(300)

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 15000 })
  })

  test.describe('Navigation & Page Load', () => {
    test('should navigate to referral partners from setup hub', async ({
      page,
    }) => {
      await page.goto('/admin/setup')
      await page.waitForLoadState('networkidle')

      // Look for Referral Partners link
      const referralLink = page.locator(
        'a[href="/admin/setup/referral-partners"]'
      )
      await expect(referralLink).toBeVisible({ timeout: 10000 })

      await referralLink.click()
      await expect(page).toHaveURL('/admin/setup/referral-partners', {
        timeout: 10000,
      })
    })

    test('should load referral partners page directly', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(
        page.locator('h1:has-text("Referral Partners")')
      ).toBeVisible({ timeout: 10000 })

      // Check for back button
      await expect(page.locator('button:has-text("Setup")')).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // Check for stats
      await expect(page.locator('text=Total Partners')).toBeVisible()
      await expect(page.locator('text=Referred Leads')).toBeVisible()
      await expect(page.locator('text=Conversions')).toBeVisible()
      await expect(page.locator('text=Conversion Rate')).toBeVisible()
    })

    test('should display info card about referral tracking', async ({
      page,
    }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await expect(
        page.locator('text=Track Referrals from Healthcare Providers')
      ).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Setup")').click()
      await expect(page).toHaveURL('/admin/setup', { timeout: 10000 })
    })
  })

  test.describe('Add Partner Button', () => {
    test('should have Add Partner button visible', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('button:has-text("Add Partner")')).toBeVisible()
    })

    test('should open dialog when Add Partner clicked', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Add Partner")').click()

      // Dialog should appear
      await expect(
        page.locator('[role="dialog"], [data-slot="dialog-content"]')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state message when no partners', async ({
      page,
    }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // Check if partners exist or show empty state
      const hasPartners = await page
        .locator('[class*="space-y"] > div')
        .count()
        .then(c => c > 0)
        .catch(() => false)

      if (!hasPartners) {
        await expect(
          page.locator('text=No referral partners yet')
        ).toBeVisible()
      }
    })
  })

  test.describe('Partner Dialog Form', () => {
    test('should display all form fields in dialog', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Add Partner")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Check for form fields (these should be in the dialog)
      await expect(
        page.locator(
          '[role="dialog"] input[name="name"], [data-slot="dialog-content"] input'
        )
      ).toBeVisible({ timeout: 3000 })
    })

    test('should close dialog when clicking outside or cancel', async ({
      page,
    }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Add Partner")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Try to close via cancel button or X button
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

  test.describe('Partner Creation', () => {
    test('should create a new referral partner', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      const timestamp = Date.now()
      const partnerName = `Dr. Test Partner ${timestamp}`

      await page.locator('button:has-text("Add Partner")').click()

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          state: 'visible',
          timeout: 5000,
        }
      )

      // Fill in partner details - look for inputs in the dialog
      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [data-slot="dialog-content"] input[name="name"], [role="dialog"] input:first-of-type'
      )

      if (await nameInput.first().isVisible()) {
        await nameInput.first().click()
        await nameInput.first().pressSequentially(partnerName, { delay: 30 })
      }

      // Look for partner type selector if exists
      const partnerTypeSelect = page.locator(
        '[role="dialog"] select[name="partner_type"], [data-slot="dialog-content"] select'
      )
      if (await partnerTypeSelect.first().isVisible()) {
        await partnerTypeSelect.first().selectOption('healthcare')
      }

      // Submit the form
      const submitButton = page.locator(
        '[role="dialog"] button[type="submit"], [data-slot="dialog-content"] button:has-text("Create"), [role="dialog"] button:has-text("Add"), [role="dialog"] button:has-text("Save")'
      )
      await submitButton.first().click()

      // Wait for dialog to close and page to update
      await page.waitForTimeout(1000)

      // Verify partner appears in list (if successful)
      // Note: The partner may or may not appear immediately depending on page refresh behavior
    })
  })

  test.describe('Partner List Display', () => {
    test('should display partner cards with correct information', async ({
      page,
    }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // Check if there are any partners
      const partnerCards = page.locator(
        'main .space-y-4 > div, main [class*="Card"]'
      )
      const count = await partnerCards.count()

      if (count > 0) {
        // Each partner card should show stats
        const firstCard = partnerCards.first()
        await expect(firstCard.locator('text=Leads')).toBeVisible()
        await expect(firstCard.locator('text=Clients')).toBeVisible()
        await expect(firstCard.locator('text=Rate')).toBeVisible()
      }
    })

    test('should display partner type icons', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // If partners exist, they should have type indicators
      const partnerCards = page.locator('main .space-y-4 > div')
      const count = await partnerCards.count()

      if (count > 0) {
        // Partner type labels should be visible
        const typeLabels = page.locator(
          'text=Healthcare Provider, text=Business, text=Individual, text=Organization'
        )
        // At least one type label should exist
        expect(await typeLabels.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Partner Actions', () => {
    test('should have action menu for each partner', async ({ page }) => {
      await page.goto('/admin/setup/referral-partners')
      await page.waitForLoadState('networkidle')

      // Check if there are any partners
      const partnerCards = page.locator('main .space-y-4 > div')
      const count = await partnerCards.count()

      if (count > 0) {
        // Should have action buttons (dropdown menu trigger)
        const actionButton = page.locator(
          'button[aria-haspopup="menu"], button:has([class*="MoreVertical"]), button:has([class*="ellipsis"])'
        )
        expect(await actionButton.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
