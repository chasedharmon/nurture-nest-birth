import { test, expect } from '@playwright/test'

/**
 * Admin Navigation System E2E Tests (Phase 11)
 *
 * Tests the following navigation features:
 * - Shared layout with header
 * - Logo/brand name clickable to dashboard
 * - Object tabs (Accounts, Contacts, etc.)
 * - Tools menu (Messages, Reports, etc.)
 * - User/Account menu (Team, Setup, Sign Out)
 * - Breadcrumb navigation
 * - Mobile navigation drawer
 * - Active state highlighting
 */

test.describe('Admin Navigation System', () => {
  // Authentication is handled by Playwright setup project via storageState

  test.describe('Desktop Navigation Header', () => {
    test('should display header with navigation elements', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Header should be visible
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Should have a clickable link to dashboard
      const brandLink = header.locator('a[href="/admin"]').first()
      await expect(brandLink).toBeVisible()
    })

    test('should navigate to dashboard when clicking brand/logo', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      // Start on a different page
      await page.goto('/admin/accounts')
      await expect(page).toHaveURL('/admin/accounts')

      // Click the brand/logo link in header
      const header = page.locator('header')
      const brandLink = header.locator('a[href="/admin"]').first()
      await brandLink.click()

      await expect(page).toHaveURL('/admin')
    })

    test('should display object tabs in navigation', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Check for main CRM object tabs in header
      const header = page.locator('header')

      // At minimum, should have Accounts and Contacts links
      await expect(header.getByText('Accounts')).toBeVisible()
      await expect(header.getByText('Contacts')).toBeVisible()
    })

    test('should navigate between object tabs', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      const header = page.locator('header')

      // Click on Accounts
      await header.getByText('Accounts').click()
      await expect(page).toHaveURL('/admin/accounts')

      // Click on Contacts
      await header.getByText('Contacts').click()
      await expect(page).toHaveURL('/admin/contacts')
    })
  })

  test.describe('Tools Menu', () => {
    test('should open tools menu dropdown', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Find and click Tools button (contains "Tools" text)
      const toolsButton = page.locator('header button:has-text("Tools")')
      await toolsButton.click()

      // Should show menu items - Messages and Reports should be in tools
      await expect(page.getByText('Messages')).toBeVisible()
      await expect(page.getByText('Reports')).toBeVisible()
    })

    test('should navigate to Messages from Tools menu', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Open Tools menu
      const toolsButton = page.locator('header button:has-text("Tools")')
      await toolsButton.click()

      // Click Messages link in dropdown
      const messagesLink = page
        .getByRole('menuitem')
        .filter({ hasText: 'Messages' })
      await messagesLink.click()

      await expect(page).toHaveURL('/admin/messages')
    })

    test('should navigate to Reports from Tools menu', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Open Tools menu
      const toolsButton = page.locator('header button:has-text("Tools")')
      await toolsButton.click()

      // Click Reports link in dropdown
      const reportsLink = page
        .getByRole('menuitem')
        .filter({ hasText: 'Reports' })
      await reportsLink.click()

      await expect(page).toHaveURL('/admin/reports')
    })
  })

  test.describe('Account/User Menu', () => {
    test('should open account menu dropdown', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      // Find and click Account button (the user menu trigger)
      const accountButton = page.locator('header button:has-text("Account")')
      await accountButton.click()

      // Should show menu items
      await expect(page.getByText('Team')).toBeVisible()
      await expect(page.getByText('Setup')).toBeVisible()
      await expect(page.getByText('Sign Out')).toBeVisible()
    })

    test('should navigate to Team from Account menu', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      const accountButton = page.locator('header button:has-text("Account")')
      await accountButton.click()

      const teamLink = page.getByRole('menuitem').filter({ hasText: 'Team' })
      await teamLink.click()

      await expect(page).toHaveURL('/admin/team')
    })

    test('should navigate to Setup from Account menu', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only test')

      await page.goto('/admin')

      const accountButton = page.locator('header button:has-text("Account")')
      await accountButton.click()

      const setupLink = page.getByRole('menuitem').filter({ hasText: 'Setup' })
      await setupLink.click()

      await expect(page).toHaveURL('/admin/setup')
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should show hamburger menu on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')

      await page.goto('/admin')

      // Hamburger menu button should be visible
      const menuButton = page.getByRole('button', {
        name: /open navigation menu/i,
      })
      await expect(menuButton).toBeVisible()
    })

    test('should open mobile drawer when clicking menu button', async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'Mobile-only test')

      await page.goto('/admin')

      // Click hamburger menu
      const menuButton = page.getByRole('button', {
        name: /open navigation menu/i,
      })
      await menuButton.click()

      // Sheet/drawer should be visible with navigation sections
      await expect(page.getByText('CRM')).toBeVisible()
      await expect(page.getByText('Tools')).toBeVisible()
      await expect(page.getByText('Admin')).toBeVisible()
    })

    test('should navigate from mobile menu', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test')

      await page.goto('/admin')

      // Open mobile menu
      const menuButton = page.getByRole('button', {
        name: /open navigation menu/i,
      })
      await menuButton.click()

      // Click on Accounts link in mobile menu
      const accountsLink = page.locator(
        '[role="dialog"] a[href="/admin/accounts"]'
      )
      await accountsLink.click()

      await expect(page).toHaveURL('/admin/accounts')
    })

    test('should show brand name in mobile header', async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'Mobile-only test')

      await page.goto('/admin')

      // Brand name should be visible in mobile header
      const header = page.locator('header')
      const mobileBrand = header.locator('a[href="/admin"]')
      await expect(mobileBrand).toBeVisible()
    })

    test('should have Sign Out button in mobile drawer', async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'Mobile-only test')

      await page.goto('/admin')

      // Open mobile menu
      const menuButton = page.getByRole('button', {
        name: /open navigation menu/i,
      })
      await menuButton.click()

      // Sign Out button should be visible at bottom
      const signOutButton = page.getByRole('button', { name: /sign out/i })
      await expect(signOutButton).toBeVisible()
    })
  })

  test.describe('Breadcrumb Navigation', () => {
    test('should not show breadcrumbs on dashboard', async ({ page }) => {
      await page.goto('/admin')

      // Dashboard (root level) should not have visible breadcrumbs
      // The breadcrumb component returns null when crumbs.length <= 1
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Breadcrumb nav should either not exist or be empty (no visible content)
      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      const breadcrumbCount = await breadcrumbNav.count()

      if (breadcrumbCount > 0) {
        // If it exists, it should have no list items (or very minimal)
        const listItems = breadcrumbNav.locator('li')
        const itemCount = await listItems.count()
        expect(itemCount).toBeLessThanOrEqual(1)
      }
    })

    test('should show breadcrumbs on list pages', async ({ page }) => {
      await page.goto('/admin/accounts')

      // Should have breadcrumb navigation
      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      await expect(breadcrumbNav).toBeVisible()

      // Should show "Accounts" in the breadcrumb trail
      await expect(breadcrumbNav.getByText('Accounts')).toBeVisible()
    })

    test('should navigate back via breadcrumb home link', async ({ page }) => {
      await page.goto('/admin/accounts')

      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      await expect(breadcrumbNav).toBeVisible()

      // Click on Dashboard/Home link in breadcrumb (may be icon or text)
      const homeLink = breadcrumbNav.locator('a[href="/admin"]')
      await homeLink.click()

      await expect(page).toHaveURL('/admin')
    })

    test('should show nested breadcrumbs on detail pages', async ({ page }) => {
      // Navigate to accounts list first
      await page.goto('/admin/accounts')

      // If there are accounts, click on the first one
      const accountRow = page.locator('[data-testid="record-row"] a').first()
      const hasAccounts = (await accountRow.count()) > 0

      if (hasAccounts) {
        await accountRow.click()

        // Wait for detail page
        await page.waitForURL(/\/admin\/accounts\/[^/]+$/)

        // Should have breadcrumb showing path
        const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
        await expect(breadcrumbNav).toBeVisible()

        // Should have link back to Accounts list
        const accountsLink = breadcrumbNav.locator('a[href="/admin/accounts"]')
        await expect(accountsLink).toBeVisible()
      }
    })

    test('should mark current page in breadcrumb', async ({ page }) => {
      await page.goto('/admin/accounts')

      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      await expect(breadcrumbNav).toBeVisible()

      // Current page should have aria-current="page"
      const currentPage = breadcrumbNav.locator('[aria-current="page"]')
      await expect(currentPage).toBeVisible()
      await expect(currentPage).toHaveText('Accounts')
    })
  })

  test.describe('Custom Object Routes', () => {
    test('should handle navigation to setup pages', async ({ page }) => {
      await page.goto('/admin/setup')

      // Setup page should load with header
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Should have breadcrumbs showing Setup
      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      await expect(breadcrumbNav).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have header element', async ({ page }) => {
      await page.goto('/admin')

      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('should have proper breadcrumb aria-label on subpages', async ({
      page,
    }) => {
      await page.goto('/admin/accounts')

      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      await expect(breadcrumbNav).toBeVisible()
    })

    test('should indicate current page with aria-current in breadcrumbs', async ({
      page,
    }) => {
      await page.goto('/admin/accounts')

      const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
      const currentPage = breadcrumbNav.locator('[aria-current="page"]')

      await expect(currentPage).toBeVisible()
    })
  })

  test.describe('Dashboard Content', () => {
    test('should load admin dashboard content', async ({ page }) => {
      await page.goto('/admin')
      await expect(page).toHaveURL('/admin')

      // Dashboard should have main content area visible
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()
    })
  })
})
