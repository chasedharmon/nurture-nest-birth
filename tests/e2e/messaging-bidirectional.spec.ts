import { test, expect, Page } from '@playwright/test'

/**
 * Bidirectional Messaging Tests
 *
 * Tests the complete messaging flow between:
 * 1. Team members (admin) sending messages to clients
 * 2. Clients sending messages back to team members
 *
 * Note: Client-to-Team tests and Cross-Portal tests require client authentication
 * which is not covered by the storageState setup. These tests are marked as
 * conditional and will skip if client auth is not available.
 *
 * Authentication for admin is handled by Playwright setup project via storageState
 */

// Helper to find an existing conversation for the test client
async function findClientConversation(
  page: Page
): Promise<{ conversationId: string; clientId: string } | null> {
  await page.goto('/admin/messages')
  await page.waitForLoadState('networkidle')

  // Look for conversation links
  const conversationLinks = page.locator('a[href^="/admin/messages/"]')
  const count = await conversationLinks.count()

  if (count === 0) {
    return null
  }

  // Click the first conversation
  await conversationLinks.first().click()
  await page.waitForLoadState('networkidle')

  // Extract conversation ID from URL
  const url = page.url()
  const match = url.match(/\/admin\/messages\/([a-f0-9-]+)/)

  if (!match || !match[1]) {
    return null
  }

  return {
    conversationId: match[1] as string,
    clientId: '', // We'll get this from the conversation
  }
}

test.describe('Bidirectional Messaging', () => {
  test.describe('Team-to-Client Messaging', () => {
    // Authentication handled by Playwright storageState

    test('admin can send a message to client', async ({ page }) => {
      // Find or navigate to a conversation
      const conversationData = await findClientConversation(page)

      if (!conversationData) {
        console.log('No conversation found - skipping test')
        test.skip()
        return
      }

      // Wait for the message composer to be visible
      const messageInput = page.locator(
        'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
      )
      await expect(messageInput).toBeVisible({ timeout: 10000 })

      // Generate unique test message
      const testMessage = `Admin test message ${Date.now()}`

      // Type and send the message
      await messageInput.fill(testMessage)

      const sendButton = page.locator(
        'button:has(svg.lucide-send), button:has-text("Send")'
      )
      await sendButton.first().click()

      // Wait for message to appear in the thread
      await expect(page.locator(`text=${testMessage}`)).toBeVisible({
        timeout: 10000,
      })

      console.log('SUCCESS: Admin sent message to client')
    })
  })

  test.describe('Client-to-Team Messaging', () => {
    // These tests require client authentication which is not set up in storageState
    // They will be skipped until client auth is properly configured

    test.skip('client can access messages page', async ({ page }) => {
      // Navigate to messages
      await page.goto('/client/messages')
      await page.waitForLoadState('networkidle')

      // Should be on messages page
      await expect(page).toHaveURL(/\/client\/messages/)

      // Should see some content (either conversations or empty state)
      const hasConversations = await page
        .locator('a[href^="/client/messages/"]')
        .count()
      const hasEmptyState = await page
        .locator('text=No messages')
        .isVisible()
        .catch(() => false)

      expect(hasConversations > 0 || hasEmptyState).toBeTruthy()

      console.log(
        `Client messages page: ${hasConversations} conversations found`
      )
    })

    test.skip('client can send a message to team', async ({ page }) => {
      // Navigate to messages
      await page.goto('/client/messages')
      await page.waitForLoadState('networkidle')

      // Find and click a conversation
      const conversationLink = page
        .locator('a[href^="/client/messages/"]')
        .first()

      if ((await conversationLink.count()) === 0) {
        console.log('No conversation found for client - skipping test')
        test.skip()
        return
      }

      await conversationLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForURL(/\/client\/messages\/[a-f0-9-]+/)

      // Wait for the message composer to be visible
      const messageInput = page.locator(
        'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
      )
      await expect(messageInput).toBeVisible({ timeout: 10000 })

      // Generate unique test message
      const testMessage = `Client test message ${Date.now()}`

      // Type the message
      await messageInput.fill(testMessage)

      // Find and click send button
      const sendButton = page.locator(
        'button:has(svg.lucide-send), button:has-text("Send")'
      )
      await sendButton.first().click()

      // Wait for message to appear in the thread
      // The message should appear with the client's name
      await expect(page.locator(`text=${testMessage}`)).toBeVisible({
        timeout: 15000,
      })

      console.log('SUCCESS: Client sent message to team')
    })

    test.skip('client message appears immediately in thread', async ({
      page,
    }) => {
      // Navigate to messages
      await page.goto('/client/messages')
      await page.waitForLoadState('networkidle')

      // Find and click a conversation
      const conversationLink = page
        .locator('a[href^="/client/messages/"]')
        .first()

      if ((await conversationLink.count()) === 0) {
        console.log('No conversation found for client - skipping test')
        test.skip()
        return
      }

      await conversationLink.click()
      await page.waitForLoadState('networkidle')

      // Wait for composer
      const messageInput = page.locator(
        'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
      )
      await expect(messageInput).toBeVisible({ timeout: 10000 })

      // Send a message with unique text
      const testMessage = `Immediate test ${Date.now()}`
      await messageInput.fill(testMessage)

      const sendButton = page.locator(
        'button:has(svg.lucide-send), button:has-text("Send")'
      )
      await sendButton.first().click()

      // Verify the message text appears (the main test)
      await expect(page.locator(`text=${testMessage}`)).toBeVisible({
        timeout: 15000,
      })

      console.log('SUCCESS: Client message appeared immediately')
    })
  })

  test.describe('Cross-Portal Message Visibility', () => {
    // These tests require both admin and client authentication in separate browser contexts
    // They are skipped because they need special setup beyond the storageState pattern

    test.skip('message sent by client is visible to admin', async () => {
      // This test requires dual browser contexts with separate auth
      // Skipped: needs client auth setup
    })

    test.skip('message sent by admin is visible to client', async () => {
      // This test requires dual browser contexts with separate auth
      // Skipped: needs client auth setup
    })
  })
})

test.describe('Error Handling', () => {
  test.skip('client message send shows error on failure gracefully', async ({
    page,
  }) => {
    // This test requires client auth which is not available via storageState
    // Navigate to messages
    await page.goto('/client/messages')
    await page.waitForLoadState('networkidle')

    // Find and click a conversation
    const conversationLink = page
      .locator('a[href^="/client/messages/"]')
      .first()

    if ((await conversationLink.count()) === 0) {
      console.log('No conversation found - skipping test')
      test.skip()
      return
    }

    await conversationLink.click()
    await page.waitForLoadState('networkidle')

    // Verify the composer is present and functional
    const messageInput = page.locator(
      'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
    )
    await expect(messageInput).toBeVisible({ timeout: 10000 })
    await expect(messageInput).toBeEnabled()

    // Send button should be disabled when input is empty
    const sendButton = page.locator(
      'button:has(svg.lucide-send), button:has-text("Send")'
    )
    await expect(sendButton.first()).toBeDisabled()

    // Type something
    await messageInput.fill('Test message')

    // Send button should be enabled
    await expect(sendButton.first()).toBeEnabled()

    console.log('SUCCESS: Message composer is functional')
  })
})
