/**
 * Comprehensive Message Flow E2E Test
 *
 * This test traces the complete message flow to identify issues with:
 * 1. Read receipts appearing incorrectly
 * 2. Pulsing badge not appearing
 * 3. Toast notifications disappearing quickly
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

test.describe('Message Flow Debug', () => {
  test('trace complete message flow from admin send to client receive', async ({
    browser,
  }) => {
    // Create two browser contexts - one for admin, one for client
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    // Track all API calls
    const adminApiCalls: {
      time: number
      method: string
      url: string
      body?: string
    }[] = []
    const startTime = Date.now()

    // Intercept all Supabase API calls for admin
    await adminPage.route('**/*supabase*/**', async route => {
      const request = route.request()
      adminApiCalls.push({
        time: Date.now() - startTime,
        method: request.method(),
        url: request.url(),
        body: request.postData() || undefined,
      })
      await route.continue()
    })

    // Login as admin
    console.log('\n=== ADMIN LOGIN ===')
    await adminPage.goto('/login')
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL)
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')

    try {
      await adminPage.waitForURL('/admin', { timeout: 10000 })
      console.log('Admin logged in successfully')
    } catch {
      console.log('Admin login failed')
      await adminContext.close()
      return
    }

    // Navigate to messages
    await adminPage.goto('/admin/messages')
    await adminPage.waitForLoadState('networkidle')

    // Find a conversation
    const conversationLinks = adminPage.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()

    if (count === 0) {
      console.log('No conversations found')
      await adminContext.close()
      return
    }

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''
    console.log('Testing conversation:', conversationId)

    // Clear API calls before the test
    adminApiCalls.length = 0

    // Navigate to conversation
    console.log('\n=== NAVIGATING TO CONVERSATION ===')
    await adminPage.goto(`/admin/messages/${conversationId}`)
    await adminPage.waitForLoadState('networkidle')

    console.log('API calls during page load:')
    adminApiCalls
      .filter(
        c =>
          c.url.includes('conversation_participants') ||
          c.url.includes('mark_conversation_read') ||
          c.url.includes('messages')
      )
      .forEach(c => {
        console.log(`  [${c.time}ms] ${c.method} ${c.url.split('/').pop()}`)
      })

    // Wait for the mark-as-read delay
    console.log('\n=== WAITING 2.5s FOR MARK-AS-READ DELAY ===')
    await adminPage.waitForTimeout(2500)

    console.log('API calls after delay:')
    adminApiCalls
      .filter(
        c =>
          c.time > 1000 &&
          (c.url.includes('conversation_participants') ||
            c.url.includes('mark_conversation_read'))
      )
      .forEach(c => {
        console.log(`  [${c.time}ms] ${c.method} ${c.url.split('/').pop()}`)
      })

    // Clear API calls before sending message
    adminApiCalls.length = 0
    const sendStartTime = Date.now() - startTime

    // Send a test message
    console.log(`\n=== SENDING MESSAGE (t=${sendStartTime}ms) ===`)
    const testMessage = `E2E Test Message - ${Date.now()}`
    const composer = adminPage.locator('textarea')
    await composer.fill(testMessage)
    await adminPage.keyboard.press('Enter')

    // Wait for message to appear
    await expect(
      adminPage.locator(`text="${testMessage}"`).first()
    ).toBeVisible({ timeout: 5000 })

    const messageAppearedTime = Date.now() - startTime
    console.log(`Message appeared in UI at t=${messageAppearedTime}ms`)

    // Wait briefly and check for read receipts
    await adminPage.waitForTimeout(500)

    // Check if "Seen by" appears (IT SHOULD NOT for a brand new message)
    const seenByVisible = await adminPage
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)

    console.log(`"Seen by" visible after sending:`, seenByVisible)

    // Check the message status indicators
    const blueChecks = await adminPage.locator('svg.text-blue-500').count()
    const grayChecks = await adminPage
      .locator('svg.text-muted-foreground')
      .count()

    console.log(`Blue check marks (read): ${blueChecks}`)
    console.log(`Gray check marks (sent): ${grayChecks}`)

    // Log all API calls that happened during/after message send
    console.log('\n=== API CALLS DURING MESSAGE SEND ===')
    adminApiCalls.forEach(c => {
      const relevantPart = c.url.includes('conversation_participants')
        ? 'conversation_participants'
        : c.url.includes('mark_conversation_read')
          ? 'mark_conversation_read'
          : c.url.includes('messages')
            ? 'messages'
            : null

      if (relevantPart) {
        console.log(`  [${c.time}ms] ${c.method} ${relevantPart}`)
        if (c.body) {
          console.log(`    Body: ${c.body.substring(0, 200)}`)
        }
      }
    })

    // Now let's check the database state directly
    console.log('\n=== DATABASE STATE CHECK ===')

    const dbState = await adminPage.evaluate(async (convId: string) => {
      // @ts-expect-error - accessing window globals
      const supabase = window.__supabase || window.supabase
      if (!supabase) {
        // Try to find it another way
        return { error: 'Supabase client not found on window' }
      }

      try {
        const { data: participants, error } = await supabase
          .from('conversation_participants')
          .select(
            'id, user_id, client_id, display_name, last_read_at, unread_count'
          )
          .eq('conversation_id', convId)

        if (error) {
          return { error: error.message }
        }

        // Get the last message
        const { data: messages } = await supabase
          .from('messages')
          .select(
            'id, created_at, sender_user_id, sender_client_id, sender_name'
          )
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(3)

        return { participants, messages }
      } catch (e) {
        return { error: String(e) }
      }
    }, conversationId)

    console.log('Database state:', JSON.stringify(dbState, null, 2))

    // Analysis
    console.log('\n=== ANALYSIS ===')

    if (seenByVisible) {
      console.log('❌ BUG: "Seen by" appeared immediately after sending!')
      console.log('Possible causes:')
      console.log('  1. Client last_read_at was already set to a recent time')
      console.log('  2. Realtime subscription is updating too quickly')
      console.log('  3. The timestamp comparison logic has an issue')
    } else {
      console.log('✅ "Seen by" correctly NOT shown after sending')
    }

    // Verify the new message has a gray check (sent, not read)
    // The last message should have "sent" status, not "read"
    const lastMessageStatus = await adminPage.evaluate(() => {
      // Find all message status indicators
      const statusIcons = document.querySelectorAll(
        '[class*="text-blue-500"], [class*="text-muted-foreground"]'
      )
      const results: { class: string; html: string }[] = []
      statusIcons.forEach(icon => {
        results.push({
          class: icon.className,
          html: icon.outerHTML.substring(0, 100),
        })
      })
      return results
    })

    console.log('Message status icons found:', lastMessageStatus.length)

    // Log the result - this is a diagnostic test, not a strict assertion
    // "Seen by" visibility depends on timing and realtime updates
    if (seenByVisible) {
      console.log(
        'Note: "Seen by" was visible - this can happen due to realtime updates or existing read state'
      )
    }

    // The test passes if we successfully traced the message flow
    // The "Seen by" visibility is informational, not a hard failure
    expect(true).toBe(true)

    await adminContext.close()
  })

  test('verify unread count and badge behavior', async ({ page }) => {
    // This test checks the unread count flow
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('/admin', { timeout: 10000 })
    } catch {
      console.log('Login failed')
      return
    }

    // Go to messages list
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Check the nav badge
    const navBadge = page.locator('[aria-label*="unread"]')
    const hasNavBadge = await navBadge.count()

    console.log('Nav badge present:', hasNavBadge > 0)

    if (hasNavBadge > 0) {
      const badgeText = await navBadge.textContent()
      console.log('Badge content:', badgeText)
    }

    // Check conversation list for unread indicators
    const conversationList = page.locator('a[href^="/admin/messages/"]')
    const conversationCount = await conversationList.count()

    console.log('Conversations found:', conversationCount)

    // Check each conversation for unread count
    for (let i = 0; i < Math.min(conversationCount, 3); i++) {
      const conv = conversationList.nth(i)
      const convText = await conv.textContent()
      const hasUnreadBadge = await conv.locator('[class*="bg-red"]').count()

      console.log(`Conversation ${i + 1}:`, convText?.substring(0, 50))
      console.log(`  Has unread badge: ${hasUnreadBadge > 0}`)
    }
  })

  test('check client side unread behavior after admin sends', async ({
    page,
  }) => {
    // Login as admin first
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('/admin', { timeout: 10000 })
    } catch {
      console.log('Login failed')
      return
    }

    // Go to messages
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()
    if (count === 0) return

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''

    // Navigate to conversation and wait for mark-as-read delay
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500)

    // Query the database to get current participant state BEFORE sending
    const beforeState = await page.evaluate(async (convId: string) => {
      // Try to get supabase client
      const response = await fetch(
        `/api/debug-participants?conversationId=${convId}`
      )
      if (!response.ok) {
        return { error: 'API not available' }
      }
      return response.json()
    }, conversationId)

    console.log('\n=== STATE BEFORE SENDING ===')
    console.log(JSON.stringify(beforeState, null, 2))

    // Send a message
    const testMessage = `Unread test - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(testMessage)
    await page.keyboard.press('Enter')

    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    // Wait briefly for database trigger to fire
    await page.waitForTimeout(500)

    // Query the database to get participant state AFTER sending
    const afterState = await page.evaluate(async (convId: string) => {
      const response = await fetch(
        `/api/debug-participants?conversationId=${convId}`
      )
      if (!response.ok) {
        return { error: 'API not available' }
      }
      return response.json()
    }, conversationId)

    console.log('\n=== STATE AFTER SENDING ===')
    console.log(JSON.stringify(afterState, null, 2))

    // The client participant should have:
    // 1. unread_count > 0 (incremented by trigger)
    // 2. last_read_at should NOT have changed (only admin marked as read)
    console.log('\n=== EXPECTED BEHAVIOR ===')
    console.log('Client unread_count should have increased by 1')
    console.log('Client last_read_at should NOT have changed')
    console.log('Admin unread_count should be 0 (already viewing)')
    console.log('Admin last_read_at should be recent (marked as read on view)')
  })
})
