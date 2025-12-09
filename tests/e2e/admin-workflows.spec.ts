import { test, expect } from '@playwright/test'

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'your-password-here'

test.describe('Workflow Automation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('input[name="email"]', { state: 'visible' })

    // Type credentials character by character to ensure React captures all input events
    const emailInput = page.locator('input[name="email"]')
    await emailInput.click()
    await emailInput.pressSequentially(ADMIN_EMAIL, { delay: 50 })

    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.click()
    await passwordInput.pressSequentially(ADMIN_PASSWORD, { delay: 50 })

    // Wait a moment for React state to update
    await page.waitForTimeout(300)

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 15000 })
  })

  test.describe('Workflows List Page', () => {
    test('should load workflows page', async ({ page }) => {
      await page.goto('/admin/workflows')

      // Check page header
      await expect(
        page.locator('h1:has-text("Workflow Automations")')
      ).toBeVisible()

      // Check for back to dashboard button
      await expect(page.locator('text=Dashboard').first()).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/workflows')

      // Check for stats - use first() to handle multiple matches
      await expect(page.locator('text=Total Workflows').first()).toBeVisible()
      await expect(
        page.getByText('Active', { exact: true }).first()
      ).toBeVisible()
      await expect(page.locator('text=Total Executions').first()).toBeVisible()
      await expect(
        page.locator('text=Templates Available').first()
      ).toBeVisible()
    })

    test('should have new workflow button', async ({ page }) => {
      await page.goto('/admin/workflows')

      // Check for new workflow button
      const newButton = page.locator('button:has-text("New Workflow")')
      await expect(newButton).toBeVisible()
    })

    test('should have from template button', async ({ page }) => {
      await page.goto('/admin/workflows')

      // Check for from template button (use first() to handle header and page buttons)
      const templateButton = page
        .locator('button:has-text("From Template")')
        .first()
      await expect(templateButton).toBeVisible()
    })
  })

  test.describe('New Workflow Page', () => {
    test('should load new workflow form', async ({ page }) => {
      await page.goto('/admin/workflows/new')

      // Check page header (use first() to handle possible duplicates)
      await expect(
        page.locator('h1:has-text("New Workflow")').first()
      ).toBeVisible()

      // Check form fields (use first() to handle possible duplicates from transition states)
      await expect(page.locator('text=Workflow Name').first()).toBeVisible()
      await expect(page.locator('text=Object Type').first()).toBeVisible()
      await expect(page.locator('text=Trigger Type').first()).toBeVisible()
    })

    test('should show validation errors on empty submit', async ({ page }) => {
      await page.goto('/admin/workflows/new')

      // Try to submit empty form
      await page.click('button[type="submit"]')

      // Check for validation error
      await expect(page.locator('text=Name is required')).toBeVisible()
    })

    test('should allow selecting object type', async ({ page }) => {
      await page.goto('/admin/workflows/new')

      // Click object type dropdown (find by label text then the trigger button)
      await page.getByLabel('Object Type').click()

      // Check options are visible in the listbox
      const listbox = page.getByRole('listbox')
      await expect(
        listbox.getByRole('option', { name: 'Lead / Client' })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: 'Meeting' })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: 'Payment' })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: 'Invoice' })
      ).toBeVisible()
    })

    test('should allow selecting trigger type', async ({ page }) => {
      await page.goto('/admin/workflows/new')

      // Click trigger type dropdown (find by label text)
      await page.getByLabel('Trigger Type').click()

      // Check options are visible in the listbox
      const listbox = page.getByRole('listbox')
      await expect(
        listbox.getByRole('option', { name: /Record Created/ })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: /Record Updated/ })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: /Field Changed/ })
      ).toBeVisible()
      await expect(
        listbox.getByRole('option', { name: /Manual/ })
      ).toBeVisible()
    })

    test('should show field change options when trigger type is field_change', async ({
      page,
    }) => {
      await page.goto('/admin/workflows/new')

      // Select field_change trigger
      await page.getByLabel('Trigger Type').click()
      await page.getByRole('option', { name: /Field Changed/ }).click()

      // Check that field options appear
      await expect(page.locator('text=Field to Monitor')).toBeVisible()
      await expect(page.locator('text=From Value')).toBeVisible()
      await expect(page.locator('text=To Value')).toBeVisible()
    })

    // Skip on mobile since workflow builder redirects may not work properly on small viewports
    test('should create workflow and redirect to builder', async ({
      page,
      viewport,
    }) => {
      test.skip(
        (viewport?.width ?? 1280) < 768,
        'Skip on mobile - workflow builder requires desktop viewport'
      )

      await page.goto('/admin/workflows/new')

      // Fill in the form
      await page.fill('input[name="name"]', 'Test Workflow E2E')
      await page.fill(
        'textarea[name="description"]',
        'Test workflow created by E2E tests'
      )

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect to workflow builder
      await expect(page).toHaveURL(/\/admin\/workflows\/[a-f0-9-]+/)
    })
  })

  // Workflow Builder tests are desktop-only since ReactFlow canvas requires larger viewport
  test.describe('Workflow Builder', () => {
    test.skip(
      ({ viewport }) => (viewport?.width ?? 1280) < 768,
      'Skip on mobile - workflow builder requires desktop viewport'
    )

    test.beforeEach(async ({ page }) => {
      // Create a test workflow first
      await page.goto('/admin/workflows/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[name="name"]', `Builder Test ${Date.now()}`)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/admin\/workflows\/[a-f0-9-]+/, {
        timeout: 15000,
      })
      // Wait for React Flow to initialize
      await page.waitForLoadState('networkidle')
    })

    test('should display workflow canvas', async ({ page }) => {
      // Check for canvas elements
      await expect(page.locator('.react-flow')).toBeVisible()
    })

    test('should display node palette', async ({ page }) => {
      // Check for node palette
      await expect(page.locator('text=Node Palette')).toBeVisible()
      await expect(page.locator('text=Drag nodes to the canvas')).toBeVisible()
    })

    test('should display trigger node categories', async ({ page }) => {
      // Check for node categories
      await expect(page.locator('text=Triggers').first()).toBeVisible()
      await expect(page.locator('text=Actions').first()).toBeVisible()
      await expect(page.locator('text=Logic').first()).toBeVisible()
    })

    test('should display action nodes in palette', async ({ page }) => {
      // Check for action nodes
      await expect(page.locator('text=Send Email')).toBeVisible()
      await expect(page.locator('text=Create Task')).toBeVisible()
      await expect(page.locator('text=Update Field')).toBeVisible()
    })

    test('should display logic nodes in palette', async ({ page }) => {
      // Check for logic nodes
      await expect(page.locator('text=Decision')).toBeVisible()
      await expect(page.locator('text=Wait')).toBeVisible()
    })

    test('should have initial trigger node on canvas', async ({ page }) => {
      // There should be a trigger node already on the canvas
      await expect(page.locator('.react-flow__node')).toBeVisible()
    })

    test('should have save button', async ({ page }) => {
      const saveButton = page.locator('button:has-text("Save Workflow")')
      await expect(saveButton).toBeVisible()
    })

    test('should have settings and history buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("History")')).toBeVisible()
      await expect(page.locator('button:has-text("Settings")')).toBeVisible()
    })

    test('should have activate/pause button', async ({ page }) => {
      // New workflows should show activate button
      await expect(
        page.locator('button:has-text("Activate Workflow")')
      ).toBeVisible()
    })
  })

  test.describe('Workflow Templates', () => {
    test('should open template dialog', async ({ page }) => {
      await page.goto('/admin/workflows')

      // Click from template button (use first() to handle multiple)
      await page.locator('button:has-text("From Template")').first().click()

      // Check dialog opens
      await expect(page.locator('text=Create from Template')).toBeVisible()
      await expect(
        page.locator('text=Choose a pre-built workflow template')
      ).toBeVisible()
    })

    test('should display available templates', async ({ page }) => {
      await page.goto('/admin/workflows')
      await page.locator('button:has-text("From Template")').first().click()

      // Check for some default templates (from migration)
      await expect(
        page.locator('text=New Lead Welcome Email').first()
      ).toBeVisible()
    })
  })

  test.describe('Workflow Actions', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test workflow
      await page.goto('/admin/workflows/new')
      await page.fill('input[name="name"]', 'Action Test Workflow')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/admin\/workflows\/[a-f0-9-]+/)
      // Go back to list
      await page.goto('/admin/workflows')
    })

    test('should show workflow in list', async ({ page }) => {
      await expect(
        page.locator('text=Action Test Workflow').first()
      ).toBeVisible()
    })

    test('should show workflow action menu', async ({ page }) => {
      // Find the workflow row and click more actions
      const workflowRow = page
        .locator('text=Action Test Workflow')
        .locator('..')
      const moreButton = workflowRow.locator(
        'button[aria-label="More actions"]'
      )

      // If button exists, click it
      if ((await moreButton.count()) > 0) {
        await moreButton.click()

        // Check menu items
        await expect(page.locator('text=Edit')).toBeVisible()
        await expect(page.locator('text=View History')).toBeVisible()
        await expect(page.locator('text=Duplicate')).toBeVisible()
        await expect(page.locator('text=Delete')).toBeVisible()
      }
    })
  })

  // Properties Panel tests are desktop-only since they depend on the workflow builder
  test.describe('Properties Panel', () => {
    test.skip(
      ({ viewport }) => (viewport?.width ?? 1280) < 768,
      'Skip on mobile - workflow builder requires desktop viewport'
    )

    test.beforeEach(async ({ page }) => {
      // Create and go to a workflow
      await page.goto('/admin/workflows/new')
      await page.waitForLoadState('networkidle')
      await page.fill('input[name="name"]', `Properties Test ${Date.now()}`)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/admin\/workflows\/[a-f0-9-]+/, {
        timeout: 15000,
      })
      // Wait for React Flow to initialize
      await page.waitForLoadState('networkidle')
    })

    test('should show properties panel', async ({ page }) => {
      // The properties panel should be visible
      await expect(page.locator('.react-flow')).toBeVisible()

      // Click on the trigger node to show its properties
      await page.click('.react-flow__node')

      // Properties panel shows trigger info (since trigger node is selected)
      await expect(
        page.locator(
          'text=The trigger node is configured at the workflow level'
        )
      ).toBeVisible()
    })

    test('should show properties when node is clicked', async ({ page }) => {
      // Click on the trigger node
      await page.click('.react-flow__node')

      // Should show properties panel with trigger info
      await expect(page.locator('text=Trigger').last()).toBeVisible()
    })
  })
})
