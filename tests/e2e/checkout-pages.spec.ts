import { test, expect } from '@playwright/test'

// Note: Checkout pages are public (no auth required)

test.describe('Checkout Pages', () => {
  test.describe('Checkout Success Page', () => {
    test('should load success page', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Check for success message
      await expect(page.locator('text=Payment Successful')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should display success icon', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should have green checkmark icon area
      const iconContainer = page.locator('.bg-green-100, [class*="bg-green"]')
      await expect(iconContainer.first()).toBeVisible()
    })

    test('should display thank you message', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should have thank you message
      await expect(
        page.locator('text=Thank you for your payment')
      ).toBeVisible()
    })

    test('should show payment status as Paid', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should show Paid status
      await expect(page.locator('text=Status')).toBeVisible()
      await expect(page.getByText('Paid', { exact: true })).toBeVisible()
    })

    test('should have View My Portal button', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should have View My Portal button
      const portalButton = page.locator('a:has-text("View My Portal")')
      await expect(portalButton).toBeVisible()

      // Should link to client portal
      const href = await portalButton.getAttribute('href')
      expect(href).toBe('/client')
    })

    test('should have View Payment History button', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should have View Payment History button
      const historyButton = page.locator('a:has-text("View Payment History")')
      await expect(historyButton).toBeVisible()

      // Should link to payments
      const href = await historyButton.getAttribute('href')
      expect(href).toBe('/client/payments')
    })

    test('should display session reference when provided', async ({ page }) => {
      await page.goto('/checkout/success?session_id=cs_test_abc123xyz')
      await page.waitForLoadState('networkidle')

      // Should show Reference label
      await expect(page.locator('text=Reference')).toBeVisible()
    })

    test('should show demo mode banner when demo param present', async ({
      page,
    }) => {
      await page.goto('/checkout/success?demo=true')
      await page.waitForLoadState('networkidle')

      // Should show demo mode notice
      await expect(page.locator('text=Demo Mode')).toBeVisible()
      await expect(page.locator('text=This is a demonstration')).toBeVisible()
    })

    test('should have contact link', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Should have contact link
      await expect(page.locator('a:has-text("Contact us")')).toBeVisible()
    })

    test('should have gradient background', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Check for gradient background (green-themed)
      const backgroundDiv = page.locator(
        '.bg-gradient-to-b, [class*="from-green"]'
      )
      await expect(backgroundDiv.first()).toBeVisible()
    })
  })

  test.describe('Checkout Cancel Page', () => {
    test('should load cancel page', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Check for cancel message
      await expect(page.locator('text=Payment Cancelled')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should display cancel icon', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should have amber/warning icon area
      const iconContainer = page.locator('.bg-amber-100, [class*="bg-amber"]')
      await expect(iconContainer.first()).toBeVisible()
    })

    test('should display reassurance message', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should explain no charges were made
      await expect(page.locator('text=no charges were made')).toBeVisible()
    })

    test('should display what happens now section', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should explain next steps
      await expect(page.locator('text=What happens now?')).toBeVisible()

      // Should list items
      await expect(
        page.locator('text=Your invoice remains unpaid')
      ).toBeVisible()
      await expect(
        page.locator('text=You can return to pay when')
      ).toBeVisible()
    })

    test('should have Return to Payments button', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should have Return to Payments button
      const returnButton = page.locator('a:has-text("Return to Payments")')
      await expect(returnButton).toBeVisible()

      // Should link to payments
      const href = await returnButton.getAttribute('href')
      expect(href).toBe('/client/payments')
    })

    test('should have Need Help button', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should have Need Help button
      const helpButton = page.locator('a:has-text("Need Help?")')
      await expect(helpButton).toBeVisible()

      // Should link to contact
      const href = await helpButton.getAttribute('href')
      expect(href).toBe('/contact')
    })

    test('should have contact link in footer', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Should have contact link
      await expect(page.locator('a:has-text("Let us know")')).toBeVisible()
    })

    test('should have gradient background', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Check for gradient background (amber-themed)
      const backgroundDiv = page.locator(
        '.bg-gradient-to-b, [class*="from-amber"]'
      )
      await expect(backgroundDiv.first()).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('success page should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Main content should be visible
      await expect(page.locator('text=Payment Successful')).toBeVisible()

      // Buttons should be full width on mobile
      const portalButton = page.locator('a:has-text("View My Portal")')
      await expect(portalButton).toBeVisible()
    })

    test('cancel page should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Main content should be visible
      await expect(page.locator('text=Payment Cancelled')).toBeVisible()

      // Buttons should be full width on mobile
      const returnButton = page.locator('a:has-text("Return to Payments")')
      await expect(returnButton).toBeVisible()
    })
  })

  test.describe('Card Styling', () => {
    test('success page card should have green border', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Card should have green border styling
      const card = page.locator('.border-green-200, [class*="border-green"]')
      await expect(card.first()).toBeVisible()
    })

    test('cancel page card should have amber border', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Card should have amber border styling
      const card = page.locator('.border-amber-200, [class*="border-amber"]')
      await expect(card.first()).toBeVisible()
    })
  })

  test.describe('Navigation from Checkout Pages', () => {
    test('success page portal link should be clickable', async ({ page }) => {
      await page.goto('/checkout/success')
      await page.waitForLoadState('networkidle')

      // Click portal link (may redirect to login if not authenticated)
      const portalLink = page.locator('a:has-text("View My Portal")')
      await portalLink.click()

      // Should navigate away from success page
      await expect(page).not.toHaveURL('/checkout/success', { timeout: 10000 })
    })

    test('cancel page contact link should be clickable', async ({ page }) => {
      await page.goto('/checkout/cancel')
      await page.waitForLoadState('networkidle')

      // Click contact link
      const contactLink = page.locator('a:has-text("Need Help?")')
      await contactLink.click()

      // Should navigate to contact page
      await expect(page).toHaveURL('/contact', { timeout: 10000 })
    })
  })
})
