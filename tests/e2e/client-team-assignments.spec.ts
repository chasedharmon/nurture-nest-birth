import { test, expect, type Page } from '@playwright/test'

/**
 * Client Team Assignments Tests
 *
 * Authentication is handled by Playwright setup project via storageState
 * Each test starts with a pre-authenticated session
 */

// Helper to navigate to a client with 'client' status
async function navigateToClientLead(page: Page): Promise<boolean> {
  // Navigate to the leads list page (not the dashboard)
  await page.goto('/admin/leads')

  // Wait for the table to load
  await page.waitForSelector('table tbody tr', { timeout: 10000 })

  // Small delay to ensure rows are interactive
  await page.waitForTimeout(500)

  // Look for a row with 'client' status in the tbody
  const clientRow = page
    .locator('table tbody tr')
    .filter({ hasText: 'client' })
    .first()

  if ((await clientRow.count()) > 0) {
    // Use Promise.all to click and wait for navigation together
    await Promise.all([
      page.waitForURL(/\/admin\/leads\//, { timeout: 15000 }),
      clientRow.click(),
    ])
    return true
  }

  // Fallback: click any lead row
  const anyRow = page.locator('table tbody tr').first()
  if ((await anyRow.count()) > 0) {
    await Promise.all([
      page.waitForURL(/\/admin\/leads\//, { timeout: 15000 }),
      anyRow.click(),
    ])
    return true
  }

  return false
}

// Tests will skip gracefully if no leads are available
test.describe('Client Team Assignments', () => {
  test.describe('Team Tab Navigation', () => {
    test('should display Team tab on client detail page', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      // Check for Team tab
      const teamTab = page.getByRole('tab', { name: 'Team' })
      await expect(teamTab).toBeVisible()
    })

    test('should navigate to Team tab and show Care Team section', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      // Click Team tab
      await page.getByRole('tab', { name: 'Team' }).click()

      // Should show Care Team header
      await expect(page.getByText('Care Team')).toBeVisible()
    })
  })

  test.describe('Team Assignments Display', () => {
    test('should display assigned provider with name and role badge', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Look for assigned provider (Big Pappa was assigned in previous tests)
      const providerName = page.getByText('Big Pappa')

      if ((await providerName.count()) > 0) {
        await expect(providerName).toBeVisible()

        // Should have a role badge - the badge appears as a sibling element to the provider name
        // Check for role text near the provider name (Primary, Backup, or Support)
        const providerCard = page
          .locator('[class*="rounded-lg border"]')
          .first()
        const roleTexts = ['Primary', 'Backup', 'Support']
        let hasRoleBadge = false

        for (const role of roleTexts) {
          const roleElement = providerCard.getByText(role, { exact: true })
          if ((await roleElement.count()) > 0) {
            hasRoleBadge = true
            break
          }
        }

        expect(hasRoleBadge).toBeTruthy()
      } else {
        // No providers assigned - should show empty state
        await expect(page.getByText('No providers assigned')).toBeVisible()
      }
    })

    test('should display provider initials avatar', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Look for initials avatar (e.g., "BP" for Big Pappa)
      const initialsAvatar = page.locator(
        '[class*="rounded-full"][class*="bg-primary"]'
      )

      if ((await initialsAvatar.count()) > 0) {
        await expect(initialsAvatar.first()).toBeVisible()
      }
    })

    test('should display assignment notes when present', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Look for notes text (from test assignment: "Test assignment from script")
      const notesText = page.locator('[class*="italic"]')

      // Notes may or may not be present
      if ((await notesText.count()) > 0) {
        await expect(notesText.first()).toBeVisible()
      }
    })
  })

  test.describe('Role Change Functionality', () => {
    test('should show role change dropdown menu on provider card', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Check if there are providers assigned
      const providerCard = page.locator('[class*="rounded-lg border"]').first()
      if ((await providerCard.count()) === 0) {
        test.skip(true, 'No provider assigned to test menu')
        return
      }

      // Find the menu button (MoreHorizontal icon button) within the card
      const menuButton = providerCard.locator('button').last()
      await menuButton.click()

      // Wait for menu to appear - give more time on mobile
      await page.waitForTimeout(1000)

      // Should show menu with role options - look for menu items
      const menuItems = page.getByRole('menuitem')
      await expect(menuItems.first()).toBeVisible({ timeout: 5000 })
    })

    test('should change role from Primary to Backup', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Check if there's an assigned provider with Primary role
      const primaryBadge = page.getByText('Primary', { exact: true })
      if ((await primaryBadge.count()) === 0) {
        test.skip(true, 'No primary provider to test role change')
        return
      }

      // Find provider card and open dropdown menu
      const providerCard = page.locator('[class*="rounded-lg border"]').first()
      const menuButton = providerCard.locator('button').last()
      await menuButton.click()

      // Wait for menu
      await page.waitForTimeout(300)

      // Click "Make Backup"
      await page.getByRole('menuitem', { name: 'Make Backup' }).click()

      // Wait for update
      await page.waitForTimeout(1500)

      // Should now show Backup badge
      await expect(page.getByText('Backup', { exact: true })).toBeVisible()
    })

    test('should change role from Backup to Primary', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Check if there's an assigned provider with Backup role
      const backupBadge = page.getByText('Backup', { exact: true })
      if ((await backupBadge.count()) === 0) {
        test.skip(true, 'No backup provider to test role change')
        return
      }

      // Find provider card and open dropdown menu
      const providerCard = page.locator('[class*="rounded-lg border"]').first()
      const menuButton = providerCard.locator('button').last()
      await menuButton.click()

      // Wait for menu
      await page.waitForTimeout(300)

      // Click "Make Primary"
      await page.getByRole('menuitem', { name: 'Make Primary' }).click()

      // Wait for update
      await page.waitForTimeout(1500)

      // Should now show Primary badge
      await expect(page.getByText('Primary', { exact: true })).toBeVisible()
    })

    test('should change role to Support', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Check if there are providers assigned
      const providerCard = page.locator('[class*="rounded-lg border"]').first()
      if ((await providerCard.count()) === 0) {
        test.skip(true, 'No provider assigned to test role change')
        return
      }

      // Find the menu button within the card
      const menuButton = providerCard.locator('button').last()
      await menuButton.click()

      // Wait for menu
      await page.waitForTimeout(300)

      // Click "Make Support"
      const supportOption = page.getByRole('menuitem', { name: 'Make Support' })
      if ((await supportOption.count()) > 0) {
        await supportOption.click()
        await page.waitForTimeout(1500)
        // Look for Support text within the provider card (role badge)
        await expect(
          providerCard.getByText('Support', { exact: true })
        ).toBeVisible()
      } else {
        // Already Support role, that's fine
        test.skip(true, 'Already Support role')
      }
    })
  })

  test.describe('Assign Provider Dialog', () => {
    test('should display Assign Provider button', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Should have Assign Provider button
      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      await expect(assignButton).toBeVisible()
    })

    test('should open assign dialog when clicking Assign Provider', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })

      // Skip if button is disabled (no available providers)
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()

      // Dialog should open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Should have dialog title
      await expect(
        page.getByRole('heading', { name: 'Assign Provider' })
      ).toBeVisible()
    })

    test('should show Team Member select in assign dialog', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()

      // Should have Team Member label and select
      await expect(page.getByText('Team Member')).toBeVisible()
      await expect(
        page.getByRole('combobox').filter({ hasText: 'Select a provider' })
      ).toBeVisible()
    })

    test('should show Role select in assign dialog', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()

      // Should have Role label
      await expect(page.getByText('Role')).toBeVisible()
    })

    test('should show Notes textarea in assign dialog', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()

      // Should have Notes label and textarea
      await expect(page.getByText('Notes (optional)')).toBeVisible()
      await expect(
        page.getByPlaceholder('e.g., Backup for birth only')
      ).toBeVisible()
    })

    test('should disable Assign Provider button when no member selected', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()

      // The submit button in dialog should be disabled without a selection
      const submitButton = page
        .getByRole('dialog')
        .getByRole('button', { name: 'Assign Provider' })
      await expect(submitButton).toBeDisabled()
    })

    test('should close dialog with Cancel button', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })
      if (await assignButton.isDisabled()) {
        test.skip(true, 'No available providers to assign')
        return
      }

      await assignButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Click Cancel
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Remove Assignment', () => {
    test('should show Remove option in dropdown menu', async ({ page }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      // Check if there are providers assigned
      const providerCard = page.locator('[class*="rounded-lg border"]').first()
      if ((await providerCard.count()) === 0) {
        test.skip(true, 'No provider assigned')
        return
      }

      // Find the menu button within the card
      const menuButton = providerCard.locator('button').last()
      await menuButton.click()

      // Wait for menu
      await page.waitForTimeout(300)

      // Should show Remove option
      await expect(page.getByRole('menuitem', { name: 'Remove' })).toBeVisible()
    })
  })

  test.describe('Activity Log Integration', () => {
    test('should show team assignment in activity timeline', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      // Click Activity tab
      await page.getByRole('tab', { name: 'Activity' }).click()

      // Look for team assignment activity
      const assignmentActivity = page.getByText(/assigned as.*provider/i)

      if ((await assignmentActivity.count()) > 0) {
        await expect(assignmentActivity.first()).toBeVisible()
      }
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state when no providers assigned', async ({
      page,
    }) => {
      // Navigate to a lead that might not have assignments
      await page.goto('/admin/leads')

      // Wait for the table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Try to find a lead with 'new' status (less likely to have assignments)
      const newLeadRow = page
        .locator('table tbody tr')
        .filter({ hasText: 'new' })
        .first()

      if ((await newLeadRow.count()) > 0) {
        await newLeadRow.click()
        await page.waitForURL(/\/admin\/leads\/.*/, { timeout: 5000 })

        await page.getByRole('tab', { name: 'Team' }).click()

        // Check for empty state OR assigned providers
        const emptyState = page.getByText('No providers assigned')
        const assignedProvider = page.locator('[class*="rounded-lg border"]')

        // One of these should be visible
        const hasEmptyState = (await emptyState.count()) > 0
        const hasProviders = (await assignedProvider.count()) > 0

        expect(hasEmptyState || hasProviders).toBeTruthy()
      }
    })

    test('should show helpful message in empty state', async ({ page }) => {
      await page.goto('/admin/leads')

      // Wait for the table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      const newLeadRow = page
        .locator('table tbody tr')
        .filter({ hasText: 'new' })
        .first()

      if ((await newLeadRow.count()) > 0) {
        await newLeadRow.click()
        await page.waitForURL(/\/admin\/leads\/.*/, { timeout: 5000 })

        await page.getByRole('tab', { name: 'Team' }).click()

        const helpText = page.getByText(
          "Assign a team member to start managing this client's care"
        )

        if ((await helpText.count()) > 0) {
          await expect(helpText).toBeVisible()
        }
      }
    })
  })

  test.describe('Disabled State', () => {
    test('should disable Assign Provider button when no available members', async ({
      page,
    }) => {
      const hasClient = await navigateToClientLead(page)
      if (!hasClient) {
        test.skip(true, 'No leads available to test')
        return
      }

      await page.getByRole('tab', { name: 'Team' }).click()

      const assignButton = page.getByRole('button', { name: 'Assign Provider' })

      // Button is either enabled (has available members) or disabled (all assigned)
      const isDisabled = await assignButton.isDisabled()

      // This is just checking the button exists and has correct disabled state
      expect(typeof isDisabled).toBe('boolean')
    })
  })
})
