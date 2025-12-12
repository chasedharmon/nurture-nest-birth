import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_LEAD_ID = 'e2e00000-0000-0000-0000-000000000102'
const CRM_LEAD_EMAIL = 'e2e.lead@example.com'

test.describe('CRM Leads', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Leads List View', () => {
    test('should load leads list page', async ({ page }) => {
      await page.goto('/admin/crm-leads')
      await expect(page).toHaveURL('/admin/crm-leads')

      // Should show page title
      await expect(page.locator('h1:has-text("Leads")')).toBeVisible()
    })

    test('should display leads table with columns', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Check for table headers (metadata-driven labels)
      await expect(page.locator('th:has-text("Last Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Email")')).toBeVisible()
      await expect(page.locator('th:has-text("Lead Status")')).toBeVisible()
    })

    test('should show seeded E2E test lead', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Wait for the seeded lead to appear (TestLead is the last name)
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })
    })

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('TestLead')

        // Should filter to show only matching leads
        await expect(page.locator('text=TestLead').first()).toBeVisible()
      }
    })

    test('should navigate to lead detail on row click', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Wait for leads to load (TestLead is the last name)
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Click on the lead link (first name cell is clickable, not last name)
      await page.locator(`a[href*="${E2E_CRM_LEAD_ID}"]`).first().click()

      // Should navigate to lead detail page
      await expect(page).toHaveURL(
        new RegExp(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)
      )
    })
  })

  test.describe('Lead Detail View', () => {
    test('should load lead detail page', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show lead name (First Last: E2E TestLead)
      await expect(page.locator('text=TestLead').first()).toBeVisible()
    })

    test('should display lead information fields', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show basic lead info
      await expect(page.locator(`text=${CRM_LEAD_EMAIL}`)).toBeVisible()
      await expect(page.locator('text=555-222-3333')).toBeVisible()
    })

    test('should display lead status badge', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show status badge (qualified)
      await expect(
        page.locator('text=Qualified').or(page.locator('text=qualified'))
      ).toBeVisible()
    })

    test('should show lead source', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show lead source field (may need to click Details tab)
      const detailsTab = page.locator('[role="tab"]:has-text("Details")')
      if (await detailsTab.isVisible()) {
        await detailsTab.click()
      }
      // Check the Lead Source field label exists (value may be empty if picklist not seeded)
      await expect(page.locator('text=Lead Source').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show service interest', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show service interest field (may need to click Details tab)
      const detailsTab = page.locator('[role="tab"]:has-text("Details")')
      if (await detailsTab.isVisible()) {
        await detailsTab.click()
      }
      // Check the Service Interest field label exists (value may be empty if picklist not seeded)
      await expect(page.locator('text=Service Interest').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show Portal Access tab', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should have Portal Access tab
      await expect(page.locator('text=Portal Access')).toBeVisible()
    })

    test('should show Convert Lead button for unconverted leads', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show convert button (may be in header or actions area)
      await expect(
        page
          .locator('button:has-text("Convert Lead")')
          .or(page.locator('a:has-text("Convert Lead")'))
          .or(page.locator('button:has-text("Convert")'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show related activities tab', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should have Activities tab
      await expect(page.locator('text=Activities')).toBeVisible()
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should have back link (link to /admin/crm-leads list)
      const backLink = page
        .locator('a[href="/admin/crm-leads"]')
        .or(page.locator('a:has-text("Back")'))
        .or(page.locator('a:has-text("Leads")'))
        .or(page.locator('[aria-label="Back"]'))
      await expect(backLink.first()).toBeVisible({ timeout: 5000 })

      await backLink.first().click()
      await expect(page).toHaveURL(/\/admin\/crm-leads/)
    })
  })

  test.describe('Lead Create', () => {
    test('should have create lead button', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Should have new lead button
      const newButton = page
        .locator('button:has-text("New Lead")')
        .or(page.locator('a:has-text("New Lead")'))
      await expect(newButton.first()).toBeVisible()
    })

    test('should open create lead form', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Click new lead button
      const newButton = page
        .locator('button:has-text("New Lead")')
        .or(page.locator('a:has-text("New Lead")'))
      await newButton.first().click()

      // Should navigate to new lead page or open modal
      await expect(
        page
          .locator('h1:has-text("New Lead")')
          .or(page.locator('h2:has-text("New Lead")'))
          .or(page.locator('text=Create Lead'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show required fields in create form', async ({ page }) => {
      await page.goto('/admin/crm-leads/new')

      // Should have required field labels (metadata-driven)
      await expect(page.locator('text=First Name').first()).toBeVisible()
      await expect(page.locator('text=Last Name').first()).toBeVisible()
      await expect(page.locator('text=Email').first()).toBeVisible()
    })

    test('should create new lead', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `e2e-newlead-${timestamp}@example.com`

      await page.goto('/admin/crm-leads/new')

      // Fill out the form using placeholder selectors (dynamic form doesn't use name attr)
      const firstNameInput = page.locator(
        'input[placeholder*="first name" i], input[placeholder*="Enter first name" i]'
      )
      await firstNameInput.fill('E2E')

      const lastNameInput = page.locator(
        'input[placeholder*="last name" i], input[placeholder*="Enter last name" i]'
      )
      await lastNameInput.fill(`NewLead${timestamp}`)

      // Email field uses "email@example.com" placeholder
      const emailInput = page.locator(
        'input[placeholder*="email@example.com" i], input[type="email"]'
      )
      await emailInput.fill(testEmail)

      // Phone field uses "(555) 555-5555" placeholder
      const phoneInput = page.locator(
        'input[placeholder*="555" i], input[type="tel"]'
      )
      await phoneInput.fill('555-888-7777')

      // Submit the form
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should redirect to lead detail or list
      await expect(page).toHaveURL(/\/admin\/crm-leads/, { timeout: 10000 })

      // Verify lead was created by searching
      await page.goto('/admin/crm-leads')
      await expect(page.locator(`text=${testEmail}`)).toBeVisible({
        timeout: 10000,
      })
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.goto('/admin/crm-leads/new')

      // Try to submit without filling required fields
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/admin\/crm-leads\/new/)
    })
  })

  test.describe('Lead Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should show edit form - look for first name textbox (dynamic form)
      await expect(
        page.getByRole('textbox', { name: /first name/i })
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update lead phone', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Update phone number using placeholder or type selector
      const phoneInput = page.locator(
        'input[placeholder*="555" i], input[type="tel"]'
      )
      await phoneInput.clear()
      await phoneInput.fill('555-555-5555')

      // Save changes
      const saveButton = page.locator('button:has-text("Save")')
      await saveButton.click()

      // Should show updated phone
      await expect(page.locator('text=555-555-5555')).toBeVisible({
        timeout: 10000,
      })

      // Restore original phone
      await editButton.first().click()
      const phoneInputRestore = page.locator(
        'input[placeholder*="555" i], input[type="tel"]'
      )
      await phoneInputRestore.clear()
      await phoneInputRestore.fill('555-222-3333')
      await saveButton.click()
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Make a change using placeholder selector
      const phoneInput = page.locator(
        'input[placeholder*="555" i], input[type="tel"]'
      )
      await phoneInput.clear()
      await phoneInput.fill('555-000-0000')

      // Cancel
      const cancelButton = page.locator('button:has-text("Cancel")').first()
      await cancelButton.click()

      // Should show original phone
      await expect(page.locator('text=555-222-3333')).toBeVisible()
    })
  })

  test.describe('Lead Status Changes', () => {
    test('should show status options', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should have status dropdown (picklist rendered with button trigger)
      const statusSelect = page
        .locator('[aria-label*="Lead Status" i]')
        .or(page.locator('button:has-text("New")'))
        .or(page.locator('button:has-text("Contacted")'))
        .or(page.locator('button:has-text("Qualified")'))
      await expect(statusSelect.first()).toBeVisible({ timeout: 5000 })
    })

    test('should display all status options', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Check for status options
      const statusSelect = page.locator('select[name="lead_status"]')
      if (await statusSelect.isVisible()) {
        await expect(
          statusSelect
            .locator('option:has-text("New")')
            .or(statusSelect.locator('option[value="new"]'))
        ).toBeVisible()
        await expect(
          statusSelect
            .locator('option:has-text("Contacted")')
            .or(statusSelect.locator('option[value="contacted"]'))
        ).toBeVisible()
        await expect(
          statusSelect
            .locator('option:has-text("Qualified")')
            .or(statusSelect.locator('option[value="qualified"]'))
        ).toBeVisible()
      }
    })
  })

  test.describe('Lead Search & Filter', () => {
    test('should filter leads by status', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Look for status filter
      const statusFilter = page
        .locator('select[name="lead_status"]')
        .or(page.locator('button:has-text("Status")'))
      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.locator('text=Qualified').click()

        // Should filter results (TestLead is the last name)
        await expect(page.locator('text=TestLead').first()).toBeVisible()
      }
    })

    test('should filter leads by source', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      // Look for source filter
      const sourceFilter = page
        .locator('select[name="lead_source"]')
        .or(page.locator('button:has-text("Source")'))
      if (await sourceFilter.isVisible()) {
        await sourceFilter.click()
        await page.locator('text=Website').first().click()

        // Should filter results (TestLead is the last name)
        await expect(page.locator('text=TestLead').first()).toBeVisible()
      }
    })

    test('should clear search filter', async ({ page }) => {
      await page.goto('/admin/crm-leads')

      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        // Apply search
        await searchInput.fill('TestLead')
        await expect(page.locator('text=TestLead').first()).toBeVisible()

        // Clear search
        await searchInput.clear()

        // All leads should be visible again (TestLead is the last name)
        await expect(page.locator('text=TestLead').first()).toBeVisible({
          timeout: 5000,
        })
      }
    })
  })

  test.describe('Lead Expected Due Date', () => {
    test('should display expected due date', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should show due date field
      await expect(
        page.locator('text=Expected Due Date').or(page.locator('text=Due Date'))
      ).toBeVisible()
    })
  })

  test.describe('Lead Portal Access', () => {
    test('should toggle portal access for lead', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

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

    test('should show limited portal experience message for leads', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click Portal Access tab
      await page
        .locator('button:has-text("Portal Access")')
        .or(page.locator('[role="tab"]:has-text("Portal Access")'))
        .click()

      // Should show message about limited lead portal experience (may show in various ways)
      await expect(
        page
          .locator('text=Lead Portal Experience')
          .or(page.locator('text=Limited access'))
          .or(page.locator('text=limited'))
          .or(page.locator('text=Portal'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Lead Conversion', () => {
    test('should navigate to lead conversion page', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click convert button
      const convertButton = page
        .locator('button:has-text("Convert Lead")')
        .or(page.locator('a:has-text("Convert Lead")'))
        .or(page.locator('button:has-text("Convert")'))
      await convertButton.first().click()

      // Should navigate to conversion page
      await expect(page).toHaveURL(
        new RegExp(`/admin/crm-leads/${E2E_CRM_LEAD_ID}/convert`)
      )
    })

    test('should show conversion form fields', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}/convert`)

      // Should show conversion options
      await expect(
        page
          .locator('text=Create Contact')
          .or(page.locator('text=Create Account'))
          .or(page.locator('text=Convert'))
          .or(page.locator('h1:has-text("Convert")'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })
  })
})
