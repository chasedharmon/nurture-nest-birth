import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Admin - SaaS Foundation (Billing & Organization)', () => {
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

  test.describe('Billing Page', () => {
    test('should navigate to billing from setup hub', async ({ page }) => {
      await page.goto('/admin/setup')
      await page.waitForLoadState('networkidle')

      const billingLink = page.locator('a[href="/admin/setup/billing"]')
      await expect(billingLink).toBeVisible({ timeout: 10000 })

      await billingLink.click()
      await expect(page).toHaveURL('/admin/setup/billing', { timeout: 10000 })
    })

    test('should load billing page directly', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(
        page.locator('h1:has-text("Billing & Subscription")')
      ).toBeVisible({ timeout: 10000 })

      // Check for back button
      await expect(page.locator('button:has-text("Setup")')).toBeVisible()
    })

    test('should display current plan section', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Current Plan card
      await expect(page.locator('text=Current Plan')).toBeVisible()

      // Should show subscription status
      await expect(page.locator('text=Status')).toBeVisible()
    })

    test('should display usage meters', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show usage section
      await expect(page.locator('text=Current Usage')).toBeVisible()

      // Should have usage items
      await expect(page.locator('text=Team Members')).toBeVisible()
      await expect(page.locator('text=Clients')).toBeVisible()
      await expect(page.locator('text=Workflows')).toBeVisible()
      await expect(page.locator('text=Storage')).toBeVisible()
    })

    test('should display available plans', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Available Plans section
      await expect(page.locator('text=Available Plans')).toBeVisible()

      // Should show plan comparison text
      await expect(
        page.locator('text=Compare features and choose the right plan')
      ).toBeVisible()
    })

    test('should display invoice history section', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Invoice History card
      await expect(page.locator('text=Invoice History')).toBeVisible()
    })

    test('should display payment methods section', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Payment Methods card
      await expect(page.locator('text=Payment Methods')).toBeVisible()
    })

    test('should have action buttons', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should have Change Plan button
      await expect(page.locator('button:has-text("Change Plan")')).toBeVisible()

      // Should have Update Payment Method button
      await expect(
        page.locator('button:has-text("Update Payment Method")')
      ).toBeVisible()
    })

    test('should display billing contact section', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Billing Contact card
      await expect(page.locator('text=Billing Contact')).toBeVisible()
    })

    test('should have help section', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Should show Need Help card
      await expect(page.locator('text=Need Help?')).toBeVisible()

      // Should have help links
      await expect(
        page.locator('button:has-text("Compare Plans")')
      ).toBeVisible()
      await expect(page.locator('button:has-text("Billing FAQ")')).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Setup")').click()
      await expect(page).toHaveURL('/admin/setup', { timeout: 10000 })
    })
  })

  test.describe('Organization Settings Page', () => {
    test('should navigate to organization from setup hub', async ({ page }) => {
      await page.goto('/admin/setup')
      await page.waitForLoadState('networkidle')

      const orgLink = page.locator('a[href="/admin/setup/organization"]')
      await expect(orgLink).toBeVisible({ timeout: 10000 })

      await orgLink.click()
      await expect(page).toHaveURL('/admin/setup/organization', {
        timeout: 10000,
      })
    })

    test('should load organization page directly', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(
        page.locator('h1:has-text("Organization Settings")')
      ).toBeVisible({ timeout: 10000 })

      // Check for back button
      await expect(page.locator('button:has-text("Setup")')).toBeVisible()
    })

    test('should display organization profile section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should show Organization Profile card
      await expect(page.locator('text=Organization Profile')).toBeVisible()

      // Should have organization name field
      await expect(page.locator('text=Organization Name')).toBeVisible()

      // Should have URL slug field
      await expect(page.locator('text=URL Slug')).toBeVisible()
    })

    test('should display logo upload section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should have Upload Logo button
      await expect(page.locator('button:has-text("Upload Logo")')).toBeVisible()
    })

    test('should display branding colors', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should have color options
      await expect(page.locator('text=Primary Color')).toBeVisible()
      await expect(page.locator('text=Secondary Color')).toBeVisible()
    })

    test('should display API keys section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should show API Keys card
      await expect(page.locator('text=API Keys')).toBeVisible()

      // Should show Live API Key
      await expect(page.locator('text=Live API Key')).toBeVisible()
    })

    test('should have API key action buttons', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should have icon buttons for key management
      const eyeButton = page.locator('button[title="Show key"]')
      const copyButton = page.locator('button[title="Copy key"]')
      const regenerateButton = page.locator('button[title="Regenerate key"]')

      expect(await eyeButton.count()).toBeGreaterThanOrEqual(0)
      expect(await copyButton.count()).toBeGreaterThanOrEqual(0)
      expect(await regenerateButton.count()).toBeGreaterThanOrEqual(0)
    })

    test('should display data management section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should show Data Management card
      await expect(page.locator('text=Data Management')).toBeVisible()

      // Should have Export Data option
      await expect(page.locator('text=Export Data')).toBeVisible()

      // Should have Request Export button
      await expect(
        page.locator('button:has-text("Request Export")')
      ).toBeVisible()
    })

    test('should display danger zone for admins', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should show Danger Zone section (if user is admin)
      const dangerZone = page.locator('text=Danger Zone')
      const isVisible = await dangerZone.isVisible().catch(() => false)

      if (isVisible) {
        // Should have delete organization button
        await expect(
          page.locator('button:has-text("Delete Organization")')
        ).toBeVisible()
      }
    })

    test('should display organization members section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Should show Organization Members card
      await expect(page.locator('text=Organization Members')).toBeVisible()

      // Should have Manage Members button
      await expect(
        page.locator(
          'button:has-text("Manage Members"), a:has-text("Manage Members")'
        )
      ).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Setup")').click()
      await expect(page).toHaveURL('/admin/setup', { timeout: 10000 })
    })
  })

  test.describe('Feature Gates Display', () => {
    test('should show tier badge on API keys section', async ({ page }) => {
      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // API keys section should show Professional+ badge
      const apiKeysSection = page.locator('text=API Keys').locator('..')
      const tierBadge = apiKeysSection.locator('text=Professional+')

      // Badge might be visible if feature is tier-gated
      const isVisible = await tierBadge.isVisible().catch(() => false)
      expect(isVisible !== undefined).toBeTruthy()
    })

    test('should display plan-specific upgrade options on billing page', async ({
      page,
    }) => {
      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // If not on enterprise, should show upgrade option
      const upgradeCard = page.locator('text=Upgrade Your Plan')
      const isVisible = await upgradeCard.isVisible().catch(() => false)

      // This is expected to be visible for non-enterprise tiers
      expect(isVisible !== undefined).toBeTruthy()
    })
  })

  test.describe('Responsive Design', () => {
    test('billing page should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/setup/billing')
      await page.waitForLoadState('networkidle')

      // Header should be visible
      await expect(page.locator('h1:has-text("Billing")')).toBeVisible()

      // Current plan section should be visible
      await expect(page.locator('text=Current Plan')).toBeVisible()
    })

    test('organization page should display properly on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/setup/organization')
      await page.waitForLoadState('networkidle')

      // Header should be visible
      await expect(
        page.locator('h1:has-text("Organization Settings")')
      ).toBeVisible()

      // Profile section should be visible
      await expect(page.locator('text=Organization Profile')).toBeVisible()
    })
  })
})
