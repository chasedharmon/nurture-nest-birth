import { test, expect, Page } from '@playwright/test'
import path from 'path'

/**
 * Bidirectional Messaging Tests
 *
 * Tests the complete messaging flow between:
 * 1. Team members (admin) sending messages to clients
 * 2. Clients sending messages back to team members
 *
 * Authentication:
 * - Admin tests use the default storageState from playwright.config.ts
 * - Client tests explicitly load the client.json storage state
 * - Cross-portal tests create separate browser contexts for admin and client
 */

const CLIENT_AUTH_FILE = path.join(process.cwd(), 'tests/e2e/.auth/client.json')
const ADMIN_AUTH_FILE = path.join(process.cwd(), 'tests/e2e/.auth/admin.json')

// Helper to find an existing conversation from the admin messages page
async function findAdminConversation(
  page: Page
): Promise<{ conversationId: string } | null> {
  await page.goto('/admin/messages')
  await page.waitForLoadState('networkidle')

  // Look for conversation links
  const conversationLinks = page.locator('a[href^="/admin/messages/"]')
  const count = await conversationLinks.count()

  if (count === 0) {
    return null
  }

  // Get the href directly to navigate (more reliable than clicking)
  const href = await conversationLinks.first().getAttribute('href')
  if (!href) {
    return null
  }

  await page.goto(href)
  await page.waitForLoadState('networkidle')

  // Extract conversation ID from URL
  const url = page.url()
  const match = url.match(/\/admin\/messages\/([a-f0-9-]+)/)

  if (!match || !match[1]) {
    return null
  }

  return {
    conversationId: match[1] as string,
  }
}

// Helper to find an existing conversation from the client messages page
async function findClientConversation(
  page: Page
): Promise<{ conversationId: string } | null> {
  await page.goto('/client/messages')
  await page.waitForLoadState('networkidle')

  // Look for conversation links
  const conversationLinks = page.locator('a[href^="/client/messages/"]')
  const count = await conversationLinks.count()

  if (count === 0) {
    return null
  }

  // Get the href directly to navigate (more reliable than clicking)
  const href = await conversationLinks.first().getAttribute('href')
  if (!href) {
    return null
  }

  await page.goto(href)
  await page.waitForLoadState('networkidle')

  // Extract conversation ID from URL
  const url = page.url()
  const match = url.match(/\/client\/messages\/([a-f0-9-]+)/)

  if (!match || !match[1]) {
    return null
  }

  return {
    conversationId: match[1] as string,
  }
}

