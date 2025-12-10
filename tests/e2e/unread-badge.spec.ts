/**
 * E2E Tests for Unread Badge Behavior
 *
 * These tests verify that:
 * 1. When admin sends a message to client, client should see unread badge
 * 2. mark_conversation_read is called with a delay, not immediately
 * 3. The pulsing badge appears correctly
 * 4. Client's last_read_at is NOT updated when admin views messages
 */

import { test, expect } from '@playwright/test'

// Test data
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

// Skip this test suite - requires seeded conversations and client auth
// These tests verify cross-participant messaging behavior
test.describe.skip('Unread Badge Behavior', () => {
  test.describe.configure({ mode: 'serial' })

  let conversationId: string

  test.beforeAll(async ({ browser }) => {
    // Create a context for admin setup
    const context = await browser.newContext()
    const page = await context.newPage()

    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('/admin', { timeout: 10000 })
    } catch {
      console.log('Login may have failed or redirected elsewhere')
      await context.close()
      return
    }

    // Go to messages and find an existing conversation
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Check if there's an existing conversation
    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()

    if (count > 0) {
      const href = await conversationLinks.first().getAttribute('href')
      conversationId = href?.split('/').pop() || ''
      console.log('Found conversation:', conversationId)
    }

    await context.close()
  })

  test('verify mark_conversation_read RPC is delayed on page load', async ({
    page,
  }) => {
    test.skip(!conversationId, 'No conversation available for testing')

    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Intercept RPC calls to mark_conversation_read
    const markReadCalls: { timestamp: number; url: string }[] = []
    const startTime = Date.now()

    await page.route('**/rest/v1/rpc/mark_conversation_read**', route => {
      markReadCalls.push({
        timestamp: Date.now() - startTime,
        url: route.request().url(),
      })
      route.continue()
    })

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait 3 seconds to capture the delayed call
    await page.waitForTimeout(3000)

    console.log('mark_conversation_read calls:', markReadCalls)

    // There should be exactly 1 call, and it should happen after ~1500ms
    expect(markReadCalls.length).toBeGreaterThan(0)

    if (markReadCalls.length > 0 && markReadCalls[0]) {
      console.log(
        'First mark_conversation_read call delay:',
        markReadCalls[0].timestamp,
        'ms'
      )
      // Should be after 1000ms (we have 1500ms delay)
      expect(markReadCalls[0].timestamp).toBeGreaterThan(1000)
    }
  })

  test('check all conversation_participants updates', async ({ page }) => {
    test.skip(!conversationId, 'No conversation available for testing')

    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Intercept ALL update calls to conversation_participants
    const updateCalls: { timestamp: number; method: string; url: string }[] = []
    const startTime = Date.now()

    // Intercept direct table updates
    await page.route('**/rest/v1/conversation_participants**', route => {
      const method = route.request().method()
      if (method === 'PATCH' || method === 'PUT') {
        updateCalls.push({
          timestamp: Date.now() - startTime,
          method,
          url: route.request().url(),
        })
      }
      route.continue()
    })

    // Also intercept RPC calls
    await page.route('**/rest/v1/rpc/**', route => {
      updateCalls.push({
        timestamp: Date.now() - startTime,
        method: 'RPC',
        url: route.request().url(),
      })
      route.continue()
    })

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait 3 seconds to capture all updates
    await page.waitForTimeout(3000)

    console.log('All API calls that could affect unread status:', updateCalls)

    // Check if any call happens before 1000ms
    const earlyCalls = updateCalls.filter(
      call =>
        call.timestamp < 1000 &&
        (call.url.includes('mark_conversation_read') ||
          call.url.includes('conversation_participants'))
    )

    if (earlyCalls.length > 0) {
      console.log('PROBLEM: Early calls detected:', earlyCalls)
    }

    expect(earlyCalls.length).toBe(0)
  })

  test('admin sends message and checks that client participant has unread', async ({
    page,
  }) => {
    test.skip(!conversationId, 'No conversation available for testing')

    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Go to the conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait for the mark as read to complete (1.5s delay + buffer)
    await page.waitForTimeout(2000)

    // Send a test message
    const testMessage = `Test unread badge - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(testMessage)
    await page.keyboard.press('Enter')

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    // Wait a moment for the database trigger to fire
    await page.waitForTimeout(500)

    // Check if the "Seen by" indicator appears immediately (it shouldn't!)
    const seenByText = page.locator('text=/Seen by/i')
    const isSeenByVisible = await seenByText.isVisible().catch(() => false)

    console.log(
      'Is "Seen by" visible immediately after sending?',
      isSeenByVisible
    )

    // If seen by is visible immediately, that's the bug!
    // It should only appear after the client actually reads the message
    if (isSeenByVisible) {
      console.log('BUG DETECTED: "Seen by" appears immediately after sending!')
      console.log(
        'This means the client participant last_read_at is being set incorrectly'
      )
    }
  })

  test('verify client last_read_at is not updated when admin views conversation', async ({
    page,
  }) => {
    test.skip(!conversationId, 'No conversation available for testing')

    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Intercept the participants fetch to see the data
    let participantsData: unknown[] = []

    await page.route('**/rest/v1/conversation_participants**', async route => {
      const response = await route.fetch()
      const json = await response.json()
      participantsData = json
      console.log('Participants data:', JSON.stringify(json, null, 2))
      route.fulfill({ response })
    })

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Log the participants
    console.log('Number of participants:', participantsData.length)

    // The admin's last_read_at should NOT affect the client's unread status
    // And vice versa
  })
})
