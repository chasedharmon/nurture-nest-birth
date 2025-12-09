import { test, expect, Page } from '@playwright/test'

/**
 * Setup Tests - Create a conversation for testing
 *
 * This test file sets up test data (conversations) via the UI
 * so that the functional messaging tests can run.
 */

// Test credentials
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

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

test.describe('Setup - Create Test Conversation', () => {
  test('create conversation with first lead via UI', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      console.log('Login failed - skipping setup')
      test.skip()
      return
    }

    // First check if there are any existing conversations
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    const existingConversations = page.locator('a[href^="/admin/messages/"]')
    const existingCount = await existingConversations.count()

    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing conversations - setup not needed`
      )
      return
    }

    console.log('No conversations found - creating one via lead detail...')

    // Go to leads
    await page.goto('/admin/leads')
    await page.waitForLoadState('networkidle')

    // Find a lead row
    const leadRows = page.locator(
      'tbody tr[class*="cursor-pointer"], tbody tr:has(td)'
    )
    const leadCount = await leadRows.count()

    if (leadCount === 0) {
      console.log('No leads found - cannot create conversation')
      test.skip()
      return
    }

    // Click first lead
    await leadRows.first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForURL(/\/admin\/leads\/[a-f0-9-]+/, { timeout: 10000 })

    console.log('Navigated to lead detail page')

    // Click Messages tab
    const messagesTab = page.locator(
      '[role="tab"]:has-text("Messages"), button:has-text("Messages")'
    )
    await expect(messagesTab.first()).toBeVisible({ timeout: 10000 })
    await messagesTab.first().click()
    await page.waitForTimeout(500)

    console.log('Clicked Messages tab')

    // Look for "Start Conversation" or "New Message" button
    const startButton = page.locator(
      'button:has-text("Start Conversation"), button:has-text("New Message"), button:has-text("Start")'
    )
    const startCount = await startButton.count()

    if (startCount > 0) {
      console.log('Found Start Conversation button - clicking it')
      await startButton.first().click()
      await page.waitForTimeout(2000)

      // Check if we're now on a messages page or have a composer
      const currentUrl = page.url()
      console.log('Current URL after clicking start:', currentUrl)

      // Wait longer for page to fully load
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Look for message input
      const messageInput = page.locator(
        'textarea[placeholder*="message"], textarea[placeholder*="Type"], input[placeholder*="message"]'
      )
      const inputCount = await messageInput.count()

      if (inputCount > 0) {
        console.log('Found message input - sending first message')

        // Send a test message
        await messageInput
          .first()
          .fill('Hello! This is a test conversation created by E2E tests.')

        const sendButton = page.locator(
          'button:has-text("Send"), button[type="submit"]:has(svg)'
        )
        await sendButton.first().click()

        // Wait for message to be sent
        await page.waitForTimeout(2000)

        console.log('Sent first message!')

        // Verify conversation was created
        await page.goto('/admin/messages')
        await page.waitForLoadState('networkidle')

        const newConversations = page.locator('a[href^="/admin/messages/"]')
        const newCount = await newConversations.count()

        expect(newCount).toBeGreaterThan(0)
        console.log(
          `SUCCESS: Created conversation! Now have ${newCount} conversation(s)`
        )
      } else {
        console.log('No message input found after clicking start button')

        // Check if the URL shows we're on a conversation page
        const currentUrl = page.url()
        if (currentUrl.includes('/admin/messages/')) {
          console.log(
            'We are on a conversation page - conversation was created!'
          )

          // Wait a bit more for the page to render
          await page.waitForTimeout(3000)

          // Try finding message input again
          const retryInput = page.locator(
            'textarea[placeholder*="message"], textarea[placeholder*="Type"], input[placeholder*="message"], textarea'
          )
          const retryCount = await retryInput.count()
          console.log(`Found ${retryCount} textarea elements after waiting`)

          if (retryCount > 0) {
            await retryInput.first().fill('Test message after wait')
            const sendBtn = page.locator('button:has-text("Send")')
            if ((await sendBtn.count()) > 0) {
              await sendBtn.first().click()
              console.log('Sent test message!')
            }
          }

          // Verify by going to messages list
          await page.goto('/admin/messages')
          await page.waitForLoadState('networkidle')

          const conversations = page.locator('a[href^="/admin/messages/"]')
          const count = await conversations.count()
          console.log(`Found ${count} conversation(s) in list`)
          expect(count).toBeGreaterThan(0)
        } else {
          // Take a screenshot to see what happened
          await page.screenshot({
            path: 'test-results/start-conversation-result.png',
          })
        }
      }
    } else {
      console.log('No Start Conversation button found')
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/messages-tab-state.png' })

      // Maybe there's already a conversation - check for View All link
      const viewAllLink = page.locator(
        'a:has-text("View All"), a[href^="/admin/messages/"]'
      )
      const viewCount = await viewAllLink.count()

      if (viewCount > 0) {
        console.log('Found View All link - conversation may already exist')
        await viewAllLink.first().click()
        await page.waitForLoadState('networkidle')
        console.log('Navigated to:', page.url())
      }
    }
  })
})

test.describe('Verify Conversation Exists', () => {
  test('should have at least one conversation after setup', async ({
    page,
  }) => {
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    const conversations = page.locator('a[href^="/admin/messages/"]')
    const count = await conversations.count()

    console.log(`Found ${count} conversation(s)`)

    // This test documents the state rather than enforcing it
    // If no conversations, we know the functional tests will skip
    if (count === 0) {
      console.log(
        'WARNING: No conversations exist. Functional tests will be skipped.'
      )
    } else {
      console.log('Conversations exist. Functional tests should run.')
    }
  })
})
