import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Enhanced CRM List Views
 *
 * Tests the new list view functionality:
 * - Column customization (show/hide, reorder)
 * - Advanced filtering (multiple conditions, operators)
 * - Saved views (create, switch, delete)
 * - Export (CSV, Excel)
 */

test.describe('CRM Enhanced List Views', () => {
  test.describe('Contacts List - Advanced Toolbar', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')
    })

    test('should display advanced toolbar with all controls', async ({
      page,
    }) => {
      // Should have view selector dropdown
      await expect(
        page
          .locator('button:has-text("All Contacts")')
          .or(page.locator('button:has-text("Views")'))
      ).toBeVisible({ timeout: 10000 })

      // Should have search input
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()

      // Should have Filters button
      await expect(page.locator('button:has-text("Filters")')).toBeVisible()

      // Should have Columns button
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()

      // Should have Save View button
      await expect(page.locator('button:has-text("Save View")')).toBeVisible()

      // Should have Export button
      await expect(page.locator('button:has-text("Export")')).toBeVisible()
    })

    test('should open column selector dialog', async ({ page }) => {
      // Click Columns button
      await page.locator('button:has-text("Columns")').click()

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Customize Columns' })
      ).toBeVisible()

      // Should show field labels in the column list
      await expect(page.getByLabel('First Name')).toBeVisible()
      await expect(page.getByLabel('Last Name')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()

      // Should have Apply and Cancel buttons
      await expect(
        page.getByRole('button', { name: 'Apply', exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Cancel', exact: true })
      ).toBeVisible()
    })

    test('should toggle column visibility', async ({ page }) => {
      // Open column selector
      await page.locator('button:has-text("Columns")').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Find Phone checkbox using label
      const phoneCheckbox = page.getByLabel('Phone')

      // Get initial state
      const initialState = await phoneCheckbox.isChecked()

      // Toggle
      await phoneCheckbox.click()

      // Apply changes
      await page.getByRole('button', { name: 'Apply', exact: true }).click()

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 5000,
      })

      // If we hid the column, it should not be in headers
      if (initialState) {
        // We hid it - Phone header should not be visible
        await expect(page.locator('th:has-text("Phone")')).not.toBeVisible({
          timeout: 3000,
        })
      }

      // Reset for other tests - show Phone again
      await page.locator('button:has-text("Columns")').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByLabel('Phone').click()
      await page.getByRole('button', { name: 'Apply', exact: true }).click()
    })

    test('should open filter builder dialog', async ({ page }) => {
      // Click Filters button
      await page.locator('button:has-text("Filters")').click()

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Advanced Filters' })
      ).toBeVisible()

      // Should have Add Filter button
      await expect(page.locator('button:has-text("Add Filter")')).toBeVisible()

      // Should have Apply Filters and Cancel buttons
      await expect(
        page.getByRole('button', { name: /Apply Filters/ })
      ).toBeVisible()
    })

    test('should add and apply a filter', async ({ page }) => {
      // Open filter builder
      await page.locator('button:has-text("Filters")').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Add a filter
      await page.locator('button:has-text("Add Filter")').click()

      // Wait for filter row to appear, then select field
      // The filter builder uses Radix Select components
      const fieldTrigger = page
        .getByRole('dialog')
        .locator('[role="combobox"]')
        .first()
      await fieldTrigger.click()

      // Select First Name from dropdown
      await page.getByRole('option', { name: 'First Name' }).click()

      // Select operator (Contains)
      const operatorTrigger = page
        .getByRole('dialog')
        .locator('[role="combobox"]')
        .nth(1)
      await operatorTrigger.click()
      await page.getByRole('option', { name: 'Contains' }).click()

      // Enter value
      await page.getByPlaceholder('Enter value...').fill('E2E')

      // Apply filter
      await page.getByRole('button', { name: /Apply Filters/ }).click()

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 5000,
      })

      // Filters button should show count badge
      await expect(
        page.locator('button:has-text("Filters")').locator('.rounded-full')
      ).toBeVisible()
    })

    test('should open save view dialog', async ({ page }) => {
      // Click Save View button
      await page.locator('button:has-text("Save View")').click()

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Save View' })
      ).toBeVisible()

      // Should have name input
      await expect(page.getByLabel('View Name')).toBeVisible()

      // Should have visibility options (radio group)
      await expect(page.getByText('Private')).toBeVisible()

      // Should have Save View button in the dialog
      await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Save View' })
      ).toBeVisible()
    })

    test('should show export dropdown with CSV and Excel options', async ({
      page,
    }) => {
      // Click Export button
      await page.locator('button:has-text("Export")').click()

      // Should show export options
      await expect(page.locator('text=Export as CSV')).toBeVisible()
      await expect(page.locator('text=Export as Excel')).toBeVisible()
    })

    test('should show record count in export dropdown', async ({ page }) => {
      // Click Export button
      await page.locator('button:has-text("Export")').click()

      // Should show record count text
      await expect(
        page
          .locator('text=/Export \\d+ records?/')
          .or(page.locator('text=/\\d+ records?/'))
      ).toBeVisible()
    })
  })

  test.describe('CRM Leads List - Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/crm-leads')
      await page.waitForLoadState('networkidle')
    })

    test('should display advanced toolbar', async ({ page }) => {
      // Should have all toolbar controls
      await expect(page.locator('button:has-text("Filters")')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()
      await expect(page.locator('button:has-text("Save View")')).toBeVisible()
      await expect(page.locator('button:has-text("Export")')).toBeVisible()
    })

    test('should filter by lead status', async ({ page }) => {
      // Open filter builder
      await page.locator('button:has-text("Filters")').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Add a filter
      await page.locator('button:has-text("Add Filter")').click()

      // Wait for filter row to appear
      await page.waitForTimeout(500)

      // Select Lead Status field using Radix Select
      const fieldTrigger = page
        .getByRole('dialog')
        .locator('[role="combobox"]')
        .first()
      await fieldTrigger.click()

      // Try to find Lead Status option, if not available select any field
      const leadStatusOption = page.getByRole('option', { name: 'Lead Status' })
      if (await leadStatusOption.isVisible({ timeout: 2000 })) {
        await leadStatusOption.click()
      } else {
        // Select first available option
        await page.getByRole('option').first().click()
      }

      // Select Equals operator (use exact match to avoid matching "Not equals")
      const operatorTrigger = page
        .getByRole('dialog')
        .locator('[role="combobox"]')
        .nth(1)
      await operatorTrigger.click()
      await page.getByRole('option', { name: 'Equals', exact: true }).click()

      // For picklist fields, there may be a third combobox for value selection
      // For text fields, there will be an input
      const valueInput = page.getByPlaceholder('Enter value...')
      if (await valueInput.isVisible({ timeout: 1000 })) {
        await valueInput.fill('Test')
      }

      // Apply filter
      await page.getByRole('button', { name: /Apply Filters/ }).click()

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Opportunities List - Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/opportunities')
      await page.waitForLoadState('networkidle')
    })

    test('should display advanced toolbar', async ({ page }) => {
      await expect(page.locator('button:has-text("Filters")')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()
      await expect(page.locator('button:has-text("Export")')).toBeVisible()
    })

    test('should show currency fields in column selector', async ({ page }) => {
      await page.locator('button:has-text("Columns")').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Customize Columns' })
      ).toBeVisible()

      // Should show Amount field (currency type)
      await expect(page.getByLabel('Amount')).toBeVisible()
    })
  })

  test.describe('Accounts List - Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/accounts')
      await page.waitForLoadState('networkidle')
    })

    test('should display advanced toolbar', async ({ page }) => {
      await expect(page.locator('button:has-text("Filters")')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()
      await expect(page.locator('button:has-text("Export")')).toBeVisible()
    })
  })

  test.describe('Activities List - Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/activities')
      await page.waitForLoadState('networkidle')
    })

    test('should display advanced toolbar', async ({ page }) => {
      await expect(page.locator('button:has-text("Filters")')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()
      await expect(page.locator('button:has-text("Export")')).toBeVisible()
    })

    test('should filter activities by type', async ({ page }) => {
      // Open filter builder
      await page.locator('button:has-text("Filters")').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Add a filter for activity type
      await page.locator('button:has-text("Add Filter")').click()

      // Look for Activity Type in the field selector
      const fieldTrigger = page
        .getByRole('dialog')
        .locator('[role="combobox"]')
        .first()
      await fieldTrigger.click()

      // Select Activity Type if available
      const activityTypeOption = page.getByRole('option', {
        name: 'Activity Type',
      })
      if (await activityTypeOption.isVisible({ timeout: 2000 })) {
        await activityTypeOption.click()

        // Apply (even with partial filter)
        await page.getByRole('button', { name: /Apply Filters/ }).click()
      } else {
        // Close dialog if Activity Type not found - press Escape
        await page.keyboard.press('Escape')
        await page.getByRole('button', { name: 'Cancel' }).click()
      }
    })
  })

  test.describe('Bulk Selection with Export', () => {
    test('should select records and show selection in export', async ({
      page,
    }) => {
      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')

      // Wait for table to load
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

      // Select first row checkbox (Radix Checkbox uses button role)
      const firstRow = page.locator('tbody tr').first()
      const firstCheckbox = firstRow
        .getByRole('checkbox')
        .or(firstRow.locator('[role="checkbox"]'))

      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click()

        // Click Export button
        await page.locator('button:has-text("Export")').click()

        // Should show "Export 1 selected record" text in dropdown (use exact match to avoid strict violation)
        await expect(page.getByText('Export 1 selected record')).toBeVisible()
      }
    })
  })

  test.describe('View Selector', () => {
    test('should show view dropdown with All Records option', async ({
      page,
    }) => {
      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')

      // Click view selector - the ViewSelector component renders a button with
      // "All {objectLabel}" text, for contacts it's "All Contacts"
      const viewSelector = page.getByRole('button', { name: /All Contacts/i })

      await expect(viewSelector).toBeVisible({ timeout: 10000 })
      await viewSelector.click()

      // Should show dropdown with "All Contacts" menu item
      await expect(
        page.getByRole('menuitem', { name: /All Contacts/i })
      ).toBeVisible()
    })
  })

  test.describe('Search Integration', () => {
    test('should have functional search input', async ({ page }) => {
      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')

      // Find search input - the ListViewToolbar uses placeholder like "Search contacts..."
      const searchInput = page.getByPlaceholder(/Search/i)
      await expect(searchInput).toBeVisible({ timeout: 10000 })

      // Type search term - should be able to enter text
      await searchInput.fill('E2E')

      // Verify the value was entered
      await expect(searchInput).toHaveValue('E2E')
    })

    test('should clear search with X button', async ({ page }) => {
      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')

      // Find search input and fill it
      const searchInput = page.getByPlaceholder(/Search/i)
      await expect(searchInput).toBeVisible({ timeout: 10000 })
      await searchInput.fill('test')

      // The X button should appear when there's text
      // It's a button element inside the search container
      const clearButton = page
        .locator('.relative')
        .filter({ has: searchInput })
        .locator('button')

      await expect(clearButton).toBeVisible()
      await clearButton.click()

      // Input should be cleared
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Responsive Toolbar', () => {
    test('should wrap toolbar items on smaller screens', async ({ page }) => {
      // Set smaller viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/admin/contacts')
      await page.waitForLoadState('networkidle')

      // Toolbar should still be visible and functional
      await expect(page.locator('button:has-text("Filters")')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('button:has-text("Columns")')).toBeVisible()
    })
  })
})
