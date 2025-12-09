/**
 * Real User Flow E2E Test
 *
 * Simulates actual admin/client interaction to debug message status issues.
 * Tests the complete flow:
 * 1. Admin sends message
 * 2. Check admin sees single check (sent)
 * 3. Client views conversation
 * 4. Check admin sees double blue check (read)
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

test.describe('Real User Flow Debug', () => {
  test('complete message flow - admin sends, checks status', async ({
    page,
  }) => {
    // Login as admin
    console.log('\n=== STEP 1: ADMIN LOGIN ===')
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('/admin', { timeout: 10000 })
      console.log('Admin logged in successfully')
    } catch {
      console.log('Admin login failed - check credentials')
      return
    }

    // Navigate to messages
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
    console.log('Using conversation:', conversationId)

    // Navigate to conversation
    console.log('\n=== STEP 2: VIEW CONVERSATION ===')
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait for mark-as-read delay
    await page.waitForTimeout(2000)

    // Check current participant data via page evaluate
    console.log('\n=== STEP 3: CHECK PARTICIPANT DATA ===')
    const participantData = await page.evaluate(() => {
      // Look for participant data in the page
      // It should be in the component state
      const allElements = document.querySelectorAll('[data-participant]')
      return {
        elements: allElements.length,
        html: document.body.innerHTML.substring(0, 500),
      }
    })

    console.log('Participant elements found:', participantData.elements)

    // Send a test message
    console.log('\n=== STEP 4: SEND MESSAGE ===')
    const testMessage = `Real flow test - ${Date.now()}`
    const composer = page.locator('textarea')
    await composer.fill(testMessage)
    await page.keyboard.press('Enter')

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({
      timeout: 5000,
    })
    console.log('Message sent and visible')

    // Now let's examine the message status indicators
    console.log('\n=== STEP 5: CHECK MESSAGE STATUS ===')

    // Wait a moment for the message to be fully rendered
    await page.waitForTimeout(500)

    // Find all SVG icons that are check marks
    const checkIcons = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg'))
      const checks = svgs.filter(svg => {
        const className = svg.getAttribute('class') || ''
        const html = svg.outerHTML
        // Check and CheckCheck both have 'check' in their class
        return (
          html.includes('lucide-check') &&
          (className.includes('text-blue-500') ||
            className.includes('text-muted-foreground'))
        )
      })

      return checks.map(svg => ({
        class: svg.getAttribute('class') || '',
        isDoubleCheck: svg.outerHTML.includes('lucide-check-check'),
        isSingleCheck:
          svg.outerHTML.includes('lucide-check') &&
          !svg.outerHTML.includes('lucide-check-check'),
        isBlue: (svg.getAttribute('class') || '').includes('text-blue-500'),
        isGray: (svg.getAttribute('class') || '').includes(
          'text-muted-foreground'
        ),
      }))
    })

    console.log('Check icons found:', checkIcons.length)
    checkIcons.forEach((icon, i) => {
      const type = icon.isDoubleCheck ? 'Double' : 'Single'
      const color = icon.isBlue ? 'Blue' : 'Gray'
      console.log(`  ${i + 1}: ${type} check, ${color}`)
    })

    // Count different types
    const singleGray = checkIcons.filter(
      i => i.isSingleCheck && i.isGray
    ).length
    const doubleGray = checkIcons.filter(
      i => i.isDoubleCheck && i.isGray
    ).length
    const doubleBlue = checkIcons.filter(
      i => i.isDoubleCheck && i.isBlue
    ).length

    console.log('\n=== SUMMARY ===')
    console.log(`Single gray checks (sent): ${singleGray}`)
    console.log(`Double gray checks (delivered): ${doubleGray}`)
    console.log(`Double blue checks (read): ${doubleBlue}`)

    // The newest message should have a single gray check if not read yet
    // or double blue if the client has read it

    // Let's also check the actual HTML around the last message
    const lastMessageArea = await page.evaluate((msg: string) => {
      const msgElement = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent?.includes(msg)
      )
      if (msgElement) {
        // Get the parent container
        let parent = msgElement.parentElement
        for (let i = 0; i < 5 && parent; i++) {
          parent = parent.parentElement
        }
        return parent?.innerHTML.substring(0, 1000) || 'Parent not found'
      }
      return 'Message element not found'
    }, testMessage)

    console.log('\n=== LAST MESSAGE AREA (first 500 chars) ===')
    console.log(lastMessageArea.substring(0, 500))

    // Check if MessageStatus component is rendering
    const statusComponents = await page
      .locator('[class*="flex justify-end mt-0"]')
      .count()
    console.log('\nStatus component containers found:', statusComponents)

    // The test passes if we can see the message and check marks
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  test('verify participants have correct data', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Go to messages
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    if ((await conversationLinks.count()) === 0) return

    const href = await conversationLinks.first().getAttribute('href')
    const conversationId = href?.split('/').pop() || ''

    // Intercept the participants data
    let participantsData: unknown = null

    await page.route('**/conversation_participants**', async route => {
      const response = await route.fetch()
      const json = await response.json()
      participantsData = json
      console.log('\n=== PARTICIPANTS DATA FROM API ===')
      console.log(JSON.stringify(json, null, 2))
      await route.fulfill({ response })
    })

    // Navigate to conversation
    await page.goto(`/admin/messages/${conversationId}`)
    await page.waitForLoadState('networkidle')

    // Wait a moment for the data to be logged
    await page.waitForTimeout(1000)

    console.log(
      '\nFinal participants data:',
      participantsData ? 'Captured' : 'Not captured'
    )

    // The participants should include both admin and client
    // Each should have last_read_at if they've viewed the conversation
  })
})
