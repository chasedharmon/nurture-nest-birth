import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Admin - Manual Lead Entry', () => {
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
    test('should navigate to new lead page from leads list', async ({
      page,
    }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Look for "Add Lead" or similar button
      const addLeadButton = page.locator(
        'a[href="/admin/leads/new"], button:has-text("Add Lead"), button:has-text("New Lead")'
      )
      await expect(addLeadButton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should load new lead page directly', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Check page header
      await expect(page.locator('h1:has-text("New Lead")')).toBeVisible({
        timeout: 10000,
      })

      // Check for back button
      await expect(page.locator('button:has-text("Leads")')).toBeVisible()
    })

    test('should display all form sections', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Check for Contact Information section
      await expect(page.locator('text=Contact Information')).toBeVisible()

      // Check for Service Information section
      await expect(page.locator('text=Service Information')).toBeVisible()

      // Check for Lead Source / Attribution section
      await expect(page.locator('text=Lead Source / Attribution')).toBeVisible()
    })

    test('should navigate back to leads list', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("Leads")').click()
      await expect(page).toHaveURL('/admin/leads', { timeout: 10000 })
    })
  })

  test.describe('Form Fields', () => {
    test('should display required fields with asterisks', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Name and Email should be marked as required
      await expect(page.locator('label:has-text("Name *")')).toBeVisible()
      await expect(page.locator('label:has-text("Email *")')).toBeVisible()
    })

    test('should have all contact information fields', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Check for all contact fields
      await expect(page.locator('#name')).toBeVisible()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#phone')).toBeVisible()
      await expect(page.locator('#dueDate')).toBeVisible()
    })

    test('should have service interest dropdown', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      const serviceSelect = page.locator('#serviceInterest')
      await expect(serviceSelect).toBeVisible()

      // Should have service options
      await expect(serviceSelect.locator('option')).toHaveCount(8) // Including empty option
    })

    test('should have referral source dropdown', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      const referralSelect = page.locator('#referralSource')
      await expect(referralSelect).toBeVisible()

      // Should have referral source options
      await expect(
        referralSelect.locator('option:has-text("Google Search")')
      ).toBeVisible()
      await expect(
        referralSelect.locator('option:has-text("Social Media")')
      ).toBeVisible()
      await expect(
        referralSelect.locator('option:has-text("Friend/Family Referral")')
      ).toBeVisible()
    })

    test('should have collapsible UTM fields', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // UTM section should be visible but collapsed
      await expect(
        page.locator('text=Marketing Campaign Tracking')
      ).toBeVisible()

      // UTM fields should not be visible initially
      await expect(page.locator('#utmSource')).not.toBeVisible()

      // Click to expand
      await page.locator('text=Marketing Campaign Tracking').click()
      await page.waitForTimeout(300)

      // Now UTM fields should be visible
      await expect(page.locator('#utmSource')).toBeVisible()
      await expect(page.locator('#utmMedium')).toBeVisible()
      await expect(page.locator('#utmCampaign')).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('should show error when name is empty', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Fill only email
      const emailInput = page.locator('#email')
      await emailInput.click()
      await emailInput.pressSequentially('test@example.com', { delay: 30 })

      // Submit form
      await page
        .locator('button[type="submit"]:has-text("Create Lead")')
        .click()

      // Should show error
      await expect(page.locator('text=Name is required')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show error when email is empty', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Fill only name
      const nameInput = page.locator('#name')
      await nameInput.click()
      await nameInput.pressSequentially('Test Lead', { delay: 30 })

      // Submit form
      await page
        .locator('button[type="submit"]:has-text("Create Lead")')
        .click()

      // Should show error
      await expect(page.locator('text=Email is required')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Form Submission', () => {
    test('should create lead with minimum required fields', async ({
      page,
    }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      const timestamp = Date.now()
      const testName = `Test Lead ${timestamp}`
      const testEmail = `test-${timestamp}@example.com`

      // Fill required fields
      const nameInput = page.locator('#name')
      await nameInput.click()
      await nameInput.pressSequentially(testName, { delay: 30 })

      const emailInput = page.locator('#email')
      await emailInput.click()
      await emailInput.pressSequentially(testEmail, { delay: 30 })

      // Submit form
      await page
        .locator('button[type="submit"]:has-text("Create Lead")')
        .click()

      // Should redirect to lead detail page
      await expect(page).toHaveURL(/\/admin\/leads\/[a-f0-9-]+/, {
        timeout: 15000,
      })
    })

    test('should create lead with all fields filled', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      const timestamp = Date.now()
      const testName = `Full Lead ${timestamp}`
      const testEmail = `full-lead-${timestamp}@example.com`

      // Fill all contact info
      const nameInput = page.locator('#name')
      await nameInput.click()
      await nameInput.pressSequentially(testName, { delay: 30 })

      const emailInput = page.locator('#email')
      await emailInput.click()
      await emailInput.pressSequentially(testEmail, { delay: 30 })

      const phoneInput = page.locator('#phone')
      await phoneInput.click()
      await phoneInput.pressSequentially('555-123-4567', { delay: 30 })

      // Set due date (3 months from now)
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      const formattedDate = futureDate.toISOString().split('T')[0]
      await page.locator('#dueDate').fill(formattedDate)

      // Select service interest
      await page.locator('#serviceInterest').selectOption('birth_doula')

      // Add message
      const messageTextarea = page.locator('#message')
      await messageTextarea.click()
      await messageTextarea.pressSequentially('This is a test lead message.', {
        delay: 20,
      })

      // Select referral source
      await page.locator('#referralSource').selectOption('google_search')

      // Add source detail
      const sourceDetailInput = page.locator('#sourceDetail')
      await sourceDetailInput.click()
      await sourceDetailInput.pressSequentially(
        'Found via organic search for doula services',
        { delay: 20 }
      )

      // Submit form
      await page
        .locator('button[type="submit"]:has-text("Create Lead")')
        .click()

      // Should redirect to lead detail page
      await expect(page).toHaveURL(/\/admin\/leads\/[a-f0-9-]+/, {
        timeout: 15000,
      })

      // Verify the lead info is displayed on detail page
      await expect(page.locator(`text=${testName}`).first()).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show creating state while submitting', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      const timestamp = Date.now()

      // Fill required fields
      const nameInput = page.locator('#name')
      await nameInput.click()
      await nameInput.pressSequentially(`State Test ${timestamp}`, {
        delay: 30,
      })

      const emailInput = page.locator('#email')
      await emailInput.click()
      await emailInput.pressSequentially(`state-${timestamp}@example.com`, {
        delay: 30,
      })

      // Submit form
      await page
        .locator('button[type="submit"]:has-text("Create Lead")')
        .click()

      // Should show creating state (button text changes)
      await expect(page.locator('button:has-text("Creating...")')).toBeVisible({
        timeout: 2000,
      })
    })
  })

  test.describe('Cancel Button', () => {
    test('should cancel and return to leads list', async ({ page }) => {
      await page.goto('/admin/leads/new')
      await page.waitForLoadState('networkidle')

      // Click cancel button
      await page
        .locator('a:has-text("Cancel"), button:has-text("Cancel")')
        .click()

      // Should return to leads list
      await expect(page).toHaveURL('/admin/leads', { timeout: 10000 })
    })
  })
})
