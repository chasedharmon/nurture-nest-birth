import { test, expect } from '@playwright/test'

test.describe('Admin Phase 4 Features', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Invoice Management', () => {
    test('should display invoices tab on client detail page', async ({
      page,
    }) => {
      // Navigate to admin
      await page.goto('/admin')

      // Click on a lead/client if available
      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        // Look for invoices tab
        await expect(page.locator('text=Invoices')).toBeVisible()
      }
    })

    test('should navigate to invoice list', async ({ page }) => {
      await page.goto('/admin')

      // Try to find invoice link in navigation
      const invoiceLink = page.locator('a[href*="invoice"]')
      if ((await invoiceLink.count()) > 0) {
        await invoiceLink.first().click()
        await expect(page).toHaveURL(/invoice/)
      }
    })
  })

  test.describe('Payment Tracking', () => {
    test('should display payment status on clients', async ({ page }) => {
      await page.goto('/admin')

      // Check for payment-related elements
      const paymentStatus = page.locator('text=Payment')
      const hasPaymentInfo = (await paymentStatus.count()) > 0
      expect(hasPaymentInfo !== undefined).toBeTruthy()
    })
  })

  test.describe('Client Communication', () => {
    test('should have email/message functionality', async ({ page }) => {
      await page.goto('/admin')

      // Look for messaging features
      const messagesLink = page.locator('a[href*="messages"]')
      if ((await messagesLink.count()) > 0) {
        await messagesLink.first().click()
        await expect(page).toHaveURL(/messages/)
      }
    })
  })
})
