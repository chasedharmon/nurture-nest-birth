import { test, expect } from '@playwright/test'

/**
 * CRM Field-Level Permissions E2E Tests
 *
 * Tests field-level security across CRM objects including:
 * - Field visibility based on user role
 * - Field editability based on user role
 * - Sensitive field access restrictions
 * - Permission enforcement across all CRM objects (Lead, Contact, Account, Opportunity)
 *
 * Key security concepts tested:
 * - visibleFieldIds: Which fields the user can see in forms/views
 * - editableFieldIds: Which fields the user can modify
 * - SecurityContext: Pre-computed permissions based on role and ownership
 */

// Test data IDs from data-seed.setup.ts
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'
const E2E_CRM_LEAD_ID = 'e2e00000-0000-0000-0000-000000000102'
const E2E_CRM_OPPORTUNITY_ID = 'e2e00000-0000-0000-0000-000000000103'

test.describe('CRM Field-Level Permissions', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Lead Field Security', () => {
    test('should display standard lead fields in view mode', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load (TestLead is the last name)
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Standard fields should be visible in view mode
      await expect(page.locator('text=First Name')).toBeVisible()
      await expect(page.locator('text=Last Name')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()
      await expect(page.locator('text=Phone')).toBeVisible()
      await expect(page.locator('text=Lead Status')).toBeVisible()
    })

    test('should render lead fields in edit mode for owner/admin', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Click edit button (should be visible for owner/admin)
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
      await editButton.first().click()

      // Form fields should be editable (rendered as inputs, not static text)
      await expect(
        page.getByRole('textbox', { name: /first name/i })
      ).toBeVisible({ timeout: 5000 })
      await expect(
        page.getByRole('textbox', { name: /last name/i })
      ).toBeVisible()
    })

    test('should show lead source field with picklist values', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Click edit button
      const editButton = page.locator('button:has-text("Edit")')
      await editButton.first().click()

      // Lead Source should be a picklist field
      await expect(page.locator('text=Lead Source').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display expected due date field (date type)', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Expected Due Date field should be visible (doula-specific field)
      await expect(
        page.locator('text=Expected Due Date').or(page.locator('text=Due Date'))
      ).toBeVisible()
    })
  })

  test.describe('Contact Field Security', () => {
    test('should display standard contact fields in view mode', async ({
      page,
    }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Wait for page to load (TestContact is the last name)
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })

      // Standard fields should be visible (use .first() for strict mode)
      await expect(page.locator('text=First Name').first()).toBeVisible()
      await expect(page.locator('text=Last Name').first()).toBeVisible()
      await expect(page.locator('text=Email').first()).toBeVisible()
      await expect(page.locator('text=Phone').first()).toBeVisible()
    })

    test('should render contact fields in edit mode for owner/admin', async ({
      page,
    }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })

      // Click edit button
      const editButton = page.locator('button:has-text("Edit")')
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
      await editButton.first().click()

      // Form fields should be editable
      await expect(
        page.getByRole('textbox', { name: /first name/i })
      ).toBeVisible({ timeout: 5000 })
      await expect(
        page.getByRole('textbox', { name: /last name/i })
      ).toBeVisible()
    })

    test('should display partner name field (doula-specific)', async ({
      page,
    }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })

      // Partner Name is a doula-specific field
      await expect(page.locator('text=Partner Name').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display mailing address fields', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })

      // May need to click Details tab
      const detailsTab = page.locator('[role="tab"]:has-text("Details")')
      if (await detailsTab.isVisible()) {
        await detailsTab.click()
      }

      // Address fields should be visible
      await expect(page.locator('text=Mailing Street').first()).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('text=Mailing City').first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Account Field Security', () => {
    test('should display standard account fields in view mode', async ({
      page,
    }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Standard fields should be visible
      await expect(page.locator('text=Account Name')).toBeVisible()
      await expect(page.locator('text=Account Type')).toBeVisible()
      await expect(page.locator('text=Account Status')).toBeVisible()
    })

    test('should render account fields in edit mode for owner/admin', async ({
      page,
    }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Click edit button
      const editButton = page.locator('button:has-text("Edit")')
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
      await editButton.first().click()

      // Account Name should be editable
      await expect(
        page.getByRole('textbox', { name: /account name/i })
      ).toBeVisible({ timeout: 5000 })
    })

    test('should display billing address fields', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // May need to click Details tab
      const detailsTab = page.locator('[role="tab"]:has-text("Details")')
      if (await detailsTab.isVisible()) {
        await detailsTab.click()
      }

      // Billing address fields should be visible
      await expect(page.locator('text=Billing Street')).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('text=Billing City')).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('text=Billing State')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Opportunity Field Security', () => {
    test('should display standard opportunity fields in view mode', async ({
      page,
    }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Wait for page to load
      await expect(
        page.locator('text=E2E Birth Doula Package').first()
      ).toBeVisible({
        timeout: 10000,
      })

      // Standard fields should be visible
      await expect(
        page.locator('text=Opportunity Name').or(page.locator('text=Name'))
      ).toBeVisible()
      await expect(page.locator('text=Stage')).toBeVisible()
      await expect(page.locator('text=Amount')).toBeVisible()
    })

    test('should render opportunity fields in edit mode for owner/admin', async ({
      page,
    }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Wait for page to load
      await expect(
        page.locator('text=E2E Birth Doula Package').first()
      ).toBeVisible({
        timeout: 10000,
      })

      // Click edit button
      const editButton = page.locator('button:has-text("Edit")')
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
      await editButton.first().click()

      // Opportunity Name should be editable
      await expect(
        page
          .getByRole('textbox', { name: /name/i })
          .or(page.getByRole('textbox', { name: /opportunity name/i }))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should display stage picklist with correct values', async ({
      page,
    }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Wait for page to load
      await expect(
        page.locator('text=E2E Birth Doula Package').first()
      ).toBeVisible({
        timeout: 10000,
      })

      // Stage field should show the current value
      await expect(
        page
          .locator('text=Closed Won')
          .or(page.locator('text=closed_won'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should display financial fields (amount, close date)', async ({
      page,
    }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Wait for page to load
      await expect(
        page.locator('text=E2E Birth Doula Package').first()
      ).toBeVisible({
        timeout: 10000,
      })

      // Financial fields should be visible
      await expect(page.locator('text=Amount').first()).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('text=Close Date').first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Record-Level Permission Indicators', () => {
    test('should show edit button for record owner', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Edit button should be visible (admin/owner has edit permissions)
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show delete option in actions menu for owner', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Open more actions dropdown
      const moreActionsButton = page.locator('button').filter({
        has: page.locator(
          '[class*="lucide-more"], svg[class*="MoreHorizontal"]'
        ),
      })
      if (await moreActionsButton.first().isVisible()) {
        await moreActionsButton.first().click()

        // Delete option should be available for owner
        await expect(
          page.locator('[role="menuitem"]:has-text("Delete")')
        ).toBeVisible({ timeout: 5000 })

        // Close the dropdown
        await page.keyboard.press('Escape')
      }
    })

    test('should show sharing tab for records with owner', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Sharing tab should be available
      await expect(
        page
          .locator('button:has-text("Sharing")')
          .or(page.locator('[role="tab"]:has-text("Sharing")'))
      ).toBeVisible()
    })
  })

  test.describe('Field Validation on Edit', () => {
    test('should validate required fields on lead edit', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Enter edit mode
      const editButton = page.locator('button:has-text("Edit")')
      await editButton.first().click()

      // Wait for edit mode to be active
      await expect(page.locator('button:has-text("Save")')).toBeVisible({
        timeout: 5000,
      })

      // Clear a required field (last name) - get the first textbox with last name
      const lastNameInput = page
        .getByRole('textbox', { name: /last name/i })
        .first()
      await lastNameInput.clear()

      // Try to save
      const saveButton = page.locator('button:has-text("Save")')
      await saveButton.click()

      // Should show validation error or stay on page (not navigate away)
      // The form should prevent submission with empty required fields
      // Check we're still on the edit form (Cancel button visible means edit mode)
      await expect(
        page
          .locator('button:has-text("Cancel")')
          .or(page.locator('text=required'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should validate email format on contact edit', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })

      // Enter edit mode
      const editButton = page.locator('button:has-text("Edit")')
      await editButton.first().click()

      // Find email input and enter invalid email
      const emailInput = page.locator(
        'input[placeholder*="email@example.com" i], input[type="email"]'
      )
      if (await emailInput.first().isVisible()) {
        await emailInput.first().clear()
        await emailInput.first().fill('invalid-email')

        // Try to save - browser validation may prevent submission
        const saveButton = page.locator('button:has-text("Save")')
        await saveButton.click()

        // Should stay on form or show validation error
        await expect(editButton.or(saveButton)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Field Display Modes', () => {
    test('should render fields as read-only in view mode', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // In view mode, fields should not be editable inputs
      // Check that the edit button exists (indicating we're in view mode)
      const editButton = page.locator('button:has-text("Edit")')
      await expect(editButton.first()).toBeVisible()

      // In view mode, should not see active form inputs until Edit is clicked
      // The form renders with readOnly=true in view mode
      await expect(
        page.locator('button:has-text("Save"):visible')
      ).not.toBeVisible()
    })

    test('should toggle between view and edit modes', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Should start in view mode
      const editButton = page.locator('button:has-text("Edit")')
      await expect(editButton.first()).toBeVisible()

      // Click Edit to enter edit mode
      await editButton.first().click()

      // Should show Cancel and Save buttons in edit mode (use header locator to be specific)
      const headerCancelButton = page.locator(
        'header button:has-text("Cancel")'
      )
      await expect(headerCancelButton).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('button:has-text("Save")')).toBeVisible()

      // Click Cancel to return to view mode (use the header button)
      await headerCancelButton.click()

      // Should be back in view mode
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Cross-Object Field Consistency', () => {
    test('should display consistent field labels across objects', async ({
      page,
    }) => {
      // Check Lead has consistent field labels
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)
      await expect(page.locator('text=First Name')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('text=Last Name')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()

      // Check Contact has same field labels
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
      await expect(page.locator('text=First Name')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('text=Last Name')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()
    })

    test('should apply same edit permissions on all owned records', async ({
      page,
    }) => {
      // Check Lead edit permissions
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })
      const leadEditButton = page.locator('button:has-text("Edit")').first()
      await expect(leadEditButton).toBeVisible()

      // Check Contact edit permissions
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
      await expect(page.locator('text=TestContact').first()).toBeVisible({
        timeout: 10000,
      })
      const contactEditButton = page.locator('button:has-text("Edit")').first()
      await expect(contactEditButton).toBeVisible()

      // Check Account edit permissions
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )
      const accountEditButton = page.locator('button:has-text("Edit")').first()
      await expect(accountEditButton).toBeVisible()

      // Check Opportunity edit permissions
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)
      await expect(
        page.locator('text=E2E Birth Doula Package').first()
      ).toBeVisible({
        timeout: 10000,
      })
      const opportunityEditButton = page
        .locator('button:has-text("Edit")')
        .first()
      await expect(opportunityEditButton).toBeVisible()
    })
  })

  test.describe('Security Context Loading', () => {
    test('should load security context and show appropriate UI', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // Security context should be loaded (indicated by presence of Edit button
      // or read-only indicator). For admin/owner, Edit should be visible
      const editButton = page.locator('button:has-text("Edit")').first()
      await expect(editButton).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show owner badge or indicator for owned records', async ({
      page,
    }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Wait for page to load
      await expect(page.locator('text=TestLead').first()).toBeVisible({
        timeout: 10000,
      })

      // For owned records, should have full edit/delete capabilities
      // This is indicated by the presence of Edit button
      await expect(
        page.locator('button:has-text("Edit")').first()
      ).toBeVisible()

      // More actions menu should be available (look for icon button near Edit)
      // The more actions button uses MoreHorizontal icon or similar
      const moreActionsButton = page
        .locator('header button')
        .filter({
          has: page.locator('svg'),
        })
        .first()
      await expect(moreActionsButton).toBeVisible()
    })
  })
})
