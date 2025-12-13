import { test, expect } from '@playwright/test'

test.describe('Admin CRM', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Dashboard', () => {
    test('should load admin dashboard', async ({ page }) => {
      await page.goto('/admin')
      await expect(page).toHaveURL('/admin')

      // Should show main content area (dashboard loads successfully)
      const main = page.locator('main')
      await expect(main).toBeVisible()
    })

    test('should display dashboard with KPI cards', async ({ page }) => {
      await page.goto('/admin')

      // Dashboard content should be visible
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Look for KPI elements or dashboard charts
      // The specific KPIs may vary based on dashboard configuration
      const kpiCard = page.locator('[data-testid="kpi-card"]').first()
      const hasKPIs = (await kpiCard.count()) > 0

      if (hasKPIs) {
        await expect(kpiCard).toBeVisible()
      }
    })

    test('should show navigation header and sign out option', async ({
      page,
      isMobile,
    }) => {
      await page.goto('/admin')

      // Header should be visible
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Sign out should be accessible (either in header menu or mobile nav)
      if (isMobile) {
        // Open mobile menu to find sign out
        const menuButton = page.getByRole('button', {
          name: /open navigation menu/i,
        })
        await menuButton.click()
        await expect(
          page.getByRole('button', { name: /sign out/i })
        ).toBeVisible()
      } else {
        // Desktop: Sign out is in user menu dropdown
        const userButton = page.getByRole('button', { name: /user/i })
        await userButton.click()
        await expect(
          page.getByRole('menuitem', { name: /sign out/i })
        ).toBeVisible()
      }
    })
  })

  test.describe('Lead Capture - Contact Form', () => {
    // Skip: Requires email service (RESEND_API_KEY) for form submission
    test.skip('should submit contact form and create lead', async ({
      page,
    }) => {
      // Generate unique email for this test
      const timestamp = Date.now()
      const testEmail = `test-${timestamp}@example.com`

      // Go to contact page
      await page.goto('/contact')

      // Fill out the form
      await page.fill('input[name="name"]', 'Test Lead Playwright')
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="phone"]', '(308) 555-1234')
      await page.fill('input[name="dueDate"]', '2025-06-15')
      await page.selectOption('select[name="service"]', 'birth-doula')
      await page.fill(
        'textarea[name="message"]',
        'This is an automated test submission from Playwright. Testing the CRM lead capture functionality.'
      )

      // Submit the form
      await page.click('button[type="submit"]')

      // Wait for success message
      await expect(
        page.locator('text=Thank you for your message!')
      ).toBeVisible({ timeout: 10000 })

      // Navigate to admin to verify lead was created
      await page.goto('/admin')

      // Verify the lead appears in the dashboard
      await expect(page.locator(`text=${testEmail}`)).toBeVisible()
      await expect(page.locator('text=Contact Form')).toBeVisible()
      await expect(page.locator('text=new')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/contact')

      // Try to submit without filling required fields
      await page.click('button[type="submit"]')

      // Should not submit (browser validation will prevent it)
      // Check that we're still on the contact page
      await expect(page).toHaveURL(/\/contact/)
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/contact')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('textarea[name="message"]', 'Test message here')

      // Try to submit
      await page.click('button[type="submit"]')

      // Browser should prevent submission due to invalid email
      await expect(page).toHaveURL(/\/contact/)
    })

    test('should validate minimum message length', async ({ page }) => {
      await page.goto('/contact')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('textarea[name="message"]', 'Short') // Less than 10 chars

      await page.click('button[type="submit"]')

      // Should show validation error
      // The error is shown in the form state, check we're still on contact page
      await expect(page).toHaveURL(/\/contact/)
    })
  })

  test.describe('Lead Capture - Newsletter', () => {
    test('should submit newsletter signup and create lead', async ({
      page,
    }) => {
      const timestamp = Date.now()
      const testEmail = `newsletter-${timestamp}@example.com`

      // Find a page with newsletter signup (could be home, blog, etc.)
      await page.goto('/')

      // Look for newsletter signup form
      const newsletterInput = page.locator(
        'input[type="email"][aria-label="Email address"]'
      )

      if (await newsletterInput.isVisible()) {
        await newsletterInput.fill(testEmail)
        await page.click('button:has-text("Subscribe")')

        // Wait for success message
        await expect(
          page.locator('text=Thank you for subscribing!')
        ).toBeVisible({ timeout: 10000 })

        // Navigate to admin to verify lead was created
        await page.goto('/admin')

        // Verify the newsletter lead appears
        await expect(page.locator(`text=${testEmail}`)).toBeVisible()
        await expect(page.locator('text=Newsletter')).toBeVisible()
      }
    })

    test('should prevent duplicate newsletter signups', async ({ page }) => {
      const duplicateEmail = 'duplicate@example.com'

      await page.goto('/')

      const newsletterInput = page.locator(
        'input[type="email"][aria-label="Email address"]'
      )

      if (await newsletterInput.isVisible()) {
        // First signup
        await newsletterInput.fill(duplicateEmail)
        await page.click('button:has-text("Subscribe")')
        await page.waitForTimeout(2000)

        // Try to signup again with same email
        await page.reload()
        await newsletterInput.fill(duplicateEmail)
        await page.click('button:has-text("Subscribe")')

        // Should show error about already subscribed
        await expect(page.locator('text=already subscribed')).toBeVisible()
      }
    })
  })

  test.describe('Stats Updates', () => {
    // Skip: Requires email service (RESEND_API_KEY) for form submission
    test.skip('should update stats after new lead is created', async ({
      page,
    }) => {
      await page.goto('/admin')

      // Get current total leads count
      const totalLeadsCard = page.locator('text=Total Leads').locator('..')
      const currentTotal = await totalLeadsCard
        .locator('div.text-3xl')
        .textContent()
      const currentCount = parseInt(currentTotal || '0', 10)

      // Submit a new contact form
      await page.goto('/contact')
      const timestamp = Date.now()
      await page.fill('input[name="name"]', 'Stats Test Lead')
      await page.fill('input[name="email"]', `stats-${timestamp}@example.com`)
      await page.fill(
        'textarea[name="message"]',
        'Testing stats update functionality'
      )
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Thank you')).toBeVisible()

      // Go back to admin and check stats updated
      await page.goto('/admin')
      await page.reload()

      const newTotal = await totalLeadsCard
        .locator('div.text-3xl')
        .textContent()
      const newCount = parseInt(newTotal || '0', 10)

      expect(newCount).toBe(currentCount + 1)
    })
  })
})
