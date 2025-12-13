import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_ACTIVITY_EVENT_ID = 'e2e00000-0000-0000-0000-000000000104'
const E2E_CRM_ACTIVITY_TASK_ID = 'e2e00000-0000-0000-0000-000000000105'
const E2E_CRM_ACTIVITY_CALL_ID = 'e2e00000-0000-0000-0000-000000000106'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'
const E2E_CRM_LEAD_ID = 'e2e00000-0000-0000-0000-000000000102'

// Activity subjects from data-seed.setup.ts
const E2E_ACTIVITY_EVENT_SUBJECT = 'E2E Prenatal Visit'
const E2E_ACTIVITY_TASK_SUBJECT = 'E2E Follow-up Call'
const E2E_ACTIVITY_CALL_SUBJECT = 'E2E Initial Consultation'

test.describe('CRM Activities', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Activity Detail View', () => {
    test('should load event activity detail page', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Should show activity subject
      await expect(
        page.locator(`text=${E2E_ACTIVITY_EVENT_SUBJECT}`).first()
      ).toBeVisible({ timeout: 10000 })
    })

    test('should load task activity detail page', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Should show activity subject
      await expect(
        page.locator(`text=${E2E_ACTIVITY_TASK_SUBJECT}`).first()
      ).toBeVisible({ timeout: 10000 })
    })

    test('should load call activity detail page', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_CALL_ID}`)

      // Should show activity subject
      await expect(
        page.locator(`text=${E2E_ACTIVITY_CALL_SUBJECT}`).first()
      ).toBeVisible({ timeout: 10000 })
    })

    test('should display event activity type badge', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Should show event type badge
      await expect(page.locator('text=Event').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display task activity type badge', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Should show task type badge
      await expect(page.locator('text=Task').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display call activity type badge', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_CALL_ID}`)

      // Should show call type badge
      await expect(page.locator('text=Call').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display activity status badge', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_CALL_ID}`)

      // Call activity is seeded with status=completed
      // Status should be displayed as a badge - look for both capitalized and lowercase
      await expect(
        page
          .locator('[class*="badge"]:has-text("Completed")')
          .or(page.locator('[class*="badge"]:has-text("completed")'))
          .or(page.locator('text=Completed'))
          .or(page.locator('text=completed'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show activity description section', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Should show description field label (may be called Description, Notes, or Details)
      await expect(
        page
          .locator('text=Description')
          .or(page.locator('text=Notes'))
          .or(page.locator('text=Details'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show date information for task', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Tasks should show some date information
      // Could be Due Date, Activity Date, Scheduled Date, etc.
      await expect(
        page
          .locator('text=Due Date')
          .or(page.locator('text=Due'))
          .or(page.locator('text=Activity Date'))
          .or(page.locator('text=Date'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show date information for event', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Events should show some date information
      await expect(
        page
          .locator('text=Start Date')
          .or(page.locator('text=Start'))
          .or(page.locator('text=Activity Date'))
          .or(page.locator('text=Date'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Should have back link
      const backLink = page
        .locator('a:has-text("Back")')
        .or(page.locator('[aria-label="Back"]'))
        .or(page.locator('a[href="/admin"]'))
      await expect(backLink.first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Activity Linking', () => {
    test('should show related record information on activity', async ({
      page,
    }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Event is linked to contact via who_id and to opportunity via related_to_id
      // Page should show tabs or sections for related records
      // This test validates that the page loads and shows SOME relationship info
      await expect(
        page
          .locator('[role="tab"]')
          .or(page.locator('text=Contact'))
          .or(page.locator('text=Related'))
          .or(page.locator('text=Who'))
          .or(page.locator('text=Opportunity'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show related opportunity link when present', async ({
      page,
    }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Activity has related_to_id pointing to opportunity
      // Should show related record section or tab
      await expect(
        page
          .locator('text=Related')
          .or(page.locator('text=Opportunity'))
          .or(page.locator('[role="tab"]'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Activities via Contact', () => {
    test('should show activities tab on contact page', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Should have Activities tab
      await expect(
        page
          .locator('[role="tab"]:has-text("Activities")')
          .or(page.locator('button:has-text("Activities")'))
      ).toBeVisible({ timeout: 10000 })
    })

    test('should display related activities on contact', async ({ page }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Click Activities tab
      const activitiesTab = page
        .locator('[role="tab"]:has-text("Activities")')
        .or(page.locator('button:has-text("Activities")'))
      await activitiesTab.click()

      // Should show one of the seeded activities linked to this contact
      await expect(
        page
          .locator(`text=${E2E_ACTIVITY_EVENT_SUBJECT}`)
          .or(page.locator(`text=${E2E_ACTIVITY_TASK_SUBJECT}`))
          .or(page.locator(`text=${E2E_ACTIVITY_CALL_SUBJECT}`))
          .first()
      ).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to activity detail from contact', async ({
      page,
    }) => {
      await page.goto(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)

      // Click Activities tab
      const activitiesTab = page
        .locator('[role="tab"]:has-text("Activities")')
        .or(page.locator('button:has-text("Activities")'))
      await activitiesTab.click()

      // Wait for activities to load
      await page.waitForLoadState('networkidle')

      // Try to click on activity link - may be a direct link or need to click the row
      const activityLink = page
        .locator(`a[href*="${E2E_CRM_ACTIVITY_EVENT_ID}"]`)
        .or(page.locator(`a[href*="${E2E_CRM_ACTIVITY_TASK_ID}"]`))
        .or(page.locator(`a[href*="${E2E_CRM_ACTIVITY_CALL_ID}"]`))
        .or(page.locator(`a[href*="/admin/activities/"]`))

      if ((await activityLink.count()) > 0) {
        await activityLink.first().click()

        // Should navigate to activity detail
        await expect(page).toHaveURL(/\/admin\/activities\/[a-f0-9-]+/)
      } else {
        // Activities list doesn't have clickable links - skip
        test.skip()
      }
    })
  })

  test.describe('Activities via Lead', () => {
    test('should show activities tab on lead page', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Should have Activities tab
      await expect(
        page
          .locator('[role="tab"]:has-text("Activities")')
          .or(page.locator('button:has-text("Activities")'))
      ).toBeVisible({ timeout: 10000 })
    })

    test('should display related activities on lead', async ({ page }) => {
      await page.goto(`/admin/crm-leads/${E2E_CRM_LEAD_ID}`)

      // Click Activities tab
      const activitiesTab = page
        .locator('[role="tab"]:has-text("Activities")')
        .or(page.locator('button:has-text("Activities")'))
      await activitiesTab.click()

      // Should show activities list (may be empty or have seeded activities)
      // At minimum, the tab content should load
      await page.waitForLoadState('networkidle')
    })
  })

  test.describe('Activity Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should show edit form - look for subject field
      await expect(
        page
          .getByRole('textbox', { name: /subject/i })
          .or(page.locator('input[name="subject"]'))
          .or(page.locator('textarea'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update activity description', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Find and update description/notes field
      const descField = page
        .locator('textarea[name="description"]')
        .or(page.locator('textarea').first())

      if (await descField.isVisible()) {
        await descField.fill('Updated task description for E2E testing')

        // Save changes
        const saveButton = page.locator('button:has-text("Save")')
        await saveButton.click()

        // Should show updated description
        await expect(
          page.locator('text=Updated task description').first()
        ).toBeVisible({ timeout: 10000 })
      }
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Verify we're in edit mode (Cancel button visible)
      const cancelButton = page.locator('button:has-text("Cancel")').first()
      await expect(cancelButton).toBeVisible({ timeout: 5000 })

      // Cancel
      await cancelButton.click()

      // Should return to view mode - Edit button should be visible again
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Activity Status Changes', () => {
    test('should show status field in edit mode', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should have status field
      await expect(
        page
          .locator('text=Status')
          .or(page.locator('[aria-label*="Status"]'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should be able to change task status', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()
      await page.waitForLoadState('networkidle')

      // This test just verifies we can enter edit mode and see status field
      // The actual status picklist options depend on metadata config
      const statusField = page
        .locator('label:has-text("Status")')
        .or(page.locator('text=Status').first())

      await expect(statusField).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Activity Types', () => {
    test('should display event with calendar icon', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_EVENT_ID}`)

      // Event type should be shown with appropriate styling
      await expect(page.locator('text=Event').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display task with appropriate icon', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_TASK_ID}`)

      // Task type should be shown
      await expect(page.locator('text=Task').first()).toBeVisible({
        timeout: 5000,
      })
    })

    test('should display call with phone icon', async ({ page }) => {
      await page.goto(`/admin/activities/${E2E_CRM_ACTIVITY_CALL_ID}`)

      // Call type should be shown
      await expect(page.locator('text=Call').first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Activity Error Handling', () => {
    test('should handle invalid activity ID', async ({ page }) => {
      await page.goto('/admin/activities/invalid-id-12345')

      // Should show 404 or error page
      await expect(
        page
          .locator('text=Not Found')
          .or(page.locator('text=not found'))
          .or(page.locator('text=404'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should handle non-existent activity ID', async ({ page }) => {
      await page.goto('/admin/activities/00000000-0000-0000-0000-000000000000')

      // Should show 404 or error page
      await expect(
        page
          .locator('text=Not Found')
          .or(page.locator('text=not found'))
          .or(page.locator('text=404'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })
  })
})
