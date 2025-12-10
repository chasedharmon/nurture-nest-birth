import { test, expect } from '@playwright/test'

test.describe('Admin Messages - Unified Messaging', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test.describe('Messages Page Navigation', () => {
    test('should navigate to messages page', async ({ page }) => {
      // Navigate directly to messages page
      await page.goto('/admin/messages')
      await expect(page).toHaveURL('/admin/messages')
      await expect(page.locator('h1:has-text("Messages")')).toBeVisible()
    })
  })

  test.describe('Messages Page Layout', () => {
    test('should display stats cards', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.waitForLoadState('networkidle')

      // Check stats cards
      await expect(
        page.locator('text=Active Conversations').first()
      ).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=Unread Messages').first()).toBeVisible({
        timeout: 10000,
      })
      await expect(page.locator('text=Archived').first()).toBeVisible({
        timeout: 10000,
      })
    })

    test('should display search input', async ({ page }) => {
      await page.goto('/admin/messages')

      // Check search input
      await expect(
        page.locator('input[placeholder="Search conversations..."]')
      ).toBeVisible()
    })

    test('should display tabs for Active and Archived', async ({ page }) => {
      await page.goto('/admin/messages')

      // Check tab links
      await expect(
        page.locator('a[href="/admin/messages?tab=active"]')
      ).toBeVisible()
      await expect(
        page.locator('a[href="/admin/messages?tab=archived"]')
      ).toBeVisible()
    })

    test('should display new conversation button', async ({ page }) => {
      await page.goto('/admin/messages')

      // Check new conversation button in header
      await expect(
        page.locator('header').locator('button:has-text("New Conversation")')
      ).toBeVisible()
    })

    test('should display back to dashboard link', async ({ page }) => {
      await page.goto('/admin/messages')

      // Check back link
      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible()
    })
  })

  test.describe('New Conversation Dialog', () => {
    test('should open new conversation dialog', async ({ page }) => {
      await page.goto('/admin/messages')

      // Click new conversation button
      await page.click('button:has-text("New Conversation")')

      // Check dialog appears
      await expect(page.locator('text=Start New Conversation')).toBeVisible()
      await expect(
        page.locator('text=Send a message to a client')
      ).toBeVisible()
    })

    test('should have client selection field', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Check client selection button
      await expect(
        page.locator('button:has-text("Select a client...")')
      ).toBeVisible()
    })

    test('should have subject field', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Check subject input
      await expect(page.locator('input#subject')).toBeVisible()
    })

    test('should have message textarea', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Check message textarea
      await expect(page.locator('textarea#message')).toBeVisible()
    })

    test('should have cancel and start buttons', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Check buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
      await expect(
        page.locator('button:has-text("Start Conversation")')
      ).toBeVisible()
    })

    test('should close dialog when cancel is clicked', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Click cancel
      await page.click('button:has-text("Cancel")')

      // Dialog should be closed
      await expect(
        page.locator('text=Start New Conversation')
      ).not.toBeVisible()
    })

    test('should disable start button without client selected', async ({
      page,
    }) => {
      await page.goto('/admin/messages')
      await page.click('button:has-text("New Conversation")')

      // Check start button is disabled
      const startButton = page.locator('button:has-text("Start Conversation")')
      await expect(startButton).toBeDisabled()
    })
  })

  test.describe('Tab Navigation', () => {
    test('should show active tab by default', async ({ page }) => {
      await page.goto('/admin/messages')

      // Active tab should be selected
      const activeTab = page.locator('a[href="/admin/messages?tab=active"]')
      await expect(activeTab).toHaveClass(/bg-background/)
    })

    test('should navigate to archived tab', async ({ page }) => {
      await page.goto('/admin/messages')
      await page.waitForLoadState('networkidle')

      // Click archived tab
      await page.click('a[href="/admin/messages?tab=archived"]')
      await expect(page).toHaveURL(/tab=archived/, { timeout: 10000 })
    })

    test('should navigate back to active tab', async ({ page }) => {
      await page.goto('/admin/messages?tab=archived')
      await page.waitForLoadState('networkidle')

      // Click active tab
      await page.click('a[href="/admin/messages?tab=active"]')
      await expect(page).toHaveURL(/tab=active/, { timeout: 10000 })
    })
  })

  test.describe('Empty States', () => {
    test('should display empty state when no conversations', async ({
      page,
    }) => {
      await page.goto('/admin/messages')

      // The page should show either conversations or empty state
      const conversationList = page.locator('[class*="space-y"]').filter({
        has: page.locator('a[href^="/admin/messages/"]'),
      })
      const emptyState = page.locator('text=No conversations')

      // One of these should be visible
      const hasConversations = await conversationList.count()
      if (hasConversations === 0) {
        await expect(emptyState).toBeVisible()
      }
    })

    test('should show start conversation button in empty state', async ({
      page,
    }) => {
      await page.goto('/admin/messages')

      const emptyState = page.locator('text=No conversations')
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      if (hasEmptyState) {
        // Should have at least one new conversation button visible
        await expect(
          page.locator('button:has-text("New Conversation")').first()
        ).toBeVisible()
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/admin/messages')

      // Check h1 exists
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      await expect(h1).toHaveText('Messages')
    })

    test('should have accessible search input', async ({ page }) => {
      await page.goto('/admin/messages')

      // Search input should have placeholder
      const searchInput = page.locator(
        'input[placeholder="Search conversations..."]'
      )
      await expect(searchInput).toBeVisible()
    })
  })
})

test.describe('Message Conversation Detail', () => {
  // Authentication is handled by Playwright setup project via storageState
  // Each test starts with a pre-authenticated session

  test('should display back to messages link on conversation page', async ({
    page,
  }) => {
    // First check if there are any conversations
    await page.goto('/admin/messages')

    // Check for any conversation links
    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()

    if (count > 0) {
      // Click first conversation
      await conversationLinks.first().click()

      // Should have back link
      await expect(page.locator('a:has-text("Messages")')).toBeVisible()
    }
  })
})
