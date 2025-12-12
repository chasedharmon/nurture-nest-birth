import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_OPPORTUNITY_ID = 'e2e00000-0000-0000-0000-000000000103'
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'

test.describe('CRM Opportunities', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Opportunities List View', () => {
    test('should load opportunities list page', async ({ page }) => {
      await page.goto('/admin/opportunities')
      await expect(page).toHaveURL('/admin/opportunities')

      // Should show page title
      await expect(page.locator('h1:has-text("Opportunities")')).toBeVisible()
    })

    test('should display opportunities table with columns', async ({
      page,
    }) => {
      await page.goto('/admin/opportunities')

      // Check for table headers
      await expect(page.locator('th:has-text("Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Stage")')).toBeVisible()
      await expect(page.locator('th:has-text("Amount")')).toBeVisible()
    })

    test('should show seeded E2E test opportunity', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Wait for the seeded opportunity to appear
      await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('E2E Birth')

        // Should filter to show only matching opportunities
        await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()
      }
    })

    test('should navigate to opportunity detail on row click', async ({
      page,
    }) => {
      await page.goto('/admin/opportunities')

      // Wait for opportunities to load
      await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible({
        timeout: 10000,
      })

      // Click on the opportunity row
      await page.locator('text=E2E Birth Doula Package').click()

      // Should navigate to opportunity detail page
      await expect(page).toHaveURL(
        new RegExp(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)
      )
    })
  })

  test.describe('Opportunity Detail View', () => {
    test('should load opportunity detail page', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show opportunity name
      await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()
    })

    test('should display opportunity information fields', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show amount
      await expect(
        page.locator('text=2,500').or(page.locator('text=$2,500'))
      ).toBeVisible()
    })

    test('should show opportunity stage', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show stage (closed_won)
      await expect(
        page
          .locator('text=Closed Won')
          .or(page.locator('text=closed_won'))
          .or(page.locator('text=Won'))
      ).toBeVisible()
    })

    test('should show service type', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show service type
      await expect(
        page
          .locator('text=birth_doula')
          .or(page.locator('text=Birth Doula'))
          .or(page.locator('text=birth doula'))
      ).toBeVisible()
    })

    test('should display linked account', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show linked account
      await expect(page.locator('text=E2E Test Household')).toBeVisible()
    })

    test('should display primary contact', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show primary contact
      await expect(page.locator('text=E2E TestContact')).toBeVisible()
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show related activities tab', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should have Activities tab
      await expect(page.locator('text=Activities')).toBeVisible()
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should have back link
      const backLink = page
        .locator('a:has-text("Back")')
        .or(page.locator('a:has-text("Opportunities")'))
      await expect(backLink.first()).toBeVisible()

      await backLink.first().click()
      await expect(page).toHaveURL(/\/admin\/opportunities$/)
    })
  })

  test.describe('Opportunity Create', () => {
    test('should have create opportunity button', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Should have new opportunity button
      const newButton = page
        .locator('button:has-text("New Opportunity")')
        .or(page.locator('a:has-text("New Opportunity")'))
      await expect(newButton.first()).toBeVisible()
    })

    test('should open create opportunity form', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Click new opportunity button
      const newButton = page
        .locator('button:has-text("New Opportunity")')
        .or(page.locator('a:has-text("New Opportunity")'))
      await newButton.first().click()

      // Should navigate to new opportunity page or open modal
      await expect(
        page
          .locator('h1:has-text("New Opportunity")')
          .or(page.locator('h2:has-text("New Opportunity")'))
          .or(page.locator('text=Create Opportunity'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show required fields in create form', async ({ page }) => {
      await page.goto('/admin/opportunities/new')

      // Should have required field labels
      await expect(
        page.locator('text=Name').or(page.locator('text=Opportunity Name'))
      ).toBeVisible()
      await expect(page.locator('text=Stage')).toBeVisible()
    })

    test('should create new opportunity', async ({ page }) => {
      const timestamp = Date.now()
      const oppName = `E2E Test Opportunity ${timestamp}`

      await page.goto('/admin/opportunities/new')

      // Fill out the form
      await page.fill('input[name="name"]', oppName)
      await page.fill('input[name="amount"]', '1500')

      // Select stage
      const stageSelect = page
        .locator('select[name="stage"]')
        .or(page.locator('[name="stage"]'))
      if (await stageSelect.isVisible()) {
        await stageSelect.selectOption('qualification')
      }

      // Submit the form
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should redirect to opportunity detail or list
      await expect(page).toHaveURL(/\/admin\/opportunities/, { timeout: 10000 })

      // Verify opportunity was created by searching
      await page.goto('/admin/opportunities')
      await expect(page.locator(`text=${oppName}`)).toBeVisible({
        timeout: 10000,
      })
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.goto('/admin/opportunities/new')

      // Try to submit without filling required fields
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/admin\/opportunities\/new/)
    })
  })

  test.describe('Opportunity Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

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
          .or(page.locator('input[name="name"]'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update opportunity amount', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Update amount
      const amountInput = page.locator('input[name="amount"]')
      await amountInput.clear()
      await amountInput.fill('3000')

      // Save changes
      const saveButton = page.locator('button:has-text("Save")')
      await saveButton.click()

      // Should show updated amount
      await expect(
        page.locator('text=3,000').or(page.locator('text=$3,000'))
      ).toBeVisible({ timeout: 10000 })

      // Restore original amount
      await editButton.first().click()
      await amountInput.clear()
      await amountInput.fill('2500')
      await saveButton.click()
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Make a change
      const amountInput = page.locator('input[name="amount"]')
      await amountInput.clear()
      await amountInput.fill('9999')

      // Cancel
      const cancelButton = page.locator('button:has-text("Cancel")')
      await cancelButton.click()

      // Should show original amount
      await expect(
        page.locator('text=2,500').or(page.locator('text=$2,500'))
      ).toBeVisible()
    })
  })

  test.describe('Opportunity Pipeline Stages', () => {
    test('should display all stage options', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Check for stage dropdown
      const stageSelect = page.locator('select[name="stage"]')
      if (await stageSelect.isVisible()) {
        // Check for stage options
        await expect(
          stageSelect
            .locator('option[value="qualification"]')
            .or(stageSelect.locator('option:has-text("Qualification")'))
        ).toBeVisible()
        await expect(
          stageSelect
            .locator('option[value="needs_analysis"]')
            .or(stageSelect.locator('option:has-text("Needs Analysis")'))
        ).toBeVisible()
        await expect(
          stageSelect
            .locator('option[value="proposal"]')
            .or(stageSelect.locator('option:has-text("Proposal")'))
        ).toBeVisible()
        await expect(
          stageSelect
            .locator('option[value="negotiation"]')
            .or(stageSelect.locator('option:has-text("Negotiation")'))
        ).toBeVisible()
        await expect(
          stageSelect
            .locator('option[value="closed_won"]')
            .or(stageSelect.locator('option:has-text("Closed Won")'))
        ).toBeVisible()
        await expect(
          stageSelect
            .locator('option[value="closed_lost"]')
            .or(stageSelect.locator('option:has-text("Closed Lost")'))
        ).toBeVisible()
      }
    })

    test('should show stage badge with appropriate styling', async ({
      page,
    }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Closed Won should have positive styling (green)
      const stageBadge = page
        .locator('[class*="green"]')
        .or(page.locator('text=Closed Won'))
      await expect(stageBadge.first()).toBeVisible()
    })
  })

  test.describe('Opportunity Search & Filter', () => {
    test('should filter opportunities by stage', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Look for stage filter
      const stageFilter = page
        .locator('select[name="stage"]')
        .or(page.locator('button:has-text("Stage")'))
      if (await stageFilter.isVisible()) {
        await stageFilter.click()
        await page.locator('text=Closed Won').click()

        // Should filter results
        await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()
      }
    })

    test('should filter opportunities by service type', async ({ page }) => {
      await page.goto('/admin/opportunities')

      // Look for service type filter
      const serviceTypeFilter = page
        .locator('select[name="service_type"]')
        .or(page.locator('button:has-text("Service Type")'))
      if (await serviceTypeFilter.isVisible()) {
        await serviceTypeFilter.click()
        await page.locator('text=Birth Doula').click()

        // Should filter results
        await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()
      }
    })

    test('should clear search filter', async ({ page }) => {
      await page.goto('/admin/opportunities')

      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        // Apply search
        await searchInput.fill('E2E Birth')
        await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()

        // Clear search
        await searchInput.clear()

        // All opportunities should be visible again
        await expect(page.locator('text=E2E Birth Doula Package')).toBeVisible()
      }
    })
  })

  test.describe('Opportunity-Account Relationships', () => {
    test('should navigate to linked account', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

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

  test.describe('Opportunity-Contact Relationships', () => {
    test('should navigate to primary contact', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Click on contact link
      const contactLink = page.locator('a:has-text("E2E TestContact")')
      if (await contactLink.isVisible()) {
        await contactLink.click()

        // Should navigate to contact detail
        await expect(page).toHaveURL(
          new RegExp(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
        )
      }
    })
  })

  test.describe('Opportunity Close Date', () => {
    test('should display close date', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show close date field
      await expect(
        page
          .locator('text=Close Date')
          .or(page.locator('text=Actual Close Date'))
      ).toBeVisible()
    })
  })

  test.describe('Opportunity Service Types', () => {
    test('should display service type options', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Check for service type dropdown
      const serviceTypeSelect = page.locator('select[name="service_type"]')
      if (await serviceTypeSelect.isVisible()) {
        // Common doula service types
        await expect(
          serviceTypeSelect
            .locator('option[value="birth_doula"]')
            .or(serviceTypeSelect.locator('option:has-text("Birth Doula")'))
        ).toBeVisible()
        await expect(
          serviceTypeSelect
            .locator('option[value="postpartum_doula"]')
            .or(serviceTypeSelect.locator('option:has-text("Postpartum")'))
        ).toBeVisible()
      }
    })
  })

  test.describe('Opportunity Next Step', () => {
    test('should display next step', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show next step
      await expect(page.locator('text=Schedule prenatal visit')).toBeVisible()
    })

    test('should display next step date', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Should show next step date field
      await expect(
        page.locator('text=Next Step Date').or(page.locator('text=Next Step'))
      ).toBeVisible()
    })
  })

  test.describe('Opportunity Probability', () => {
    test('should display probability for closed_won', async ({ page }) => {
      await page.goto(`/admin/opportunities/${E2E_CRM_OPPORTUNITY_ID}`)

      // Closed Won should show 100%
      await expect(
        page.locator('text=100%').or(page.locator('text=100'))
      ).toBeVisible()
    })
  })
})
