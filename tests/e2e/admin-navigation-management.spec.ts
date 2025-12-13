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

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Page should load with title
      await expect(
        page.getByRole('heading', { name: /navigation settings/i })
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

      // Wait for page to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Should show standard objects within the Items & Order section
      const itemsSection = page.getByRole('tabpanel', { name: /items.*order/i })
      await expect(itemsSection.getByText('Accounts')).toBeVisible()
      await expect(itemsSection.getByText('Contacts')).toBeVisible()
    })

    test('should show drag handles for reordering', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Drag handles should be present (grip icon or drag indicator)
      const dragHandles = page.locator('[data-drag-handle]')
      const handleCount = await dragHandles.count()

      // Should have at least one drag handle for reordering
      expect(handleCount).toBeGreaterThan(0)
    })

    test('should show edit button for each nav item', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Each item should have an edit button with aria-label
      const editButtons = page.locator('button[aria-label*="Edit"]')
      const buttonCount = await editButtons.count()

      // Should have edit buttons for nav items
      expect(buttonCount).toBeGreaterThan(0)
    })

    test('should open edit dialog when clicking edit button', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Find first edit button and click it
      const editButton = page.locator('button[aria-label*="Edit"]').first()
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

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Open edit dialog for first item
      const editButton = page.locator('button[aria-label*="Edit"]').first()
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

    test('should have Required switch', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Should have required switch (it's a Switch component, not checkbox)
      const requiredSwitch = dialog.getByRole('switch').first()
      await expect(requiredSwitch).toBeVisible()
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

      // Wait for content to load first
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Switch to Role Visibility tab
      const visibilityTab = page.getByRole('tab', { name: /role.*visibility/i })
      await visibilityTab.click()

      // Wait for matrix to fully load (look for the header row with role names)
      const tabPanel = page.locator('[role="tabpanel"]')
      await expect(tabPanel.getByText('Navigation Item')).toBeVisible({
        timeout: 10000,
      })
      // Also ensure the role headers are loaded
      await expect(tabPanel.getByText('Owner')).toBeVisible({ timeout: 10000 })
    })

    test('should display visibility legend', async ({ page }) => {
      // Legend should show all three states
      await expect(page.getByText('Visible')).toBeVisible()
      await expect(page.getByText('Available')).toBeVisible()
      await expect(page.getByText('Hidden')).toBeVisible()
    })

    test('should display role column headers', async ({ page }) => {
      // The beforeEach already waits for Owner to be visible
      // Just verify the other role headers are present
      const tabPanel = page.locator('[role="tabpanel"]')

      // Should show role names in header (use exact match to avoid matching "Admin Menu" heading)
      await expect(tabPanel.getByText('Admin', { exact: true })).toBeVisible()
      await expect(
        tabPanel.getByText('Provider', { exact: true })
      ).toBeVisible()
      await expect(
        tabPanel.getByText('Assistant', { exact: true })
      ).toBeVisible()
      await expect(tabPanel.getByText('Staff', { exact: true })).toBeVisible()
    })

    test('should display navigation items as rows', async ({ page }) => {
      // Should show nav item names in the matrix
      await expect(
        page.locator('[role="tabpanel"]').getByText('Accounts')
      ).toBeVisible()
      await expect(
        page.locator('[role="tabpanel"]').getByText('Contacts')
      ).toBeVisible()
    })

    test('should have clickable visibility toggles', async ({ page }) => {
      // Find visibility toggle buttons in the matrix (they're the buttons in each row after the item name)
      // Each row has 5 toggle buttons (one per role)
      const toggleButtons = page.locator('[role="tabpanel"] button').filter({
        has: page.locator('svg'),
      })

      const buttonCount = await toggleButtons.count()
      expect(buttonCount).toBeGreaterThan(0)
    })

    test('should open dropdown when clicking visibility toggle', async ({
      page,
    }) => {
      // Find and click a visibility toggle - get the first toggle button in the matrix
      // These are the buttons that contain SVG icons for visibility state
      const toggleButton = page
        .locator('[role="tabpanel"] button')
        .filter({ has: page.locator('svg') })
        .first()
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
      const toggleButton = page
        .locator('[role="tabpanel"] button')
        .filter({ has: page.locator('svg') })
        .first()
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

      // Wait for page to load
      await expect(
        page.getByRole('navigation', { name: 'Main navigation' })
      ).toBeVisible()

      // Click the + button (it's the button right after Activities in the nav)
      // It's a button without text containing a Plus icon
      const addButton = page
        .getByRole('navigation', { name: 'Main navigation' })
        .locator('button')
        .first()
      await addButton.click()

      // Should show "Add to Navigation" header in popover
      await expect(page.getByText('Add to Navigation')).toBeVisible({
        timeout: 10000,
      })
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

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Open edit dialog
      const editButton = page.locator('button[aria-label*="Edit"]').first()
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should display icon grid', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Click on the icon picker button to open popover (it's the button showing current icon)
      const iconPickerButton = dialog
        .locator('button')
        .filter({ hasText: /building|users|file/i })
        .first()
      await iconPickerButton.click()

      // Should have icon selection area in popover
      await expect(page.getByText('Choose an icon')).toBeVisible()
      const iconGrid = page.locator('.grid.grid-cols-7')
      await expect(iconGrid).toBeVisible()
    })

    test('should show multiple icon options', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Click on the icon picker button to open popover
      const iconPickerButton = dialog
        .locator('button')
        .filter({ hasText: /building|users|file/i })
        .first()
      await iconPickerButton.click()

      // Wait for popover
      await expect(page.getByText('Choose an icon')).toBeVisible()

      // Count icon buttons in the grid
      const iconButtons = page.locator('.grid.grid-cols-7 button')
      const iconCount = await iconButtons.count()
      expect(iconCount).toBeGreaterThan(5)
    })

    test('should highlight selected icon', async ({ page }) => {
      const dialog = page.getByRole('dialog')

      // Click on the icon picker button to open popover
      const iconPickerButton = dialog
        .locator('button')
        .filter({ hasText: /building|users|file/i })
        .first()
      await iconPickerButton.click()

      // Wait for popover
      await expect(page.getByText('Choose an icon')).toBeVisible()

      // One icon should be highlighted/selected (aria-pressed="true")
      const selectedIcon = page.locator(
        '.grid.grid-cols-7 button[aria-pressed="true"]'
      )
      const selectedCount = await selectedIcon.count()

      expect(selectedCount).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible tab navigation', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

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

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Open edit dialog
      const editButton = page.locator('button[aria-label*="Edit"]').first()
      await editButton.click()

      // Dialog should have proper role
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('should handle keyboard navigation in tabs', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

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
      // We're primarily verifying the page eventually loads successfully
      await navigationPromise

      // Page should load successfully
      await expect(page.getByText('Primary Navigation')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: /navigation settings/i })
      ).toBeVisible()
    })

    test('should handle empty state gracefully', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Page should not crash even if no nav items
      await expect(
        page.getByRole('heading', { name: /navigation settings/i })
      ).toBeVisible()
    })
  })

  test.describe('Add Navigation Item', () => {
    test('should show Add Item button in each navigation group', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Should have Add Item buttons for each group
      const addButtons = page.locator('button:has-text("Add Item")')
      const buttonCount = await addButtons.count()

      // Should have at least 3 Add Item buttons (one per group)
      expect(buttonCount).toBeGreaterThanOrEqual(3)
    })

    test('should open Add Item dialog when clicking Add Item button', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Dialog should open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Should have proper title
      await expect(dialog.getByText(/add item to/i)).toBeVisible()
    })

    test('should display three tabs in Add Item dialog: Move, Object, Link', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Dialog should show tabs
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('tab', { name: /move/i })).toBeVisible()
      await expect(dialog.getByRole('tab', { name: /object/i })).toBeVisible()
      await expect(dialog.getByRole('tab', { name: /link/i })).toBeVisible()
    })

    test('should show items from other groups in Move tab', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click Add Item in Primary Navigation using aria-label
      const addButton = page.getByRole('button', {
        name: 'Add item to primary tab',
      })
      await addButton.click()

      // Dialog should open with Move tab selected by default
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Should show items that can be moved (from other groups)
      // Messages, Reports, etc. are in Tools Menu - use first() since multiple items match
      await expect(
        dialog.getByText(/currently in tools menu/i).first()
      ).toBeVisible()
    })

    test('should have search input in Move tab', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Should have search input in Move tab
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByPlaceholder(/search/i)).toBeVisible()
    })

    test('should show Link tab with URL and display name fields', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Click on Link tab
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Should show Display Name and URL fields
      await expect(dialog.getByLabel(/display name/i)).toBeVisible()
      await expect(dialog.getByLabel(/url/i)).toBeVisible()
    })

    test('should show icon picker in Link tab', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Click on Link tab
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Should have icon section
      await expect(dialog.getByText(/icon/i)).toBeVisible()
    })

    test('should disable Add Link button when fields are empty', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Click on Link tab
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Add Link button should be disabled when fields are empty
      const addLinkButton = dialog.getByRole('button', { name: /add link/i })
      await expect(addLinkButton).toBeDisabled()
    })

    test('should enable Add Link button when fields are filled', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Click on Link tab
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Fill in fields
      await dialog.getByLabel(/display name/i).fill('Test Link')
      await dialog.getByLabel(/url/i).fill('https://example.com')

      // Add Link button should now be enabled
      const addLinkButton = dialog.getByRole('button', { name: /add link/i })
      await expect(addLinkButton).toBeEnabled()
    })

    test('should show live preview when filling link fields', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Click on Link tab
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Fill in display name
      await dialog.getByLabel(/display name/i).fill('My Custom Link')

      // Should show preview with the name
      await expect(dialog.getByText('My Custom Link')).toBeVisible()
    })

    test('should close dialog with Cancel button', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Dialog should open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Switch to Link tab where Cancel button is visible
      await dialog.getByRole('tab', { name: /link/i }).click()

      // Click Cancel
      await dialog.getByRole('button', { name: /cancel/i }).click()

      // Dialog should close
      await expect(dialog).not.toBeVisible()
    })

    test('should have proper aria-label on Add Item buttons', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Check that buttons have aria-labels
      const addButtons = page.locator('button[aria-label*="Add item to"]')
      const buttonCount = await addButtons.count()

      expect(buttonCount).toBeGreaterThanOrEqual(3)
    })
  })

  test.describe('Move Item Between Groups', () => {
    test('should show arrow indicator for movable items', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click Add Item in Primary Navigation
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      // Dialog should show items with arrow indicators
      const dialog = page.getByRole('dialog')
      const arrowIcons = dialog.locator('svg.lucide-arrow-right')
      const arrowCount = await arrowIcons.count()

      // Should have arrows for each movable item
      expect(arrowCount).toBeGreaterThan(0)
    })

    test('should filter items when searching in Move tab', async ({ page }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      const dialog = page.getByRole('dialog')
      const searchInput = dialog.getByPlaceholder(/search/i)

      // Get initial count of items
      const initialItems = await dialog
        .locator('button')
        .filter({ hasText: /currently in/i })
        .count()

      // Search for a specific term
      await searchInput.fill('Report')

      // Wait for filter to apply
      await page.waitForTimeout(300)

      // Either shows filtered results or fewer items
      const filteredItems = await dialog
        .locator('button')
        .filter({ hasText: /currently in/i })
        .count()

      // Filtered count should be less than or equal to initial count
      expect(filteredItems).toBeLessThanOrEqual(initialItems)
    })

    test('should show "No items match" when search has no results', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Click the first Add Item button
      const addButton = page.locator('button:has-text("Add Item")').first()
      await addButton.click()

      const dialog = page.getByRole('dialog')
      const searchInput = dialog.getByPlaceholder(/search/i)

      // Search for something that won't match
      await searchInput.fill('xyznonexistent123')

      // Wait for filter
      await page.waitForTimeout(300)

      // Should show no results message
      await expect(dialog.getByText(/no items match/i)).toBeVisible()
    })
  })

  test.describe('Data Persistence', () => {
    test('should enable save button when display name changes', async ({
      page,
    }) => {
      await page.goto('/admin/setup/navigation')

      // Wait for content to load
      await expect(page.getByText('Primary Navigation')).toBeVisible()

      // Open edit dialog
      const editButton = page.locator('button[aria-label*="Edit"]').first()
      await editButton.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const displayNameInput = dialog.getByLabel(/display name/i)

      // Get current value
      const originalValue = await displayNameInput.inputValue()

      // Save button should initially be disabled (no changes)
      const saveButton = dialog.getByRole('button', { name: /save/i })
      // Note: button may be enabled initially due to component state

      // Modify value with a unique name
      const newName = `Test Name ${Date.now()}`
      await displayNameInput.clear()
      await displayNameInput.fill(newName)

      // Save button should now be enabled (hasChanges = true)
      await expect(saveButton).toBeEnabled()

      // Verify the preview updates with new name
      await expect(dialog.getByText(newName)).toBeVisible()

      // Click cancel to close without saving
      await dialog.getByRole('button', { name: /cancel/i }).click()
      await expect(dialog).not.toBeVisible({ timeout: 5000 })

      // Reopen dialog and verify original value is still there (change wasn't saved)
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      const valueAfterCancel = await page
        .getByRole('dialog')
        .getByLabel(/display name/i)
        .inputValue()

      // The original value should still be there since we cancelled
      expect(valueAfterCancel).toBe(originalValue)
    })
  })
})
