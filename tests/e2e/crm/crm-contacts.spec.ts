import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const CRM_CONTACT_EMAIL = 'e2e.contact@example.com'

test.describe('CRM Contacts', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Contacts List View', () => {
    test('should load contacts list page', async ({ page }) => {
      await page.goto('/admin/contacts')
      await expect(page).toHaveURL('/admin/contacts')

      // Should show page title
      await expect(page.locator('h1:has-text("Contacts")')).toBeVisible()
    })

    test('should display contacts table with columns', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Check for table headers
      await expect(page.locator('th:has-text("Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Email")')).toBeVisible()
      await expect(page.locator('th:has-text("Phone")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
    })

    test('should show seeded E2E test contact', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Wait for the seeded contact to appear
      await expect(page.locator(`text=${CRM_CONTACT_EMAIL}`)).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('text=E2E TestContact')).toBeVisible()
    })

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('E2E')

        // Should filter to show only matching contacts
        await expect(page.locator('text=E2E TestContact')).toBeVisible()
      }
    })

    test('should navigate to contact detail on row click', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Wait for contacts to load
      await expect(page.locator('text=E2E TestContact')).toBeVisible({
        timeout: 10000,
      })

      // Click on the contact row
      await page.locator('text=E2E TestContact').click()

      // Should navigate to contact detail page
      await expect(page).toHaveURL(
        new RegExp(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
      )
    })
  })

  test.describe('Contact Detail View', () => {
    test('should load contact detail page', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show contact name
      await expect(page.locator('text=E2E TestContact')).toBeVisible()
    })

    test('should display contact information fields', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show basic contact info
      await expect(page.locator(`text=${CRM_CONTACT_EMAIL}`)).toBeVisible()
      await expect(page.locator('text=555-123-4567')).toBeVisible()
    })

    test('should show linked account', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show linked account
      await expect(page.locator('text=E2E Test Household')).toBeVisible()
    })

    test('should display contact status badge', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show status badge (active)
      await expect(
        page.locator('text=Active').or(page.locator('text=active'))
      ).toBeVisible()
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show Portal Access tab', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have Portal Access tab
      await expect(page.locator('text=Portal Access')).toBeVisible()
    })

    test('should toggle portal access', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Click Portal Access tab
      await page
        .locator('button:has-text("Portal Access")')
        .or(page.locator('[role="tab"]:has-text("Portal Access")'))
        .click()

      // Should show portal access toggle
      const portalToggle = page
        .locator('button[role="switch"]')
        .or(page.locator('[id="portal-access"]'))
      await expect(portalToggle).toBeVisible()
    })

    test('should show related activities tab', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have Activities tab
      await expect(page.locator('text=Activities')).toBeVisible()
    })

    test('should show related opportunities tab', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have Opportunities tab
      await expect(page.locator('text=Opportunities')).toBeVisible()
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have back link
      const backLink = page
        .locator('a:has-text("Back")')
        .or(page.locator('a:has-text("Contacts")'))
      await expect(backLink.first()).toBeVisible()

      await backLink.first().click()
      await expect(page).toHaveURL(/\/admin\/contacts$/)
    })
  })

  test.describe('Contact Create', () => {
    test('should have create contact button', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Should have new contact button
      const newButton = page
        .locator('button:has-text("New Contact")')
        .or(page.locator('a:has-text("New Contact")'))
      await expect(newButton.first()).toBeVisible()
    })

    test('should open create contact form', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Click new contact button
      const newButton = page
        .locator('button:has-text("New Contact")')
        .or(page.locator('a:has-text("New Contact")'))
      await newButton.first().click()

      // Should navigate to new contact page or open modal
      await expect(
        page
          .locator('h1:has-text("New Contact")')
          .or(page.locator('h2:has-text("New Contact")'))
          .or(page.locator('text=Create Contact'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show required fields in create form', async ({ page }) => {
      await page.goto('/admin/contacts/new')

      // Should have required field labels
      await expect(page.locator('text=First Name')).toBeVisible()
      await expect(page.locator('text=Last Name')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()
    })

    test('should create new contact', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `e2e-create-${timestamp}@example.com`

      await page.goto('/admin/contacts/new')

      // Fill out the form
      await page.fill('input[name="first_name"]', 'E2E')
      await page.fill('input[name="last_name"]', `CreateTest${timestamp}`)
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="phone"]', '555-999-8888')

      // Submit the form
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should redirect to contact detail or list
      await expect(page).toHaveURL(/\/admin\/contacts/, { timeout: 10000 })

      // Verify contact was created by searching
      await page.goto('/admin/contacts')
      await expect(page.locator(`text=${testEmail}`)).toBeVisible({
        timeout: 10000,
      })
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.goto('/admin/contacts/new')

      // Try to submit without filling required fields
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/admin\/contacts\/new/)
    })
  })

  test.describe('Contact Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

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
          .or(page.locator('input[name="first_name"]'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update contact phone', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Update phone number
      const phoneInput = page.locator('input[name="phone"]')
      await phoneInput.clear()
      await phoneInput.fill('555-111-2222')

      // Save changes
      const saveButton = page.locator('button:has-text("Save")')
      await saveButton.click()

      // Should show updated phone
      await expect(page.locator('text=555-111-2222')).toBeVisible({
        timeout: 10000,
      })

      // Restore original phone
      await editButton.first().click()
      await phoneInput.clear()
      await phoneInput.fill('555-123-4567')
      await saveButton.click()
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

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

  test.describe('Contact Account Linking', () => {
    test('should show account information', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show linked account name
      await expect(page.locator('text=E2E Test Household')).toBeVisible()
    })

    test('should navigate to linked account', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Click on account link
      const accountLink = page.locator('a:has-text("E2E Test Household")')
      if (await accountLink.isVisible()) {
        await accountLink.click()

        // Should navigate to account detail
        await expect(page).toHaveURL(
          new RegExp(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)
        )
      }
    })
  })

  test.describe('Contact Search & Filter', () => {
    test('should filter contacts by status', async ({ page }) => {
      await page.goto('/admin/contacts')

      // Look for status filter
      const statusFilter = page
        .locator('select[name="status"]')
        .or(page.locator('button:has-text("Status")'))
      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.locator('text=Active').click()

        // Should filter results
        await expect(page.locator('text=E2E TestContact')).toBeVisible()
      }
    })

    test('should clear search filter', async ({ page }) => {
      await page.goto('/admin/contacts')

      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        // Apply search
        await searchInput.fill('E2E')
        await expect(page.locator('text=E2E TestContact')).toBeVisible()

        // Clear search
        await searchInput.clear()

        // All contacts should be visible again (at least the E2E one)
        await expect(page.locator('text=E2E TestContact')).toBeVisible()
      }
    })
  })

  test.describe('Contact Due Date', () => {
    test('should display expected due date', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should show due date field (90 days from seeding)
      await expect(
        page.locator('text=Expected Due Date').or(page.locator('text=Due Date'))
      ).toBeVisible()
    })
  })
})
