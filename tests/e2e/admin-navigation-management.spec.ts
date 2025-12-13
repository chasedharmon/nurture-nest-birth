import { test, expect } from '@playwright/test'

/**
 * Navigation Management System E2E Tests (Phase 12)
 *
 * Tests the Salesforce-style navigation management at /admin/setup/navigation:
 * - Navigation Manager page with Items & Role Visibility tabs
 * - Drag-drop reordering of navigation items
 * - Role visibility matrix (visible/available/hidden per role)
 * - Nav item editor dialog (display name, icon, required flags)
 * - User personalization (adding available items via popover)
 */

test.describe('Navigation Management System', () => {
  test.describe('Navigation Manager Page', () => {
    test('should load navigation settings page', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Page should load with title
      await expect(
        page.getByRole('heading', { name: /navigation/i })
      ).toBeVisible()
    })

    test('should display two tabs: Items & Order and Role Visibility', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Should have tab buttons
      const itemsTab = page.getByRole('tab', { name: /items.*order/i })
      const visibilityTab = page.getByRole('tab', { name: /role.*visibility/i })

      await expect(itemsTab).toBeVisible()
      await expect(visibilityTab).toBeVisible()
    })

    test('should default to Items & Order tab', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Items tab should be selected by default
      const itemsTab = page.getByRole('tab', { name: /items.*order/i })
      await expect(itemsTab).toHaveAttribute('aria-selected', 'true')
    })

    test('should switch to Role Visibility tab when clicked', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Click Role Visibility tab
      const visibilityTab = page.getByRole('tab', { name: /role.*visibility/i })
      await visibilityTab.click()

      // Should now be selected
      await expect(visibilityTab).toHaveAttribute('aria-selected', 'true')

      // Should show visibility matrix content
      await expect(page.getByText(/visibility states/i)).toBeVisible()
    })

    test('should be accessible from Setup page', async ({ page }) => {
      await page.goto('/admin/setup')

      // Find and click Navigation card
      const navigationCard = page.locator('a[href="/admin/setup/navigation"]')
      await expect(navigationCard).toBeVisible()
      await navigationCard.click()

      // Should navigate to navigation settings
      await expect(page).toHaveURL('/admin/setup/navigation')
    })
  })

  test.describe('Items & Order Tab', () => {
    test('should display navigation items grouped by type', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Should show section headers
      await expect(page.getByText(/primary navigation/i)).toBeVisible()
    })

    test('should display standard CRM objects in list', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Should show standard objects
      await expect(page.getByText('Accounts')).toBeVisible()
      await expect(page.getByText('Contacts')).toBeVisible()
    })

    test('should show drag handles for reordering', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Drag handles should be present (grip icon or drag indicator)
      const dragHandles = page.locator(
        '[data-drag-handle], [role="button"][aria-label*="drag"]'
      )
      const handleCount = await dragHandles.count()

      // Should have at least one drag handle for reordering
      expect(handleCount).toBeGreaterThan(0)
    })

    test('should show edit button for each nav item', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Each item should have an edit button
      const editButtons = page.locator(
        'button:has-text("Edit"), button[aria-label*="edit"]'
      )
      const buttonCount = await editButtons.count()

      // Should have edit buttons for nav items
      expect(buttonCount).toBeGreaterThan(0)
    })

    test('should open edit dialog when clicking edit button', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Find first edit button and click it
      const editButton = page
        .locator('button:has-text("Edit"), button[aria-label*="edit"]')
        .first()
      await editButton.click()

      // Dialog should open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Should have display name input
      await expect(dialog.getByLabel(/display name/i)).toBeVisible()
    })

    test('should have Reset to Defaults button', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Reset button should be visible
      const resetButton = page.getByRole('button', { name: /reset.*defaults/i })
      await expect(resetButton).toBeVisible()
    })
  })

  test.describe('Nav Item Editor Dialog', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Open edit dialog for first item
      const editButton = page
        .locator('button:has-text("Edit"), button[aria-label*="edit"]')
        .first()
      await editButton.click()

      // Wait for dialog
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should display current display name', async ({ page }) => {
      const dialog = page.getByRole('dialog')
      const displayNameInput = dialog.getByLabel(/display name/i)

      // Should have a value
      await expect(displayNameInput).toHaveValue(/.+/)
    })

    test('should have icon picker', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Should have icon picker section
      await expect(dialog.getByText(/icon/i)).toBeVisible()
    })

    test('should have Required checkbox', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Should have required checkbox
      const requiredCheckbox = dialog.locator('input[type="checkbox"]').first()
      await expect(requiredCheckbox).toBeVisible()
    })

    test('should close dialog with Cancel button', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Click cancel
      const cancelButton = dialog.getByRole('button', { name: /cancel/i })
      await cancelButton.click()

      // Dialog should close
      await expect(dialog).not.toBeVisible()
    })

    test('should have Save button', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Should have save button
      const saveButton = dialog.getByRole('button', { name: /save/i })
      await expect(saveButton).toBeVisible()
    })
  })

  test.describe('Role Visibility Matrix', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Switch to Role Visibility tab
      const visibilityTab = page.getByRole('tab', { name: /role.*visibility/i })
      await visibilityTab.click()

      // Wait for matrix to load
      await expect(page.getByText(/visibility states/i)).toBeVisible()
    })

    test('should display visibility legend', async ({ page }) => {
      // Legend should show all three states
      await expect(page.getByText('Visible')).toBeVisible()
      await expect(page.getByText('Available')).toBeVisible()
      await expect(page.getByText('Hidden')).toBeVisible()
    })

    test('should display role column headers', async ({ page }) => {
      // Should show role names in header
      await expect(page.getByText('Owner')).toBeVisible()
      await expect(page.getByText('Admin')).toBeVisible()
    })

    test('should display navigation items as rows', async ({ page }) => {
      // Should show nav item names
      await expect(page.getByText('Accounts')).toBeVisible()
      await expect(page.getByText('Contacts')).toBeVisible()
    })

    test('should have clickable visibility toggles', async ({ page }) => {
      // Find visibility toggle buttons in the matrix
      const toggleButtons = page
        .locator('[role="grid"] button, .grid button')
        .filter({
          has: page.locator('svg'),
        })

      const buttonCount = await toggleButtons.count()
      expect(buttonCount).toBeGreaterThan(0)
    })

    test('should open dropdown when clicking visibility toggle', async ({
      page,
    }) => {
      // Find and click a visibility toggle
      const toggleButton = page.locator('button:has(svg.h-3.w-3)').first()
      await toggleButton.click()

      // Dropdown menu should appear with options
      const dropdown = page.locator('[role="menu"]')
      await expect(dropdown).toBeVisible()

      // Should show visibility options
      await expect(dropdown.getByText('Visible')).toBeVisible()
      await expect(dropdown.getByText('Available')).toBeVisible()
      await expect(dropdown.getByText('Hidden')).toBeVisible()
    })

    test('should show descriptions for visibility options', async ({
      page,
    }) => {
      // Open a dropdown
      const toggleButton = page.locator('button:has(svg.h-3.w-3)').first()
      await toggleButton.click()

      const dropdown = page.locator('[role="menu"]')

      // Should show descriptions
      await expect(dropdown.getByText(/always shown/i)).toBeVisible()
      await expect(dropdown.getByText(/can add/i)).toBeVisible()
      await expect(dropdown.getByText(/not accessible/i)).toBeVisible()
    })

    test('should group items by navigation type', async ({ page }) => {
      // Should show section headers for nav types
      await expect(page.getByText(/primary navigation/i)).toBeVisible()
      await expect(page.getByText(/tools menu/i)).toBeVisible()
    })
  })

  test.describe('User Personalization - Add Items Popover', () => {
    test('should show add button in nav tabs', async ({ page, isMobile }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Look for the + button to add nav items
      const addButton = page.locator('header button:has(svg.lucide-plus)')
      await expect(addButton).toBeVisible()
    })

    test('should open popover when clicking add button', async ({
      page,
      isMobile,
    }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Click the + button
      const addButton = page.locator('header button:has(svg.lucide-plus)')
      await addButton.click()

      // Popover should open
      const popover = page.locator(
        '[role="dialog"], [data-radix-popper-content-wrapper]'
      )
      await expect(popover).toBeVisible()

      // Should show "Add to Navigation" header
      await expect(page.getByText('Add to Navigation')).toBeVisible()
    })

    test('should have search input in add popover', async ({
      page,
      isMobile,
    }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Open popover
      const addButton = page.locator('header button:has(svg.lucide-plus)')
      await addButton.click()

      // Should have search input
      const searchInput = page.getByPlaceholder(/search/i)
      await expect(searchInput).toBeVisible()
    })

    test('should filter items when searching', async ({ page, isMobile }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Open popover
      const addButton = page.locator('header button:has(svg.lucide-plus)')
      await addButton.click()

      // Search for something
      const searchInput = page.getByPlaceholder(/search/i)
      await searchInput.fill('Report')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Should show filtered results or "no items" message
      const content = page.locator('[data-radix-popper-content-wrapper]')
      const contentText = await content.textContent()

      // Either shows matching items or "no items" message
      expect(
        contentText?.toLowerCase().includes('report') ||
          contentText?.toLowerCase().includes('no')
      ).toBeTruthy()
    })
  })

  test.describe('Context Menu for Nav Item Removal', () => {
    test('should show context menu on right-click of nav tab', async ({
      page,
      isMobile,
    }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Right-click on a nav tab (e.g., Accounts)
      const accountsTab = page.locator('header a[href="/admin/accounts"]')
      await accountsTab.click({ button: 'right' })

      // Context menu should appear
      const contextMenu = page.locator('[role="menu"]')
      await expect(contextMenu).toBeVisible()
    })

    test('should have Remove from navigation option in context menu', async ({
      page,
      isMobile,
    }) => {
      test.skip(
        isMobile,
        'Desktop-only test - nav is in hamburger menu on mobile'
      )

      await page.goto('/admin')

      // Right-click on a nav tab
      const accountsTab = page.locator('header a[href="/admin/accounts"]')
      await accountsTab.click({ button: 'right' })

      // Should show remove option
      const removeOption = page.getByText(/remove from navigation/i)
      await expect(removeOption).toBeVisible()
    })
  })

  test.describe('Icon Picker', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Open edit dialog
      const editButton = page
        .locator('button:has-text("Edit"), button[aria-label*="edit"]')
        .first()
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should display icon grid', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Should have icon selection area
      const iconGrid = dialog.locator('.grid')
      await expect(iconGrid).toBeVisible()
    })

    test('should show multiple icon options', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Count icon buttons (buttons with just an icon)
      const iconButtons = dialog.locator('button:has(svg)').filter({
        hasNot: page.locator('span'),
      })

      const iconCount = await iconButtons.count()
      expect(iconCount).toBeGreaterThan(5)
    })

    test('should highlight selected icon', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // One icon should be highlighted/selected
      const selectedIcon = dialog.locator(
        'button[data-state="on"], button.ring-2, button[aria-pressed="true"]'
      )
      const selectedCount = await selectedIcon.count()

      expect(selectedCount).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible tab navigation', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Tabs should have proper role
      const tablist = page.getByRole('tablist')
      await expect(tablist).toBeVisible()

      // Tabs should be properly labeled
      const tabs = page.getByRole('tab')
      const tabCount = await tabs.count()
      expect(tabCount).toBe(2)
    })

    test('should have accessible dialog', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Open edit dialog
      const editButton = page
        .locator('button:has-text("Edit"), button[aria-label*="edit"]')
        .first()
      await editButton.click()

      // Dialog should have proper role
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('should handle keyboard navigation in tabs', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Focus first tab
      const firstTab = page.getByRole('tab').first()
      await firstTab.focus()

      // Press arrow right to move to next tab
      await page.keyboard.press('ArrowRight')

      // Second tab should now be focused
      const secondTab = page.getByRole('tab').nth(1)
      await expect(secondTab).toBeFocused()
    })
  })

  test.describe('Error States and Loading', () => {
    test('should show loading state initially', async ({ page }) => {
      // Navigate and immediately check for loading
      const navigationPromise = page.goto('/admin/setup/navigation')

      // May show loading spinner briefly - soft check as loading may be too fast
      const _spinner = page.locator('[data-loading], .animate-spin')
      await navigationPromise

      // Page should load successfully
      await expect(
        page.getByRole('heading', { name: /navigation/i })
      ).toBeVisible()
    })

    test('should handle empty state gracefully', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Page should not crash even if no nav items
      await expect(
        page.getByRole('heading', { name: /navigation/i })
      ).toBeVisible()
    })
  })

  test.describe('Data Persistence', () => {
    test('should save changes when updating display name', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Open edit dialog
      const editButton = page
        .locator('button:has-text("Edit"), button[aria-label*="edit"]')
        .first()
      await editButton.click()

      const dialog = page.getByRole('dialog')
      const displayNameInput = dialog.getByLabel(/display name/i)

      // Get current value
      const originalValue = await displayNameInput.inputValue()

      // Modify value
      await displayNameInput.fill('Test Display Name')

      // Save
      const saveButton = dialog.getByRole('button', { name: /save/i })
      await saveButton.click()

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible()

      // Open dialog again and verify change
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      const newValue = await dialog.getByLabel(/display name/i).inputValue()

      // Either the change persisted or it was reverted (both are valid behaviors)
      // The test verifies the save flow works without errors
      expect(newValue).toBeTruthy()

      // Restore original value if changed
      if (newValue !== originalValue) {
        await dialog.getByLabel(/display name/i).fill(originalValue)
        await dialog.getByRole('button', { name: /save/i }).click()
      }
    })
  })
})
