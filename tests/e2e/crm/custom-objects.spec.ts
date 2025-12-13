import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Custom Object Creation
 *
 * Tests the full workflow of creating custom CRM objects including:
 * - Wizard dialog navigation
 * - Form validation
 * - Field creation
 * - Object creation submission
 * - Navigation integration
 */

test.describe('Custom Objects', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Objects Setup Page', () => {
    test('should load objects setup page', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Should show page title (Object Manager)
      await expect(page.locator('h1:has-text("Object Manager")')).toBeVisible()
    })

    test('should display New Custom Object button', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Check for the new custom object button
      const newButton = page.locator('button:has-text("New Custom Object")')
      await expect(newButton).toBeVisible()
      await expect(newButton).toBeEnabled()
    })

    test('should display standard objects list', async ({ page }, testInfo) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Should show standard objects section (text varies by viewport)
      await expect(page.locator('text=Standard Objects').first()).toBeVisible()

      // On mobile, the section might be collapsed - click to expand if needed
      const isMobile = testInfo.project.name === 'mobile'
      if (isMobile) {
        // On mobile, click the Standard Objects section to expand it
        const standardSection = page.locator('text=Standard Objects').first()
        await standardSection.click()
        await page.waitForTimeout(300) // Wait for animation
      }

      // Should show standard objects (Account, Contact, etc.)
      // Look for the object links in the Standard Objects section
      const standardObjectsSection = page.locator(
        'h2:has-text("Standard Objects")'
      )
      await expect(standardObjectsSection).toBeVisible()

      // The objects appear as links to /admin/setup/objects/{uuid}
      // Use getByRole for more specific matching
      await expect(
        page.getByRole('link', { name: /Standard Account/i })
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: /Standard Contact/i })
      ).toBeVisible()
    })

    test('should display custom objects section', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Should show custom objects section
      await expect(page.locator('h2:has-text("Custom Objects")')).toBeVisible()
    })

    test('should navigate back to setup hub', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Click back button/link to setup
      const backButton = page.locator('button:has-text("Setup")').first()
      await backButton.click()

      await expect(page).toHaveURL('/admin/setup')
    })
  })

  test.describe('Create Object Wizard - Dialog', () => {
    test('should open wizard dialog when clicking New Custom Object', async ({
      page,
    }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      // Click the new custom object button
      await page.locator('button:has-text("New Custom Object")').click()

      // Dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(
        page.locator('h2:has-text("Create Custom Object")')
      ).toBeVisible()
    })

    test('should display all wizard steps', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Should show step indicators
      await expect(page.locator('text=Basic Info').first()).toBeVisible()
      await expect(page.locator('text=Features').first()).toBeVisible()
      await expect(page.locator('text=Appearance').first()).toBeVisible()
      await expect(page.locator('text=Fields').first()).toBeVisible()
      await expect(page.locator('text=Review').first()).toBeVisible()
    })

    test('should close dialog when clicking close button', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Click the Close button
      await page.locator('button:has-text("Close")').click()

      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Step 1: Basic Info', () => {
    test('should show required fields in step 1', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Check for required field labels
      await expect(page.locator('text=Label').first()).toBeVisible()
      await expect(page.locator('text=Plural Label').first()).toBeVisible()
      await expect(page.locator('text=API Name').first()).toBeVisible()
    })

    test('should auto-generate API name from label', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Fill in the label
      const labelInput = page.locator('input#label')
      await labelInput.fill('Birth Plan')

      // Wait for auto-generation
      await page.waitForTimeout(300)

      // API name should be auto-generated
      const apiNameInput = page.locator('input#apiName')
      await expect(apiNameInput).toHaveValue('birth_plan')
    })

    test('should auto-generate plural label from label', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Fill in the label
      const labelInput = page.locator('input#label')
      await labelInput.fill('Birth Plan')

      // Wait for auto-generation
      await page.waitForTimeout(300)

      // Plural label should be auto-generated
      const pluralInput = page.locator('input#pluralLabel')
      await expect(pluralInput).toHaveValue('Birth Plans')
    })

    test('should validate required fields before proceeding', async ({
      page,
    }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Try to go to next step without filling required fields
      await page.locator('button:has-text("Next")').click()

      // Should show validation errors (text-destructive class)
      await expect(page.locator('.text-destructive').first()).toBeVisible()

      // Should still be on step 1 (label input still visible)
      await expect(page.locator('input#label')).toBeVisible()
    })

    test('should navigate to step 2 after filling required fields', async ({
      page,
    }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Fill required fields
      await page.locator('input#label').fill('Test Object')

      // Wait for auto-generation
      await page.waitForTimeout(300)

      // Click Next
      await page.locator('button:has-text("Next")').click()

      // Should be on step 2 (Features) - Activities checkbox visible
      await expect(
        page.locator('label:has-text("Activities")').first()
      ).toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Step 2: Features', () => {
    test('should display feature toggles', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 2
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()

      // Should show feature options
      await expect(
        page.locator('label:has-text("Activities")').first()
      ).toBeVisible()
      await expect(
        page.locator('label:has-text("Notes")').first()
      ).toBeVisible()
      await expect(
        page.locator('label:has-text("Attachments")').first()
      ).toBeVisible()
    })

    test('should display sharing model selector', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()

      // Should show sharing model label
      await expect(page.locator('text=Sharing Model').first()).toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Step 3: Appearance', () => {
    test('should display icon selection grid', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 3
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show icon selection - Label says "Icon"
      await expect(
        page.locator('[role="dialog"]').locator('text=Icon').first()
      ).toBeVisible()
    })

    test('should display color selection', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show color selection - Label says "Color"
      await expect(
        page.locator('[role="dialog"]').locator('text=Color').first()
      ).toBeVisible()
    })

    test('should show preview with object name', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show the object name in preview
      await expect(
        page.locator('[role="dialog"]').locator('text=Test Object').first()
      ).toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Step 4: Fields', () => {
    test('should display Add Field button', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 4
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show add field button
      await expect(
        page.locator('[role="dialog"]').locator('button:has-text("Add Field")')
      ).toBeVisible()
    })

    test('should open field form when clicking Add Field', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 4
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Click add field
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .click()

      // Should show field form with Field Label input
      await expect(
        page.getByRole('textbox', { name: /Field Label/i })
      ).toBeVisible()
    })

    test('should add a text field', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 4
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Click add field to open the form
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .click()

      // Fill field details
      await page
        .getByRole('textbox', { name: /Field Label/i })
        .fill('Description')
      await page.getByRole('textbox', { name: /API Name/i }).fill('description')

      // Save the field (button says "Add Field" inside the form)
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .last()
        .click()

      // Field should appear in the list (look for the badge or field name)
      await expect(
        page.locator('[role="dialog"]').locator('text=description__c').first()
      ).toBeVisible()
    })

    test('should add a picklist field with values', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to step 4
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Add a picklist field
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .click()

      await page.getByRole('textbox', { name: /Field Label/i }).fill('Status')
      await page.getByRole('textbox', { name: /API Name/i }).fill('status')

      // Change field type to picklist using the combobox
      await page.locator('[role="dialog"]').locator('button#fieldType').click()
      await page.locator('[role="option"]:has-text("Picklist")').click()

      // Wait for picklist value input to appear
      await page.waitForTimeout(300)

      // Add picklist values - the input placeholder contains "Add a picklist value"
      const picklistInput = page.locator(
        'input[placeholder*="picklist" i], input[placeholder*="value" i]'
      )
      await picklistInput.fill('Active')
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add")')
        .first()
        .click()

      await picklistInput.fill('Inactive')
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add")')
        .first()
        .click()

      // Save the field
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .last()
        .click()

      // Field should appear in the list
      await expect(
        page.locator('[role="dialog"]').locator('text=status__c').first()
      ).toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Step 5: Review', () => {
    test('should display object summary in review step', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate through all steps
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should be on review step showing the object name
      await expect(
        page.locator('[role="dialog"]').locator('text=Test Object').first()
      ).toBeVisible()

      // Should show API name with __c suffix
      await expect(
        page.locator('[role="dialog"]').locator('text=test_object__c')
      ).toBeVisible()
    })

    test('should display warning about API name being permanent', async ({
      page,
    }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to review
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show warning about API name
      await expect(
        page.locator('text=API name cannot be changed').first()
      ).toBeVisible()
    })

    test('should show Create Object button in review step', async ({
      page,
    }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to review
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Should show create button
      await expect(
        page.locator('button:has-text("Create Object")')
      ).toBeVisible()
    })

    test('should allow navigating back to previous steps', async ({ page }) => {
      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Navigate to review
      await page.locator('input#label').fill('Test Object')
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()
      await page.locator('button:has-text("Next")').click()

      // Go back
      await page.locator('button:has-text("Back")').click()

      // Should be on Fields step - Custom Fields heading visible
      await expect(
        page.locator('[role="dialog"]').locator('text=Custom Fields').first()
      ).toBeVisible()

      // Go back more
      await page.locator('button:has-text("Back")').click()

      // Should be on Appearance step - look for Icon label
      await expect(
        page.locator('[role="dialog"]').locator('text=Icon').first()
      ).toBeVisible()
    })
  })

  test.describe('Create Object Wizard - Full Flow', () => {
    // Give more time for the full flow test since object creation involves multiple DB operations
    test('should create a custom object with fields', async ({ page }) => {
      test.setTimeout(60000) // 60 second timeout

      const timestamp = Date.now()
      const objectLabel = `E2E Test ${timestamp}`

      await page.goto('/admin/setup/objects')
      await page.waitForLoadState('networkidle')

      await page.locator('button:has-text("New Custom Object")').click()

      // Step 1: Basic Info
      await page.locator('input#label').fill(objectLabel)
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Next")').click()

      // Step 2: Features (keep defaults)
      await page.locator('button:has-text("Next")').click()

      // Step 3: Appearance - just proceed (default icon is fine)
      await page.locator('button:has-text("Next")').click()

      // Step 4: Add a custom field
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .click()

      await page.getByRole('textbox', { name: /Field Label/i }).fill('Priority')
      await page.getByRole('textbox', { name: /API Name/i }).fill('priority')

      // Save field
      await page
        .locator('[role="dialog"]')
        .locator('button:has-text("Add Field")')
        .last()
        .click()

      // Verify field was added
      await expect(
        page.locator('[role="dialog"]').locator('text=priority__c').first()
      ).toBeVisible()

      await page.locator('button:has-text("Next")').click()

      // Step 5: Review and Create
      await expect(
        page.locator('[role="dialog"]').locator(`text=${objectLabel}`).first()
      ).toBeVisible()

      // Create the object
      await page.locator('button:has-text("Create Object")').click()

      // Wait for either dialog to close or navigate away (object creation may take time)
      // The dialog will show "Creating..." and then close or redirect on success
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({
        timeout: 15000,
      })

      // Verify we're on the objects list and the new object appears
      await page.waitForLoadState('networkidle')

      // The object was created - verify by checking:
      // 1. The h1 heading contains our object label (works on both list and detail pages)
      // 2. The priority__c field we created is visible
      await expect(
        page.locator(`h1:has-text("${objectLabel}")`).first()
      ).toBeVisible({ timeout: 10000 })

      // Also verify the custom field we added is visible
      await expect(page.locator('text=priority__c').first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Custom Object Navigation Integration', () => {
    test('should show navigation items on admin page', async ({
      page,
    }, testInfo) => {
      // Skip on mobile - nav is hidden in hamburger menu
      test.skip(
        testInfo.project.name === 'mobile',
        'Navigation is in hamburger menu on mobile'
      )

      // Navigate to admin to check navigation
      await page.goto('/admin')
      await page.waitForLoadState('networkidle')

      // Navigation should be present with standard objects
      await expect(page.locator('nav').first()).toBeVisible()
      await expect(page.locator('text=Accounts').first()).toBeVisible()
      await expect(page.locator('text=Contacts').first()).toBeVisible()
    })
  })
})
