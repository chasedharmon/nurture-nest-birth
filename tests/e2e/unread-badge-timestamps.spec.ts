/**
 * Timestamp Debug E2E Test
 *
 * This test checks the exact timestamps to understand why "read" appears
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

test.describe('Timestamp Debug', () => {
  test('check participant timestamps via network interception', async ({
    page,
  }) => {
    // Collect participants data from API responses
    let participantsData: unknown[] = []
    let lastMessageData: unknown = null

    // Intercept participant fetches
    await page.route('**/rest/v1/conversation_participants**', async route => {
      const response = await route.fetch()
      const json = await response.json()
      participantsData = json
      console.log(
        '\n[INTERCEPTED] Participants:',
        JSON.stringify(json, null, 2)
      )
      await route.fulfill({ response })
    })

    // Intercept message fetches/inserts
    await page.route('**/rest/v1/messages**', async route => {
      const method = route.request().method()
      if (method === 'POST') {
        const response = await route.fetch()
        const json = await response.json()
        lastMessageData = json
        console.log(
          '\n[INTERCEPTED] New message:',
          JSON.stringify(json, null, 2)
        )
        await route.fulfill({ response })
      } else {
        await route.continue()
      }
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

    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()
    if (count === 0) {
      console.log('No conversations found')
      return
    }

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''
    console.log('\n=== Testing conversation:', conversationId, '===')

    // Navigate to conversation - this will trigger participants fetch
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    console.log('\n=== PARTICIPANTS ON PAGE LOAD ===')
    participantsData.forEach((p: unknown) => {
      const participant = p as {
        id: string
        user_id: string | null
        client_id: string | null
        display_name: string
        last_read_at: string | null
        unread_count: number
      }
      const type = participant.user_id ? 'ADMIN' : 'CLIENT'
      console.log(
        `[${type}] ${participant.display_name}:`,
        `last_read_at=${participant.last_read_at}`
      )
    })

    // Wait for the delayed mark-as-read
    console.log('\n=== WAITING 2.5s FOR ADMIN MARK-AS-READ ===')
    await page.waitForTimeout(2500)

    // Now check for any updates via realtime
    // The participants state in the component should have been updated

    // Send a test message
    const beforeSendTime = new Date().toISOString()
    console.log('\n=== SENDING MESSAGE ===')
    console.log('Time before send:', beforeSendTime)

    const testMessage = `Timestamp test - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(testMessage)
    await page.keyboard.press('Enter')

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    const afterSendTime = new Date().toISOString()
    console.log('Time after send:', afterSendTime)

    if (lastMessageData) {
      console.log(
        '\nNew message data:',
        JSON.stringify(lastMessageData, null, 2)
      )
    }

    // Wait a moment for any realtime updates
    await page.waitForTimeout(500)

    // Check the UI state
    console.log('\n=== UI STATE CHECK ===')

    // Check for "Seen by" text
    const seenByVisible = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log('"Seen by" visible:', seenByVisible)

    // Check for blue checkmarks (read status)
    // The read checkmark is a CheckCheck icon with text-blue-500
    const blueCheckmarks = page.locator('svg.text-blue-500')
    const blueCheckCount = await blueCheckmarks.count()
    console.log('Blue checkmarks (read indicators) count:', blueCheckCount)

    // Check for gray checkmarks (sent status)
    const grayCheckmarks = page.locator('svg.text-muted-foreground')
    const grayCheckCount = await grayCheckmarks.count()
    console.log('Gray checkmarks (sent indicators) count:', grayCheckCount)

    // Find the last message and check its status indicator
    const lastMessageContainer = page.locator(`text="${testMessage}"`).first()
    const isLastMessageVisible = await lastMessageContainer.isVisible()
    console.log('\nLast message visible:', isLastMessageVisible)

    // Get the message bubble and check sibling for status
    if (isLastMessageVisible) {
      // The message bubble should be in a container with the status indicator
      const messageParent = lastMessageContainer.locator('..')
      const parentHTML = await messageParent.innerHTML()
      console.log(
        'Message parent HTML (first 500 chars):',
        parentHTML.substring(0, 500)
      )
    }

    // Now let's understand the component state by extracting it
    // We'll add a window variable to expose the state
    console.log('\n=== ANALYSIS ===')

    // The key question: Is the client's last_read_at >= the new message's created_at?
    // We need to look at what data the component is using

    // Get the latest participants from the page's component state
    const componentState = await page.evaluate(() => {
      // Try to find React fiber to get component state
      // This is a debugging technique - won't work in production

      // Alternatively, look at what's rendered
      const seenByElements = document.querySelectorAll(
        '[class*="text-blue-500"]'
      )
      const checkmarks: string[] = []
      seenByElements.forEach(el => {
        checkmarks.push(el.outerHTML)
      })

      return {
        checkmarkCount: seenByElements.length,
        checkmarks,
      }
    })

    console.log('Component state:', JSON.stringify(componentState, null, 2))

    // The fix should ensure "Seen by" does NOT appear for the new message
    expect(seenByVisible).toBe(false)
  })

  test('send two messages and verify read status for each', async ({
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

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait for mark-as-read delay
    await page.waitForTimeout(2500)

    // Send FIRST message
    const firstMessage = `First message - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(firstMessage)
    await page.keyboard.press('Enter')
    await expect(page.locator(`text="${firstMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    console.log('First message sent')

    // Check "Seen by" after first message
    await page.waitForTimeout(500)
    const seenByAfterFirst = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log('"Seen by" after first message:', seenByAfterFirst)

    // Send SECOND message
    const secondMessage = `Second message - ${Date.now()}`
    await composer.fill(secondMessage)
    await page.keyboard.press('Enter')
    await expect(page.locator(`text="${secondMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })

    console.log('Second message sent')

    // Check "Seen by" after second message
    await page.waitForTimeout(500)
    const seenByAfterSecond = await page
      .locator('text=/Seen by/i')
      .isVisible()
      .catch(() => false)
    console.log('"Seen by" after second message:', seenByAfterSecond)

    // Both should be false since client hasn't read them
    expect(seenByAfterFirst).toBe(false)
    expect(seenByAfterSecond).toBe(false)
  })
})
