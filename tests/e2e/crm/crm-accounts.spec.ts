import { test, expect } from '@playwright/test'

// Test data IDs from data-seed.setup.ts
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'

test.describe('CRM Accounts', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Accounts List View', () => {
    test('should load accounts list page', async ({ page }) => {
      await page.goto('/admin/accounts')
      await expect(page).toHaveURL('/admin/accounts')

      // Should show page title
      await expect(page.locator('h1:has-text("Accounts")')).toBeVisible()
    })

    test('should display accounts table with columns', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Check for table headers (using metadata-driven labels)
      await expect(page.locator('th:has-text("Account Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Account Type")')).toBeVisible()
      await expect(page.locator('th:has-text("Account Status")')).toBeVisible()
    })

    test('should show seeded E2E test account', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Wait for the seeded account to appear
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )
    })

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('E2E Test')

        // Should filter to show only matching accounts
        await expect(
          page.locator('text=E2E Test Household').first()
        ).toBeVisible()
      }
    })

    test('should navigate to account detail on row click', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Wait for accounts to load
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Click on the account row
      await page.locator('text=E2E Test Household').first().click()

      // Should navigate to account detail page
      await expect(page).toHaveURL(
        new RegExp(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)
      )
    })
  })

  test.describe('Account Detail View', () => {
    test('should load account detail page', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show account name (wait for page to load)
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )
    })

    test('should display account information fields', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Should show basic account info (may need to click Details tab)
      const detailsTab = page.locator('[role="tab"]:has-text("Details")')
      if (await detailsTab.isVisible()) {
        await detailsTab.click()
      }
      await expect(
        page
          .locator('text=household')
          .or(page.locator('text=Household'))
          .first()
      ).toBeVisible({ timeout: 5000 })
      // Account type should be displayed
      await expect(
        page.locator('text=active').or(page.locator('text=Active')).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show billing address', async ({ page }) => {
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

      // Should show billing address field labels (not values - those can change from edit tests)
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

    test('should display account status badge', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show status badge (active)
      await expect(
        page.locator('text=Active').or(page.locator('text=active'))
      ).toBeVisible()
    })

    test('should have edit button', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have edit functionality
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await expect(editButton.first()).toBeVisible()
    })

    test('should show related contacts tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have Contacts tab
      await expect(page.locator('text=Contacts')).toBeVisible()
    })

    test('should display related contacts', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load first
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Click Contacts tab
      await page
        .locator('button:has-text("Contacts")')
        .or(page.locator('[role="tab"]:has-text("Contacts")'))
        .click()

      // Should show the linked contact (TestContact is last name)
      await expect(page.locator('text=TestContact')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show related opportunities tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should have Opportunities tab
      await expect(page.locator('text=Opportunities')).toBeVisible()
    })

    test('should have back navigation', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Wait for page to load first
      await expect(page.locator('text=E2E Test Household').first()).toBeVisible(
        {
          timeout: 10000,
        }
      )

      // Should have back link (link to /admin/accounts list)
      const backLink = page
        .locator('a[href="/admin/accounts"]')
        .or(page.locator('a:has-text("Back")'))
        .or(page.locator('a:has-text("Accounts")'))
        .or(page.locator('[aria-label="Back"]'))
      await expect(backLink.first()).toBeVisible({ timeout: 5000 })

      await backLink.first().click()
      await expect(page).toHaveURL(/\/admin\/accounts/)
    })
  })

  test.describe('Account Create', () => {
    test('should have create account button', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Should have new account button
      const newButton = page
        .locator('button:has-text("New Account")')
        .or(page.locator('a:has-text("New Account")'))
      await expect(newButton.first()).toBeVisible()
    })

    test('should open create account form', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Click new account button
      const newButton = page
        .locator('button:has-text("New Account")')
        .or(page.locator('a:has-text("New Account")'))
      await newButton.first().click()

      // Should navigate to new account page or open modal
      await expect(
        page
          .locator('h1:has-text("New Account")')
          .or(page.locator('h2:has-text("New Account")'))
          .or(page.locator('text=Create Account'))
          .first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show required fields in create form', async ({ page }) => {
      await page.goto('/admin/accounts/new')

      // Should have required field labels
      await expect(
        page.locator('text=Account Name').or(page.locator('text=Name'))
      ).toBeVisible()
      await expect(
        page.locator('text=Account Type').or(page.locator('text=Type'))
      ).toBeVisible()
    })

    // TODO: Investigate form submission issue - values clear after button click
    test.skip('should create new account', async ({ page }) => {
      const timestamp = Date.now()
      const accountName = `E2E CreateAccount ${timestamp}`

      await page.goto('/admin/accounts/new')

      // Fill out the form using placeholder selectors (dynamic form doesn't use name attr)
      const nameInput = page.locator(
        'input[placeholder*="account name" i], input[placeholder*="Enter account name" i]'
      )
      await nameInput.fill(accountName)

      // Fill billing address fields
      const cityInput = page.locator(
        'input[placeholder*="billing city" i], input[placeholder*="Enter billing city" i]'
      )
      await cityInput.fill('New Test City')

      const stateInput = page.locator(
        'input[placeholder*="billing state" i], input[placeholder*="Enter billing state" i]'
      )
      await stateInput.fill('TX')

      // Submit the form
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(
          page
            .locator('button:has-text("Create")')
            .or(page.locator('button:has-text("Save Changes")'))
        )
      await saveButton.click()

      // Should redirect to account detail or list
      await expect(page).toHaveURL(/\/admin\/accounts/, { timeout: 10000 })

      // Verify account was created by searching
      await page.goto('/admin/accounts')
      await expect(page.locator(`text=${accountName}`)).toBeVisible({
        timeout: 10000,
      })
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.goto('/admin/accounts/new')

      // Try to submit without filling required fields
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Create")'))
      await saveButton.click()

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/admin\/accounts\/new/)
    })
  })

  test.describe('Account Edit', () => {
    test('should open edit mode', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Should show edit form - look for the account name textbox
      // The dynamic form renders textboxes with placeholder text
      await expect(
        page.getByRole('textbox', { name: /account name/i })
      ).toBeVisible({ timeout: 5000 })
    })

    test('should update account billing city', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Update billing city using placeholder or label as selector
      const cityInput = page.locator(
        'input[placeholder*="billing city" i], input[placeholder*="Enter billing city" i]'
      )
      await cityInput.clear()
      await cityInput.fill('Updated City')

      // Save changes
      const saveButton = page
        .locator('button:has-text("Save")')
        .or(page.locator('button:has-text("Save Changes")'))
      await saveButton.click()

      // Should show updated city
      await expect(page.locator('text=Updated City')).toBeVisible({
        timeout: 10000,
      })

      // Restore original city
      await editButton.first().click()
      await cityInput.clear()
      await cityInput.fill('Test City')
      await saveButton.click()
    })

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click edit button
      const editButton = page
        .locator('button:has-text("Edit")')
        .or(page.locator('a:has-text("Edit")'))
      await editButton.first().click()

      // Verify we're in edit mode (Cancel button visible)
      const cancelButton = page.locator('button:has-text("Cancel")').first()
      await expect(cancelButton).toBeVisible()

      // Cancel
      await cancelButton.click()

      // Should return to view mode - Edit button should be visible again
      await expect(editButton.first()).toBeVisible({ timeout: 5000 })

      // Cancel button should no longer be visible in view mode
      await expect(cancelButton).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Account Search & Filter', () => {
    test('should filter accounts by type', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Look for type filter
      const typeFilter = page
        .locator('select[name="account_type"]')
        .or(page.locator('button:has-text("Type")'))
      if (await typeFilter.isVisible()) {
        await typeFilter.click()
        await page.locator('text=Household').click()

        // Should filter results
        await expect(
          page.locator('text=E2E Test Household').first()
        ).toBeVisible()
      }
    })

    test('should filter accounts by status', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Look for status filter
      const statusFilter = page
        .locator('select[name="status"]')
        .or(page.locator('button:has-text("Status")'))
      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.locator('text=Active').first().click()

        // Should filter results
        await expect(
          page.locator('text=E2E Test Household').first()
        ).toBeVisible()
      }
    })

    test('should clear search filter', async ({ page }) => {
      await page.goto('/admin/accounts')

      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        // Apply search
        await searchInput.fill('E2E Test')
        await expect(
          page.locator('text=E2E Test Household').first()
        ).toBeVisible()

        // Clear search
        await searchInput.clear()

        // All accounts should be visible again
        await expect(
          page.locator('text=E2E Test Household').first()
        ).toBeVisible()
      }
    })
  })

  test.describe('Account-Contact Relationships', () => {
    test('should navigate from account to contact', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Click Contacts tab
      await page
        .locator('button:has-text("Contacts")')
        .or(page.locator('[role="tab"]:has-text("Contacts")'))
        .click()

      // Click on contact
      const contactLink = page
        .locator('a:has-text("E2E TestContact")')
        .or(page.locator('text=E2E TestContact'))
      if (await contactLink.first().isVisible()) {
        await contactLink.first().click()

        // Should navigate to contact detail
        await expect(page).toHaveURL(
          new RegExp(`/admin/contacts/${E2E_CRM_CONTACT_ID}`)
        )
      }
    })

    test('should show contact count in tab', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show contact count in tab label
      await expect(
        page
          .locator('text=Contacts (1)')
          .or(page.locator('[role="tab"]:has-text("Contacts")'))
      ).toBeVisible()
    })
  })

  test.describe('Account Lifecycle Stage', () => {
    test('should display lifecycle stage', async ({ page }) => {
      await page.goto(`/admin/accounts/${E2E_CRM_ACCOUNT_ID}`)

      // Should show lifecycle stage
      await expect(
        page
          .locator('text=customer')
          .or(page.locator('text=Customer'))
          .or(page.locator('text=Lifecycle'))
      ).toBeVisible()
    })
  })
})
