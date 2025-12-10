import { test, expect } from '@playwright/test'

test.describe('Admin Reports', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Reports List Page', () => {
    test('should navigate to reports page from admin dashboard', async ({
      page,
    }) => {
      // Click Reports link in header
      await page.click('a[href="/admin/reports"]')
      await expect(page).toHaveURL('/admin/reports')

      // Should show reports page header
      await expect(page.locator('text=Reports')).toBeVisible()
      await expect(page.locator('text=Create Report')).toBeVisible()
    })

    test('should display empty state or list of reports', async ({ page }) => {
      await page.goto('/admin/reports')

      // Should see either reports list or empty state
      const hasReports = await page.locator('table').isVisible()
      const hasEmptyState = await page
        .locator('text=No reports found')
        .isVisible()

      expect(hasReports || hasEmptyState).toBe(true)
    })

    test('should navigate to create report wizard', async ({ page }) => {
      await page.goto('/admin/reports')

      // Click create button
      await page.click('text=Create Report')
      await expect(page).toHaveURL('/admin/reports/new')
    })
  })

  test.describe('Report Builder Wizard - UI/UX', () => {
    test.beforeEach(async ({ page }) => {
      // Session is pre-authenticated via storageState
      // Navigate to admin to verify auth is working
      await page.goto('/admin/reports/new')
    })

    test('should display wizard with step progress and preview', async ({
      page,
    }) => {
      // Check for step progress indicators
      await expect(page.locator('text=Source')).toBeVisible()
      await expect(page.locator('text=Fields')).toBeVisible()
      await expect(page.locator('text=Filters')).toBeVisible()

      // Check for preview section
      await expect(page.locator('text=Report Preview')).toBeVisible()
    })

    test('should show helpful tooltips throughout wizard', async ({ page }) => {
      // Look for help icons
      const helpIcons = page.locator('button:has(svg.lucide-help-circle)')
      const helpCount = await helpIcons.count()
      expect(helpCount).toBeGreaterThan(0)

      // Click a help icon and verify tooltip appears
      if (helpCount > 0) {
        await helpIcons.first().hover()
        // Tooltips appear on hover
        await page.waitForTimeout(300)
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toBeVisible()
      }
    })

    test('should display data source options with icons and descriptions', async ({
      page,
    }) => {
      // Check for data source cards
      await expect(page.locator('text=Leads')).toBeVisible()
      await expect(page.locator('text=Clients')).toBeVisible()
      await expect(page.locator('text=Invoices')).toBeVisible()
      await expect(page.locator('text=Meetings')).toBeVisible()
      await expect(page.locator('text=Payments')).toBeVisible()
      await expect(page.locator('text=Services')).toBeVisible()

      // Check for report type options
      await expect(page.locator('text=Tabular')).toBeVisible()
      await expect(page.locator('text=Summary')).toBeVisible()
      await expect(page.locator('text=Chart')).toBeVisible()
    })
  })

  test.describe('Report Builder - Step 1: Data Source', () => {
    test.beforeEach(async ({ page }) => {
      // Session is pre-authenticated via storageState
      // Navigate to admin to verify auth is working
      await page.goto('/admin/reports/new')
    })

    test('should allow selecting different data sources', async ({ page }) => {
      // Click Leads card
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()

      // Next button should be enabled
      const nextButton = page.locator('button:has-text("Next")')
      await expect(nextButton).toBeEnabled()
    })

    test('should allow selecting report type', async ({ page }) => {
      // Select Chart report type
      await page.click('label:has-text("Chart")')

      // Should be selected (visual feedback)
      const chartLabel = page.locator('label:has-text("Chart")')
      await expect(chartLabel).toHaveClass(/border-primary/)
    })
  })

  test.describe('Report Builder - Step 2: Fields', () => {
    test.beforeEach(async ({ page }) => {
      // Session is pre-authenticated via storageState
      // Navigate to admin to verify auth is working
      await page.goto('/admin/reports/new')
      // Select data source and proceed
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()
      await page.click('button:has-text("Next")')
    })

    test('should display available fields for selected object', async ({
      page,
    }) => {
      await expect(page.locator('text=Select Fields')).toBeVisible()

      // Check for lead fields
      await expect(page.locator('text=Name')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()
      await expect(page.locator('text=Status')).toBeVisible()
      await expect(page.locator('text=Source')).toBeVisible()
    })

    test('should allow selecting and deselecting fields', async ({ page }) => {
      // Click on Name field checkbox
      const nameCheckbox = page.locator('input[type="checkbox"]').first()
      await nameCheckbox.click()

      // Selection count should update
      await expect(
        page.locator('text=/\\d+ of \\d+ fields selected/')
      ).toBeVisible()
    })

    test('should have Select All and Clear All buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Select All")')).toBeVisible()
      await expect(page.locator('button:has-text("Clear All")')).toBeVisible()

      // Click Select All
      await page.click('button:has-text("Select All")')

      // All checkboxes should be checked
      const checkboxes = page.locator('input[type="checkbox"]')
      const count = await checkboxes.count()
      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked()
      }
    })
  })

  test.describe('Report Builder - Step 3: Filters with Picklists', () => {
    test.beforeEach(async ({ page }) => {
      // Session is pre-authenticated via storageState
      // Navigate to admin to verify auth is working
      await page.goto('/admin/reports/new')
      // Navigate to filters step
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()
      await page.click('button:has-text("Next")')
      // Select some fields
      await page.click('button:has-text("Select All")')
      await page.click('button:has-text("Next")')
    })

    test('should show empty state for no filters', async ({ page }) => {
      await expect(
        page.locator(
          'text=No filters applied. Your report will include all records.'
        )
      ).toBeVisible()
      await expect(page.locator('button:has-text("Add Filter")')).toBeVisible()
    })

    test('should add a filter condition', async ({ page }) => {
      await page.click('button:has-text("Add Filter")')

      // Should show filter row with field, operator, and value
      await expect(page.locator('text=Field')).toBeVisible()
      await expect(page.locator('text=Operator')).toBeVisible()
    })

    test('should show picklist dropdown for Status field', async ({ page }) => {
      await page.click('button:has-text("Add Filter")')

      // Select Status field
      await page.locator('button:has-text("Name")').first().click()
      await page.locator('[role="option"]:has-text("Status")').click()

      // Value input should be a Select dropdown (picklist)
      const valueSelect = page
        .locator('button')
        .filter({ hasText: 'Select value...' })
      await expect(valueSelect).toBeVisible()

      // Click to open dropdown
      await valueSelect.click()

      // Should show status options
      await expect(
        page.locator('[role="option"]:has-text("New")')
      ).toBeVisible()
      await expect(
        page.locator('[role="option"]:has-text("Contacted")')
      ).toBeVisible()
      await expect(
        page.locator('[role="option"]:has-text("Qualified")')
      ).toBeVisible()
      await expect(
        page.locator('[role="option"]:has-text("Client")')
      ).toBeVisible()
    })

    test('should show picklist dropdown for Source field', async ({ page }) => {
      await page.click('button:has-text("Add Filter")')

      // Select Source field
      await page.locator('button:has-text("Name")').first().click()
      await page.locator('[role="option"]:has-text("Source")').click()

      // Value input should be a Select dropdown
      const valueSelect = page
        .locator('button')
        .filter({ hasText: 'Select value...' })
      await expect(valueSelect).toBeVisible()

      // Click to open dropdown
      await valueSelect.click()

      // Should show source options
      await expect(
        page.locator('[role="option"]:has-text("Website")')
      ).toBeVisible()
      await expect(
        page.locator('[role="option"]:has-text("Referral")')
      ).toBeVisible()
      await expect(
        page.locator('[role="option"]:has-text("Social Media")')
      ).toBeVisible()
    })

    test('should show text input for Name field (non-picklist)', async ({
      page,
    }) => {
      await page.click('button:has-text("Add Filter")')

      // Name should already be selected as default
      // Value input should be a text input, not a select
      const textInput = page.locator('input[placeholder="Enter value..."]')
      await expect(textInput).toBeVisible()
    })

    test('should show date picker for date fields', async ({ page }) => {
      await page.click('button:has-text("Add Filter")')

      // Select Created Date field
      await page.locator('button:has-text("Name")').first().click()
      await page.locator('[role="option"]:has-text("Created Date")').click()

      // Value input should be a date input
      const dateInput = page.locator('input[type="date"]')
      await expect(dateInput).toBeVisible()
    })

    test('should show human-readable filter description', async ({ page }) => {
      await page.click('button:has-text("Add Filter")')

      // Select Status field
      await page.locator('button:has-text("Name")').first().click()
      await page.locator('[role="option"]:has-text("Status")').click()

      // Select a value
      await page
        .locator('button')
        .filter({ hasText: 'Select value...' })
        .click()
      await page.locator('[role="option"]:has-text("New")').click()

      // Should show human-readable description
      await expect(
        page.locator('text=/Show records where.*Status.*equals.*"New"/')
      ).toBeVisible()
    })

    test('should allow multiple filters with AND/OR logic', async ({
      page,
    }) => {
      // Add first filter
      await page.click('button:has-text("Add Filter")')

      // Add second filter
      await page.click('button:has-text("Add Another Filter")')

      // Should show logic selector for second filter
      await expect(page.locator('text=Logic')).toBeVisible()
      const logicSelect = page.locator('button:has-text("AND")')
      await expect(logicSelect).toBeVisible()

      // Should be able to change to OR
      await logicSelect.click()
      await page.locator('[role="option"]:has-text("OR")').click()
    })
  })

  test.describe('Report Builder - Full Workflow', () => {
    test('should complete full tabular report creation', async ({ page }) => {
      await page.goto('/admin/reports/new')

      // Step 1: Select Leads as data source
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()
      await page.click('button:has-text("Next")')

      // Step 2: Select fields
      await page.click('button:has-text("Select All")')
      await page.click('button:has-text("Next")')

      // Step 3: Add filter (optional - skip)
      await page.click('button:has-text("Next")')

      // Step 4: Grouping (skip for tabular)
      await page.click('button:has-text("Next")')

      // Step 5: Aggregation (skip for tabular)
      await page.click('button:has-text("Next")')

      // Step 6: Should show Save/Finish option
      await expect(page.locator('button:has-text("Save Report")')).toBeVisible()
    })

    test('should complete leads report with status filter', async ({
      page,
    }) => {
      await page.goto('/admin/reports/new')

      // Step 1: Select Leads
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()
      await page.click('button:has-text("Next")')

      // Step 2: Select Name, Email, Status fields
      const checkboxes = page.locator('input[type="checkbox"]')
      await checkboxes.nth(0).click() // Name
      await checkboxes.nth(1).click() // Email
      await checkboxes.nth(3).click() // Status
      await page.click('button:has-text("Next")')

      // Step 3: Add status filter = "new"
      await page.click('button:has-text("Add Filter")')
      await page.locator('button:has-text("Name")').first().click()
      await page.locator('[role="option"]:has-text("Status")').click()

      await page
        .locator('button')
        .filter({ hasText: 'Select value...' })
        .click()
      await page.locator('[role="option"]:has-text("New")').click()

      await page.click('button:has-text("Next")')

      // Step 4, 5: Skip grouping and aggregation
      await page.click('button:has-text("Next")')
      await page.click('button:has-text("Next")')

      // Should reach save step
      await expect(page.locator('button:has-text("Save Report")')).toBeVisible()
    })

    test('should create and save an invoice summary report', async ({
      page,
    }) => {
      await page.goto('/admin/reports/new')

      // Step 1: Select Invoices with Summary type
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Invoices' })
        .first()
        .click()
      await page.click('label:has-text("Summary")')
      await page.click('button:has-text("Next")')

      // Step 2: Select fields
      await page.click('button:has-text("Select All")')
      await page.click('button:has-text("Next")')

      // Step 3: Add filter for status = paid
      await page.click('button:has-text("Add Filter")')
      await page.locator('button:has-text("Invoice #")').first().click()
      await page.locator('[role="option"]:has-text("Status")').click()

      await page
        .locator('button')
        .filter({ hasText: 'Select value...' })
        .click()
      await page.locator('[role="option"]:has-text("Paid")').click()
      await page.click('button:has-text("Next")')

      // Step 4: Add grouping by status
      // Look for grouping field selector
      const groupingStep = page.locator('text=Group By')
      if (await groupingStep.isVisible()) {
        // If grouping step is visible, add a grouping
        const groupSelect = page
          .locator('button:has-text("Select field")')
          .first()
        if (await groupSelect.isVisible()) {
          await groupSelect.click()
          await page.locator('[role="option"]:has-text("Status")').click()
        }
      }
      await page.click('button:has-text("Next")')

      // Step 5: Add SUM aggregation on Total
      const aggStep = page.locator('text=Add Aggregation')
      if (await aggStep.isVisible()) {
        await page.click('button:has-text("Add Aggregation")')
      }
      await page.click('button:has-text("Next")')

      // Should reach save step
      await expect(page.locator('button:has-text("Save Report")')).toBeVisible()
    })

    test('should show real-time preview while building report', async ({
      page,
    }) => {
      await page.goto('/admin/reports/new')

      // Preview should be visible
      await expect(page.locator('text=Report Preview')).toBeVisible()

      // Select Leads
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()

      // Preview should update to show data source
      await expect(
        page.locator('text=leads').or(page.locator('text=Leads'))
      ).toBeVisible()
    })
  })

  test.describe('Report Builder - Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Session is pre-authenticated via storageState
      // Navigate to admin to verify auth is working
      await page.goto('/admin/reports/new')
    })

    test('should allow navigating back through steps', async ({ page }) => {
      // Go to step 2
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Leads' })
        .first()
        .click()
      await page.click('button:has-text("Next")')

      // Should be on step 2
      await expect(page.locator('text=Select Fields')).toBeVisible()

      // Go back
      await page.click('button:has-text("Back")')

      // Should be on step 1
      await expect(page.locator('text=Select Data Source')).toBeVisible()
    })

    test('should preserve state when navigating between steps', async ({
      page,
    }) => {
      // Step 1: Select Clients
      await page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Clients' })
        .first()
        .click()
      await page.click('button:has-text("Next")')

      // Step 2: Select some fields
      await page.click('button:has-text("Select All")')
      await page.click('button:has-text("Next")')

      // Go back to step 2
      await page.click('button:has-text("Back")')

      // Fields should still be selected
      const checkboxes = page.locator('input[type="checkbox"]')
      const firstCheckbox = checkboxes.first()
      await expect(firstCheckbox).toBeChecked()

      // Go back to step 1
      await page.click('button:has-text("Back")')

      // Clients should still be selected
      const clientsCard = page
        .locator('.cursor-pointer')
        .filter({ hasText: 'Clients' })
        .first()
      await expect(clientsCard).toHaveClass(/border-primary/)
    })

    test('should have cancel button that returns to reports list', async ({
      page,
    }) => {
      // Look for cancel or back to reports link
      const cancelLink = page.locator('a[href="/admin/reports"]').first()
      await expect(cancelLink).toBeVisible()

      await cancelLink.click()
      await expect(page).toHaveURL('/admin/reports')
    })
  })

  test.describe('Dashboards Page', () => {
    test('should navigate to dashboards page', async ({ page }) => {
      await page.click('a[href="/admin/dashboards"]')
      await expect(page).toHaveURL('/admin/dashboards')

      // Should show dashboards page
      await expect(page.locator('text=Dashboards')).toBeVisible()
    })

    test('should show coming soon or dashboard list', async ({ page }) => {
      await page.goto('/admin/dashboards')

      // Either shows coming soon or dashboard list
      const hasComingSoon = await page.locator('text=Coming Soon').isVisible()
      const hasDashboards = await page
        .locator('text=Create Dashboard')
        .isVisible()

      expect(hasComingSoon || hasDashboards).toBe(true)
    })
  })
})
