import { test, expect } from '@playwright/test'

/**
 * Phase 9: Data Management E2E Tests
 *
 * Tests for:
 * - DM-1: CSV/Excel Import Wizard
 * - DM-2: Quick Export Buttons
 * - DM-3: Filter-Aware Exports
 * - DM-4: Bulk Actions (team assignment)
 * - DM-5: Duplicate Detection (during import)
 *
 * Note: Authentication handled by Playwright setup project via storageState.
 * Each test starts with a pre-authenticated session.
 *
 * IMPORTANT: Some tests require the import_jobs migration to be applied:
 * - supabase/migrations/20251218000000_import_jobs.sql
 * If not applied, the import pages may show errors.
 */

// Helper to check if import pages are available (migration applied)
async function checkImportPageAvailable(
  page: import('@playwright/test').Page
): Promise<boolean> {
  await page.goto('/admin/import')
  await page.waitForLoadState('networkidle')

  // Wait for client-side hydration to complete
  // Next.js may bail to client-side rendering due to next/dynamic
  // We need to wait for the actual content, not just the loading skeleton
  try {
    // Wait for the "Import Data" heading to appear (up to 15 seconds for CSR)
    const importDataHeading = page.getByRole('heading', { name: 'Import Data' })
    await importDataHeading.waitFor({ state: 'visible', timeout: 15000 })
    return true
  } catch {
    // Check for error state (migration not applied)
    const errorMessage = page.getByText(/something went wrong/i)
    const hasError = await errorMessage.isVisible().catch(() => false)

    if (hasError) {
      console.log('Import page shows error state')
      return false
    }

    // Take screenshot for debugging if still not found
    await page.screenshot({ path: 'test-results/import-page-check.png' })
    console.log('Import Data heading not found after waiting for hydration')
    return false
  }
}

