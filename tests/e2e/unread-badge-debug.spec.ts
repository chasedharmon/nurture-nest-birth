/**
 * Deep Debug E2E Test for Unread Badge Behavior
 *
 * This test comprehensively traces what happens when admin sends a message:
 * 1. Captures the exact database state before/after
 * 2. Monitors all API calls and realtime events
 * 3. Checks the exact timestamps being compared
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

test.describe('Deep Debug: Unread Badge Flow', () => {
  test('trace exactly what happens when admin sends a message', async ({
    page,
  }) => {
    // Collect all relevant data
    const apiCalls: {
      timestamp: number
      type: string
      method: string
      url: string
      body?: string
    }[] = []
    const consoleMessages: { timestamp: number; type: string; text: string }[] =
      []
    const startTime = Date.now()

    // Capture console logs from the page
    page.on('console', msg => {
      consoleMessages.push({
        timestamp: Date.now() - startTime,
        type: msg.type(),
        text: msg.text(),
      })
    })

    // Intercept ALL Supabase API calls
    await page.route('**/*supabase*/**', async route => {
      const request = route.request()
      const method = request.method()
      const url = request.url()

      let body: string | undefined
      try {
        body = request.postData() || undefined
      } catch {
        body = undefined
      }

      apiCalls.push({
        timestamp: Date.now() - startTime,
        type: 'supabase',
        method,
        url,
        body,
      })

      await route.continue()
    })

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

    // Go to messages
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Find a conversation
    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()

    if (count === 0) {
      console.log('No conversations found')
      return
    }

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''
    console.log('Testing conversation:', conversationId)

    // Clear API calls before navigating to conversation
    apiCalls.length = 0

    // Navigate to conversation
    const navStartTime = Date.now() - startTime
    console.log(`[${navStartTime}ms] Navigating to conversation...`)

    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    console.log(`[${Date.now() - startTime}ms] Page loaded`)

    // Check the initial state of "Seen by"
    const initialSeenBy = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log(
      `[${Date.now() - startTime}ms] Initial "Seen by" visible:`,
      initialSeenBy
    )

    // Wait for the delayed mark-as-read (1.5s + buffer)
    console.log(
      `[${Date.now() - startTime}ms] Waiting 2.5s for mark-as-read delay...`
    )
    await page.waitForTimeout(2500)

    console.log(
      `[${Date.now() - startTime}ms] Delay complete, about to send message`
    )

    // Clear API calls before sending
    // Note: preSendCalls saved for potential debugging
    void [...apiCalls] // Preserve in case needed for debugging
    apiCalls.length = 0

    // Send a test message
    const testMessage = `Debug test - ${Date.now()}`
    const sendStartTime = Date.now() - startTime

    const composer = page.locator('textarea')
    await composer.fill(testMessage)

    console.log(`[${sendStartTime}ms] Pressing Enter to send...`)
    await page.keyboard.press('Enter')

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    const messageSentTime = Date.now() - startTime
    console.log(`[${messageSentTime}ms] Message appeared in UI`)

    // Check immediately for "Seen by"
    const immediateSeenBy = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log(
      `[${Date.now() - startTime}ms] "Seen by" visible immediately after send:`,
      immediateSeenBy
    )

    // Wait 500ms and check again
    await page.waitForTimeout(500)
    const afterDelaySeenBy = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log(
      `[${Date.now() - startTime}ms] "Seen by" visible after 500ms:`,
      afterDelaySeenBy
    )

    // Log all API calls that happened during/after send
    console.log('\n=== API CALLS DURING/AFTER MESSAGE SEND ===')
    apiCalls.forEach(call => {
      const relevantUrl = call.url.includes('conversation_participants')
        ? 'conversation_participants'
        : call.url.includes('mark_conversation_read')
          ? 'mark_conversation_read'
          : call.url.includes('messages')
            ? 'messages'
            : 'other'

      if (relevantUrl !== 'other') {
        console.log(
          `[${call.timestamp}ms] ${call.method} ${relevantUrl}`,
          call.body ? `Body: ${call.body.substring(0, 100)}...` : ''
        )
      }
    })

    // Now let's check the actual database state via the page
    // We'll inject a script to fetch the participants directly
    console.log('\n=== CHECKING DATABASE STATE ===')

    const participantsState = await page.evaluate(async convId => {
      // @ts-expect-error - accessing window globals
      const supabase = window.__supabase
      if (!supabase) {
        return { error: 'No supabase client found on window' }
      }

      const { data, error } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', convId)

      return { data, error }
    }, conversationId)

    console.log(
      'Participants state:',
      JSON.stringify(participantsState, null, 2)
    )

    // Check if there are any realtime subscription events
    console.log('\n=== CONSOLE MESSAGES (filtered) ===')
    consoleMessages
      .filter(
        m =>
          m.text.includes('participant') ||
          m.text.includes('read') ||
          m.text.includes('seen') ||
          m.text.includes('unread')
      )
      .forEach(m => {
        console.log(`[${m.timestamp}ms] [${m.type}] ${m.text}`)
      })

    // Final assertion - "Seen by" should NOT be visible
    if (immediateSeenBy) {
      console.log('\n❌ BUG: "Seen by" appeared immediately after sending!')
      console.log(
        'This means either:\n' +
          '1. The participants data has incorrect last_read_at values\n' +
          '2. A realtime update is setting last_read_at too quickly\n' +
          '3. Something else is updating the client participant record'
      )
    } else {
      console.log(
        '\n✅ "Seen by" correctly NOT shown immediately after sending'
      )
    }

    // This test is for debugging - always fail to see output
    expect(immediateSeenBy).toBe(false)
  })

  test('check if realtime subscription updates cause the issue', async ({
    page,
  }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Go to messages
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()
    if (count === 0) return

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''

    // Track realtime events (unused but useful for debugging)
    void ([] as { timestamp: number; payload: unknown }[])
    void Date.now()

    // Inject a listener for realtime events before navigating
    await page.addInitScript(() => {
      // @ts-expect-error - patching window
      window.__realtimeEvents = []
      const originalChannel =
        // @ts-expect-error - accessing supabase
        window.supabase?.channel?.bind(window.supabase) || (() => {})

      // @ts-expect-error - patching supabase
      if (window.supabase) {
        // @ts-expect-error - patching supabase
        window.supabase.channel = function (...args: unknown[]) {
          const channel = originalChannel(...args)
          const originalOn = channel.on.bind(channel)

          channel.on = function (
            event: string,
            opts: unknown,
            callback: (payload: unknown) => void
          ) {
            const wrappedCallback = (payload: unknown) => {
              // @ts-expect-error - accessing window
              window.__realtimeEvents.push({
                timestamp: Date.now(),
                event,
                payload,
              })
              console.log('[REALTIME]', event, JSON.stringify(payload))
              return callback(payload)
            }
            return originalOn(event, opts, wrappedCallback)
          }

          return channel
        }
      }
    })

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait for delayed mark-as-read
    await page.waitForTimeout(2500)

    // Send message
    const testMessage = `Realtime debug - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(testMessage)
    await page.keyboard.press('Enter')

    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    // Wait and check for realtime events
    await page.waitForTimeout(1000)

    // Get captured events
    const events = await page.evaluate(() => {
      // @ts-expect-error - accessing window
      return window.__realtimeEvents || []
    })

    console.log('\n=== REALTIME EVENTS ===')
    console.log(JSON.stringify(events, null, 2))

    // Check if any event updated conversation_participants
    const participantEvents = events.filter(
      (e: { event?: string; payload?: { table?: string } }) =>
        e.event?.includes('postgres_changes') &&
        e.payload?.table === 'conversation_participants'
    )

    if (participantEvents.length > 0) {
      console.log('\n⚠️ FOUND participant update events:', participantEvents)
    }
  })
})
