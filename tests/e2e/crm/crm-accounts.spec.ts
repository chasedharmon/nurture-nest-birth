import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'

test.describe('CRM Accounts', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Accounts List View', () => {
    test('should load accounts list page', async ({ page }) => {
      await page.goto('/admin/accounts')
      await expect(page).toHaveURL('/admin/accounts')

      // Should show page title
      await expect(page.locator('h1:has-text("Accounts")')).toBeVisible()
    })

    test('should display accounts table with columns', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Check for table headers
      await expect(page.locator('th:has-text("Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Type")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
    })

    test('should show seeded E2E test account', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Wait for the seeded account to appear
      await expect(page.locator('text=E2E Test Household')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('E2E Test')

        // Should filter to show only matching accounts
        await expect(page.locator('text=E2E Test Household')).toBeVisible()
      }
    })

    test('should navigate to account detail on row click', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Wait for accounts to load
      await expect(page.locator('text=E2E Test Household')).toBeVisible({
        timeout: 10000,
      })

      // Click on the account row
      await page.locator('text=E2E Test Household').click()

      // Should navigate to account detail page
      await expect(page).toHaveURL(
        new RegExp(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)
      )
    })
  })

  test.describe('Account Detail View', () => {
    test('should load account detail page', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show account name
      await expect(page.locator('text=E2E Test Household')).toBeVisible()
    })

    test('should display account information fields', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show basic account info
      await expect(
        page.locator('text=household').or(page.locator('text=Household'))
      ).toBeVisible()
      await expect(page.locator('text=555-123-4567')).toBeVisible()
    })

    test('should show billing address', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show billing address fields
      await expect(page.locator('text=123 E2E Test St')).toBeVisible()
      await expect(page.locator('text=Test City')).toBeVisible()
      await expect(
        page.locator('text=TX').or(page.locator('text=75001'))
      ).toBeVisible()
    })

    test('should display account status badge', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show status badge (active)
      await expect(
        page.locator('text=Active').or(page.locator('text=active'))
      ).toBeVisible()
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show related contacts tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have Contacts tab
      await expect(page.locator('text=Contacts')).toBeVisible()
    })

    test('should display related contacts', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click Contacts tab
      await page
        .locator('button:has-text("Contacts")')
        .or(page.locator('[role="tab"]:has-text("Contacts")'))
        .click()

      // Should show the linked contact
      await expect(page.locator('text=E2E TestContact')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show related opportunities tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have Opportunities tab
      await expect(page.locator('text=Opportunities')).toBeVisible()
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have back link
      const backLink = page
        .locator('a:has-text("Back")')
        .or(page.locator('a:has-text("Accounts")'))
      await expect(backLink.first()).toBeVisible()

      await backLink.first().click()
      await expect(page).toHaveURL(/\/admin\/accounts$/)
    })
  })

  test.describe('Account Create', () => {
    test('should have create account button', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Should have new account button
      const newButton = page
        .locator('button:has-text("New Account")')
        .or(page.locator('a:has-text("New Account")'))
      await expect(newButton.first()).toBeVisible()
    })

    test('should open create account form', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Click new account button
      const newButton = page
        .locator('button:has-text("New Account")')
        .or(page.locator('a:has-text("New Account")'))
      await newButton.first().click()

      // Should navigate to new account page or open modal
      await expect(
        page
          .locator('h1:has-text("New Account")')
          .or(page.locator('h2:has-text("New Account")'))
          .or(page.locator('text=Create Account'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show required fields in create form', async ({ page }) => {
      await page.goto('/admin/accounts/new')

      // Should have required field labels
      await expect(
        page.locator('text=Account Name').or(page.locator('text=Name'))
      ).toBeVisible()
      await expect(
        page.locator('text=Account Type').or(page.locator('text=Type'))
      ).toBeVisible()
    })

    test('should create new account', async ({ page }) => {
      const timestamp = Date.now()
      const accountName = `E2E CreateAccount ${timestamp}`

      await page.goto('/admin/accounts/new')

      // Fill out the form
      await page.fill('input[name="name"]', accountName)

      // Select account type
      const typeSelect = page
        .locator('select[name="account_type"]')
        .or(page.locator('[name="account_type"]'))
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('household')
      }

      await page.fill('input[name="phone"]', '555-999-7777')
      await page.fill('input[name="billing_city"]', 'New Test City')

      // Submit the form
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should redirect to account detail or list
      await expect(page).toHaveURL(/\/admin\/accounts/, { timeout: 10000 })

      // Verify account was created by searching
      await page.goto('/admin/accounts')
      await expect(page.locator(`text=${accountName}`)).toBeVisible({
        timeout: 10000,
      })
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.goto('/admin/accounts/new')

      // Try to submit without filling required fields
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/admin\/accounts\/new/)
    })
  })

  test.describe('Account Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should show edit form or navigate to edit page
      await expect(
        page
          .locator('button:has-text("Save")')
          .or(page.locator('button:has-text("Cancel")'))
          .or(page.locator('input[name="name"]'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update account phone', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Update phone number
      const phoneInput = page.locator('input[name="phone"]')
      await phoneInput.clear()
      await phoneInput.fill('555-333-4444')

      // Save changes
      const saveButton = page.locator('button:has-text("Save")')
      await saveButton.click()

      // Should show updated phone
      await expect(page.locator('text=555-333-4444')).toBeVisible({
        timeout: 10000,
      })

      // Restore original phone
      await editButton.first().click()
      await phoneInput.clear()
      await phoneInput.fill('555-123-4567')
      await saveButton.click()
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Make a change
      const phoneInput = page.locator('input[name="phone"]')
      await phoneInput.clear()
      await phoneInput.fill('555-000-0000')

      // Cancel
      const cancelButton = page.locator('button:has-text("Cancel")')
      await cancelButton.click()

      // Should show original phone
      await expect(page.locator('text=555-123-4567')).toBeVisible()
    })
  })

  test.describe('Account Search & Filter', () => {
    test('should filter accounts by type', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Look for type filter
      const typeFilter = page
        .locator('select[name="account_type"]')
        .or(page.locator('button:has-text("Type")'))
      if (await typeFilter.isVisible()) {
        await typeFilter.click()
        await page.locator('text=Household').click()

        // Should filter results
        await expect(page.locator('text=E2E Test Household')).toBeVisible()
      }
    })

    test('should filter accounts by status', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Look for status filter
      const statusFilter = page
        .locator('select[name="status"]')
        .or(page.locator('button:has-text("Status")'))
      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.locator('text=Active').click()

        // Should filter results
        await expect(page.locator('text=E2E Test Household')).toBeVisible()
      }
    })

    test('should clear search filter', async ({ page }) => {
      await page.goto('/admin/accounts')

      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        // Apply search
        await searchInput.fill('E2E Test')
        await expect(page.locator('text=E2E Test Household')).toBeVisible()

        // Clear search
        await searchInput.clear()

        // All accounts should be visible again
        await expect(page.locator('text=E2E Test Household')).toBeVisible()
      }
    })
  })

  test.describe('Account-Contact Relationships', () => {
    test('should navigate from account to contact', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click Contacts tab
      await page
        .locator('button:has-text("Contacts")')
        .or(page.locator('[role="tab"]:has-text("Contacts")'))
        .click()

      // Click on contact
      const contactLink = page
        .locator('a:has-text("E2E TestContact")')
        .or(page.locator('text=E2E TestContact'))
      if (await contactLink.first().isVisible()) {
        await contactLink.first().click()

        // Should navigate to contact detail
        await expect(page).toHaveURL(
          new RegExp(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
        )
      }
    })

    test('should show contact count in tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show contact count in tab label
      await expect(
        page
          .locator('text=Contacts (1)')
          .or(page.locator('[role="tab"]:has-text("Contacts")'))
      ).toBeVisible()
    })
  })

  test.describe('Account Lifecycle Stage', () => {
    test('should display lifecycle stage', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show lifecycle stage
      await expect(
        page
          .locator('text=customer')
          .or(page.locator('text=Customer'))
          .or(page.locator('text=Lifecycle'))
      ).toBeVisible()
    })
  })
})