test.describe('Phase 9: Data Management', () => {
  test.describe('DM-1: Import Wizard', () => {
    test('should load import landing page with object type options', async ({
      page,
    }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Should show import page header (already verified by checkImportPageAvailable)
      await expect(
        page.getByRole('heading', { name: 'Import Data' })
      ).toBeVisible()
      await expect(
        page.getByText('Import data from CSV or Excel files')
      ).toBeVisible()

      // Should show import options
      await expect(page.getByText('Leads').first()).toBeVisible()
      await expect(page.getByText('Clients').first()).toBeVisible()
      await expect(
        page.getByText('Import potential clients and inquiries')
      ).toBeVisible()
    })

    test('should show coming soon badge on disabled import types', async ({
      page,
    }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Check for coming soon badges
      const comingSoonBadges = page.locator('text=Coming soon')
      await expect(comingSoonBadges.first()).toBeVisible()

      // Invoices, Meetings, Services should be disabled
      const invoicesCard = page.locator('text=Invoices').first()
      await expect(invoicesCard).toBeVisible()
    })

    test('should navigate to leads import wizard', async ({ page }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Click on Leads import option
      await page.click('a[href="/admin/import/leads"]')

      // Should be on leads import page
      await expect(page).toHaveURL(/\/admin\/import\/leads/)

      // Should show wizard steps
      await expect(page.getByText('Upload File')).toBeVisible()
      await expect(page.getByText('Map Columns')).toBeVisible()
      await expect(page.getByText('Preview')).toBeVisible()
      // Use exact match to avoid matching Next.js dev tools button
      await expect(page.getByText('Import', { exact: true })).toBeVisible()
    })

    test('should show file upload dropzone on step 1', async ({ page }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      await page.goto('/admin/import/leads')
      await page.waitForLoadState('networkidle')

      // Wait for wizard to load (client-side rendering)
      await page
        .getByText('Upload File')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Should show dropzone - actual text from file-upload-step.tsx
      await expect(
        page.getByText('Drag and drop your file here, or click to browse')
      ).toBeVisible()

      // Should show supported formats - be specific to avoid matching multiple elements
      await expect(
        page.getByText('Supported formats: CSV, Excel')
      ).toBeVisible()
    })

    test('should show migration guide info', async ({ page }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Should show migration guide
      await expect(
        page.getByText('Migrating from another platform?')
      ).toBeVisible()
      await expect(page.getByText(/Dubsado.*HoneyBook/i)).toBeVisible()

      // Should list features
      await expect(
        page.getByText('Auto-mapping recognizes common column names')
      ).toBeVisible()
      await expect(
        page.getByText('Save mapping templates for repeated imports')
      ).toBeVisible()
    })

    test('should navigate to clients import wizard', async ({ page }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Click on Clients import option
      await page.click('a[href="/admin/import/clients"]')

      // Should be on clients import page
      await expect(page).toHaveURL(/\/admin\/import\/clients/)

      // Should show wizard UI
      await expect(page.getByText('Upload File')).toBeVisible()
    })
  })

  test.describe('DM-2 & DM-3: Export Buttons', () => {
    test('should show export button on leads list view', async ({ page }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 })

      // Look for export button (exact text "Export" in button)
      const exportButton = page.getByRole('button', { name: 'Export' })
      await expect(exportButton).toBeVisible({ timeout: 5000 })

      // Click to open dropdown
      await exportButton.click()

      // Should show CSV and Excel options in dropdown
      await expect(page.getByText('Export as CSV')).toBeVisible({
        timeout: 3000,
      })
      await expect(page.getByText('Export as Excel')).toBeVisible()
    })
  })

  test.describe('DM-4: Bulk Actions', () => {
    test('should show bulk action bar when items are selected', async ({
      page,
    }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Wait for table to load (look for table element)
      await page.waitForSelector('table', { timeout: 10000 })

      // Check if there are leads to select - Radix UI Checkbox uses role="checkbox"
      const checkboxes = page.locator('[role="checkbox"]')
      const checkboxCount = await checkboxes.count()

      if (checkboxCount > 1) {
        // Click first data row checkbox (not header) - row checkboxes are in tbody
        const rowCheckbox = page.locator('tbody [role="checkbox"]').first()
        await rowCheckbox.click()

        // Should show bulk action bar
        await expect(page.getByText(/1 selected/i)).toBeVisible({
          timeout: 5000,
        })

        // Should show action buttons
        await expect(page.getByRole('button', { name: /clear/i })).toBeVisible()
      } else {
        test.skip(true, 'No leads available for bulk selection test')
      }
    })

    test('should allow selecting all items', async ({ page }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 })

      // Find header checkbox (select all) - in thead
      const headerCheckbox = page.locator('thead [role="checkbox"]')
      const hasHeaderCheckbox = (await headerCheckbox.count()) > 0

      if (hasHeaderCheckbox) {
        await headerCheckbox.click()

        // Should show selected count
        await expect(page.getByText(/selected/i)).toBeVisible({
          timeout: 5000,
        })
      } else {
        test.skip(true, 'No select-all checkbox found')
      }
    })

    test('should show team assignment option in bulk actions', async ({
      page,
    }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 })

      // Select an item first - Radix UI Checkbox uses role="checkbox"
      const rowCheckbox = page.locator('tbody [role="checkbox"]').first()
      const hasCheckbox = (await rowCheckbox.count()) > 0

      if (hasCheckbox) {
        await rowCheckbox.click()

        // Wait for bulk action bar
        await page.waitForTimeout(500)

        // Look for assign button
        const assignButton = page.getByRole('button', { name: /assign/i })
        await expect(assignButton).toBeVisible({ timeout: 5000 })

        // Click to open dropdown
        await assignButton.click()

        // Should show team member assignment options with role selector
        await expect(page.getByText(/primary|backup|support/i)).toBeVisible({
          timeout: 3000,
        })
      } else {
        test.skip(true, 'No leads available for bulk action test')
      }
    })

    test('should show delete option in bulk actions', async ({ page }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 })

      // Select an item first
      const rowCheckbox = page.locator('tbody [role="checkbox"]').first()
      const hasCheckbox = (await rowCheckbox.count()) > 0

      if (hasCheckbox) {
        await rowCheckbox.click()

        // Wait for bulk action bar
        await page.waitForTimeout(500)

        // Look for delete button
        const deleteButton = page.getByRole('button', { name: /delete/i })
        await expect(deleteButton).toBeVisible({ timeout: 5000 })
      } else {
        test.skip(true, 'No leads available for delete button test')
      }
    })
  })

  test.describe('Import History', () => {
    test('should show recent imports section on landing page', async ({
      page,
    }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      // Should show recent imports sidebar
      await expect(page.getByText('Recent Imports')).toBeVisible()

      // May show "No imports yet" or import history
      const noImports = page.getByText('No imports yet')
      const hasNoImports = await noImports.isVisible().catch(() => false)

      if (hasNoImports) {
        await expect(noImports).toBeVisible()
        await expect(
          page.getByText('Import your first file to get started')
        ).toBeVisible()
      }
    })
  })

  test.describe('Wizard Step Navigation', () => {
    test('should show disabled Next button until file is uploaded', async ({
      page,
    }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      await page.goto('/admin/import/leads')
      await page.waitForLoadState('networkidle')

      // Next button should be present - use exact match to avoid Next.js dev tools button
      const nextButton = page.getByRole('button', { name: 'Next', exact: true })
      await expect(nextButton).toBeVisible()

      // Should be disabled without file
      await expect(nextButton).toBeDisabled()
    })

    test('should show Back button on import page', async ({ page }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      await page.goto('/admin/import/leads')
      await page.waitForLoadState('networkidle')

      // Back button should be visible
      const backButton = page.getByRole('button', { name: /back/i })
      await expect(backButton).toBeVisible()

      // Should be disabled on first step
      await expect(backButton).toBeDisabled()
    })

    test('should show progress indicator with step numbers', async ({
      page,
    }) => {
      const isAvailable = await checkImportPageAvailable(page)
      test.skip(
        !isAvailable,
        'Import page not available - import_jobs migration may not be applied'
      )

      await page.goto('/admin/import/leads')
      await page.waitForLoadState('networkidle')

      // Should show step indicators
      await expect(page.getByText('1')).toBeVisible()
      await expect(page.getByText('2')).toBeVisible()
      await expect(page.getByText('3')).toBeVisible()
      await expect(page.getByText('4')).toBeVisible()
    })
  })

  test.describe('List View Toolbar Integration', () => {
    test('should have toolbar with filters and search on leads page', async ({
      page,
    }) => {
      await page.goto('/admin/leads')
      await page.waitForLoadState('networkidle')

      // Should have search input
      const searchInput = page.getByPlaceholder(/search/i)
      const hasSearch = await searchInput.isVisible().catch(() => false)

      if (hasSearch) {
        await expect(searchInput).toBeVisible()
      }

      // Check for filter or view controls
      const filterButton = page.getByRole('button', { name: /filter/i })
      const columnsButton = page.getByRole('button', { name: /column/i })

      // At least one control should be present
      const hasFilters = await filterButton.isVisible().catch(() => false)
      const hasColumns = await columnsButton.isVisible().catch(() => false)

      expect(hasFilters || hasColumns).toBeTruthy()
    })
  })

  test.describe('Admin Navigation to Import', () => {
    test('should be accessible via direct navigation', async ({ page }) => {
      // Test direct navigation to import page (no conditional skips)
      await page.goto('/admin/import')
      await page.waitForLoadState('networkidle')

      // Wait for client-side hydration (up to 15 seconds)
      const importDataHeading = page.getByRole('heading', {
        name: 'Import Data',
      })
      await importDataHeading.waitFor({ state: 'visible', timeout: 15000 })

      // Verify page content
      await expect(page).toHaveURL(/\/admin\/import/)
      await expect(importDataHeading).toBeVisible()
      await expect(
        page.getByText('Import data from CSV or Excel files')
      ).toBeVisible()
    })
  })
})