test.describe('Bidirectional Messaging', () => {
  test.describe('Team-to-Client Messaging', () => {
    // Authentication handled by Playwright storageState

    test('admin can send a message to client', async ({ page }) => {
      // Find or navigate to a conversation from admin view
      const conversationData = await findAdminConversation(page)

      expect(
        conversationData,
        'No conversation found - check data seeding'
      ).toBeTruthy()

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
    // These tests use client authentication via a separate browser context
    // This allows us to test client messaging in the same file as admin messaging

    test('client can access messages page', async ({ browser }) => {
      // Create a new context with client auth
      const clientContext = await browser.newContext({
        storageState: CLIENT_AUTH_FILE,
      })
      const page = await clientContext.newPage()

      try {
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
      } finally {
        await clientContext.close()
      }
    })

    test('client can send a message to team', async ({ browser }) => {
      // Create a new context with client auth
      const clientContext = await browser.newContext({
        storageState: CLIENT_AUTH_FILE,
      })
      const page = await clientContext.newPage()

      try {
        // Navigate to messages
        await page.goto('/client/messages')
        await page.waitForLoadState('networkidle')

        // Find and click a conversation
        const conversationLink = page
          .locator('a[href^="/client/messages/"]')
          .first()

        expect(
          await conversationLink.count(),
          'No conversation found for client - check data seeding'
        ).toBeGreaterThan(0)
        if ((await conversationLink.count()) === 0) {
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
      } finally {
        await clientContext.close()
      }
    })

    test('client message appears immediately in thread', async ({
      browser,
    }) => {
      // Create a new context with client auth
      const clientContext = await browser.newContext({
        storageState: CLIENT_AUTH_FILE,
      })
      const page = await clientContext.newPage()

      try {
        // Navigate to messages
        await page.goto('/client/messages')
        await page.waitForLoadState('networkidle')

        // Find and click a conversation
        const conversationLink = page
          .locator('a[href^="/client/messages/"]')
          .first()

        expect(
          await conversationLink.count(),
          'No conversation found for client - check data seeding'
        ).toBeGreaterThan(0)
        if ((await conversationLink.count()) === 0) {
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
      } finally {
        await clientContext.close()
      }
    })
  })

  test.describe('Cross-Portal Message Visibility', () => {
    // These tests use both admin and client authentication in separate browser contexts
    // TODO: Skip until messaging feature is fully integrated - requires conversation data seeding

    test.skip('message sent by admin is visible to client', async ({
      browser,
    }) => {
      // Create admin context (using default storage state from project config)
      const adminContext = await browser.newContext({
        storageState: ADMIN_AUTH_FILE,
      })
      const adminPage = await adminContext.newPage()

      // Create client context
      const clientContext = await browser.newContext({
        storageState: CLIENT_AUTH_FILE,
      })
      const clientPage = await clientContext.newPage()

      try {
        // Step 1: Find conversation from client side (client has conversations)
        const conversationData = await findClientConversation(clientPage)

        expect(
          conversationData,
          'No conversation found for client - check data seeding'
        ).toBeTruthy()
        if (!conversationData) {
          return
        }

        const conversationId = conversationData.conversationId
        const testMessage = `Cross-portal admin test ${Date.now()}`

        // Navigate admin to the same conversation
        await adminPage.goto(`/admin/messages/${conversationId}`)
        await adminPage.waitForLoadState('networkidle')

        // Send message from admin
        const messageInput = adminPage.locator(
          'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
        )
        await expect(messageInput).toBeVisible({ timeout: 10000 })
        await messageInput.fill(testMessage)

        const sendButton = adminPage.locator(
          'button:has(svg.lucide-send), button:has-text("Send")'
        )
        await sendButton.first().click()

        // Wait for message to appear in admin view
        await expect(adminPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 10000,
        })

        // Step 2: Verify message is visible to client
        // Refresh client page to see new message
        await clientPage.goto(`/client/messages/${conversationId}`)
        await clientPage.waitForLoadState('networkidle')

        // Message should appear in client view
        await expect(clientPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 15000,
        })

        console.log('SUCCESS: Admin message visible to client')
      } finally {
        await adminContext.close()
        await clientContext.close()
      }
    })

    test.skip('message sent by client is visible to admin', async ({
      browser,
    }) => {
      // Create admin context
      const adminContext = await browser.newContext({
        storageState: ADMIN_AUTH_FILE,
      })
      const adminPage = await adminContext.newPage()

      // Create client context
      const clientContext = await browser.newContext({
        storageState: CLIENT_AUTH_FILE,
      })
      const clientPage = await clientContext.newPage()

      try {
        // Step 1: Find a conversation from client side
        const conversationData = await findClientConversation(clientPage)

        expect(
          conversationData,
          'No conversation found for client - check data seeding'
        ).toBeTruthy()
        if (!conversationData) {
          return
        }

        const conversationId = conversationData.conversationId
        const testMessage = `Cross-portal client test ${Date.now()}`

        // Step 2: Client sends a message (already on the conversation page from findClientConversation)
        const messageInput = clientPage.locator(
          'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
        )
        await expect(messageInput).toBeVisible({ timeout: 10000 })

        await messageInput.fill(testMessage)

        const sendButton = clientPage.locator(
          'button:has(svg.lucide-send), button:has-text("Send")'
        )
        await sendButton.first().click()

        // Wait for message to appear in client view
        await expect(clientPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 10000,
        })

        // Step 3: Verify message is visible to admin
        await adminPage.goto(`/admin/messages/${conversationId}`)
        await adminPage.waitForLoadState('networkidle')

        // Message should appear in admin view
        await expect(adminPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 15000,
        })

        console.log('SUCCESS: Client message visible to admin')
      } finally {
        await adminContext.close()
        await clientContext.close()
      }
    })
  })
})

test.describe('Error Handling', () => {
  test('client message composer is functional', async ({ browser }) => {
    // Create a new context with client auth
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH_FILE,
    })
    const page = await clientContext.newPage()

    try {
      // Navigate to messages
      await page.goto('/client/messages')
      await page.waitForLoadState('networkidle')

      // Find and click a conversation
      const conversationLink = page
        .locator('a[href^="/client/messages/"]')
        .first()

      expect(
        await conversationLink.count(),
        'No conversation found - check data seeding'
      ).toBeGreaterThan(0)
      if ((await conversationLink.count()) === 0) {
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
    } finally {
      await clientContext.close()
    }
  })
})
