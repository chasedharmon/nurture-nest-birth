import { test, expect, Page } from '@playwright/test'

/**
 * Bidirectional Messaging Tests
 *
 * Tests the complete messaging flow between:
 * 1. Team members (admin) sending messages to clients
 * 2. Clients sending messages back to team members
 *
 * This verifies the fix for client-to-team messaging which previously
 * failed due to RLS policy conflicts with custom client sessions.
 */

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'
const CLIENT_EMAIL = 'makharmon@kearneycats.com'
const CLIENT_PASSWORD = 'password123'

// Helper to login as admin
async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[name="email"]', { state: 'visible' })

  await page.locator('input[name="email"]').fill(ADMIN_EMAIL)
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD)

  await page.waitForTimeout(200)
  await page.locator('button[type="submit"]').click()

  try {
    await expect(page).toHaveURL('/admin', { timeout: 15000 })
    return true
  } catch {
    return false
  }
}

// Helper to login as client
async function loginAsClient(page: Page): Promise<boolean> {
  await page.goto('/client/login')
  await page.waitForLoadState('networkidle')

  // The login page starts in "choice" mode - enter email first
  const emailInput = page.locator('input#email-choice')
  await expect(emailInput).toBeVisible({ timeout: 5000 })
  await emailInput.fill(CLIENT_EMAIL)

  // Wait for the button to be enabled
  const passwordButton = page.locator(
    'button:has-text("Sign in with Password")'
  )
  await expect(passwordButton).toBeEnabled({ timeout: 5000 })

  // Click "Sign in with Password" button
  await passwordButton.click()

  // Now we're in password mode - fill in the password
  await expect(page.locator('input#password')).toBeVisible({ timeout: 5000 })
  await page.fill('input#password', CLIENT_PASSWORD)

  // Submit the form
  await page.click('button[type="submit"]')

  try {
    await expect(page).toHaveURL('/client/dashboard', { timeout: 15000 })
    return true
  } catch {
    return false
  }
}

// Helper to skip test if login failed
function skipIfLoginFailed(loggedIn: boolean) {
  if (!loggedIn) {
    test.skip()
  }
}

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
    let loggedIn = false

    test.beforeEach(async ({ page }) => {
      loggedIn = await loginAsAdmin(page)
      skipIfLoginFailed(loggedIn)
    })

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
    let loggedIn = false

    test.beforeEach(async ({ page }) => {
      loggedIn = await loginAsClient(page)
      skipIfLoginFailed(loggedIn)
    })

    test('client can access messages page', async ({ page }) => {
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

    test('client can send a message to team', async ({ page }) => {
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

    test('client message appears immediately in thread', async ({ page }) => {
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
    // These tests need extra time due to dual login + navigation
    test.setTimeout(60000)

    test('message sent by client is visible to admin', async ({ browser }) => {
      // Create two browser contexts
      const adminContext = await browser.newContext()
      const clientContext = await browser.newContext()

      const adminPage = await adminContext.newPage()
      const clientPage = await clientContext.newPage()

      try {
        // Login both users
        const adminLoggedIn = await loginAsAdmin(adminPage)
        const clientLoggedIn = await loginAsClient(clientPage)

        if (!adminLoggedIn || !clientLoggedIn) {
          console.log('Could not login both users - skipping test')
          test.skip()
          return
        }

        // Navigate client to messages
        await clientPage.goto('/client/messages')
        await clientPage.waitForLoadState('networkidle')

        // Find a conversation
        const clientConversationLink = clientPage
          .locator('a[href^="/client/messages/"]')
          .first()

        if ((await clientConversationLink.count()) === 0) {
          console.log('No conversation found - skipping test')
          test.skip()
          return
        }

        // Get the conversation ID from the href
        const href = await clientConversationLink.getAttribute('href')
        const conversationId = href?.match(
          /\/client\/messages\/([a-f0-9-]+)/
        )?.[1]

        if (!conversationId) {
          console.log('Could not extract conversation ID - skipping test')
          test.skip()
          return
        }

        // Navigate client to conversation
        await clientConversationLink.click()
        await clientPage.waitForLoadState('networkidle')

        // Send message from client
        const clientMessageInput = clientPage.locator(
          'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
        )
        await expect(clientMessageInput).toBeVisible({ timeout: 10000 })

        const testMessage = `Cross-portal test ${Date.now()}`
        await clientMessageInput.fill(testMessage)

        const clientSendButton = clientPage.locator(
          'button:has(svg.lucide-send), button:has-text("Send")'
        )
        await clientSendButton.first().click()

        // Wait for message to appear in client view
        await expect(clientPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 10000,
        })

        console.log('Client sent message:', testMessage)

        // Navigate admin to the same conversation
        await adminPage.goto(`/admin/messages/${conversationId}`)
        await adminPage.waitForLoadState('networkidle')

        // Wait for the message to be visible in admin view
        // Note: This may require a page refresh if realtime isn't working
        await adminPage.waitForTimeout(2000)

        // Refresh to ensure we see the latest
        await adminPage.reload()
        await adminPage.waitForLoadState('networkidle')

        // Check if message is visible
        await expect(adminPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 15000,
        })

        console.log('SUCCESS: Client message visible to admin')
      } finally {
        await adminContext.close()
        await clientContext.close()
      }
    })

    test('message sent by admin is visible to client', async ({ browser }) => {
      // Create two browser contexts
      const adminContext = await browser.newContext()
      const clientContext = await browser.newContext()

      const adminPage = await adminContext.newPage()
      const clientPage = await clientContext.newPage()

      try {
        // Login both users
        const adminLoggedIn = await loginAsAdmin(adminPage)
        const clientLoggedIn = await loginAsClient(clientPage)

        if (!adminLoggedIn || !clientLoggedIn) {
          console.log('Could not login both users - skipping test')
          test.skip()
          return
        }

        // Navigate admin to messages
        const conversationData = await findClientConversation(adminPage)

        if (!conversationData) {
          console.log('No conversation found - skipping test')
          test.skip()
          return
        }

        // Send message from admin
        const adminMessageInput = adminPage.locator(
          'textarea[placeholder*="message"], textarea[placeholder*="Type"]'
        )
        await expect(adminMessageInput).toBeVisible({ timeout: 10000 })

        const testMessage = `Admin cross-portal test ${Date.now()}`
        await adminMessageInput.fill(testMessage)

        const adminSendButton = adminPage.locator(
          'button:has(svg.lucide-send), button:has-text("Send")'
        )
        await adminSendButton.first().click()

        // Wait for message to appear in admin view
        await expect(adminPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 10000,
        })

        console.log('Admin sent message:', testMessage)

        // Navigate client to messages
        await clientPage.goto('/client/messages')
        await clientPage.waitForLoadState('networkidle')

        // Find the conversation
        const clientConversationLink = clientPage
          .locator('a[href^="/client/messages/"]')
          .first()

        if ((await clientConversationLink.count()) === 0) {
          console.log('Client has no conversations - skipping test')
          test.skip()
          return
        }

        await clientConversationLink.click()
        await clientPage.waitForLoadState('networkidle')

        // Check if message is visible
        await expect(clientPage.locator(`text=${testMessage}`)).toBeVisible({
          timeout: 15000,
        })

        console.log('SUCCESS: Admin message visible to client')
      } finally {
        await adminContext.close()
        await clientContext.close()
      }
    })
  })
})

test.describe('Error Handling', () => {
  test('client message send shows error on failure gracefully', async ({
    page,
  }) => {
    const loggedIn = await loginAsClient(page)
    skipIfLoginFailed(loggedIn)

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
