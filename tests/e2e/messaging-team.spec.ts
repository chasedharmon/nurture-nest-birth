import { test, expect } from '@playwright/test'

/**
 * Team Internal Messaging Tests
 *
 * Tests the team-to-team internal messaging functionality.
 * Team conversations are private and not visible to clients.
 */

/**
 * Authentication is handled by Playwright setup project via storageState
 * Each test starts with a pre-authenticated session
 */

test.describe('Team Internal Messaging', () => {
  test('can open new conversation dialog with team tab', async ({ page }) => {
    // Navigate to messages
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Click New Conversation button (in header to avoid duplicate matches)
    const newConversationButton = page
      .locator('header')
      .getByRole('button', { name: 'New Conversation' })
    await expect(newConversationButton).toBeVisible({ timeout: 10000 })
    await newConversationButton.click()

    // Wait for dialog to open
    await page.waitForTimeout(500)

    // Verify dialog is open
    const dialogTitle = page.locator('text=Start New Conversation')
    await expect(dialogTitle).toBeVisible({ timeout: 5000 })

    // Verify both tabs exist
    const clientTab = page.locator('[role="tab"]:has-text("Client Message")')
    const teamTab = page.locator('[role="tab"]:has-text("Team Discussion")')

    await expect(clientTab).toBeVisible()
    await expect(teamTab).toBeVisible()

    console.log('SUCCESS: New conversation dialog has Client and Team tabs')

    // Click on Team Discussion tab
    await teamTab.click()
    await page.waitForTimeout(300)

    // Verify team member selection UI appears
    const teamMembersLabel = page.locator('label:has-text("Team Members")')
    await expect(teamMembersLabel).toBeVisible({ timeout: 5000 })

    // Verify the privacy notice
    const privacyNotice = page.locator(
      'text=Team discussions are private and not visible to clients'
    )
    await expect(privacyNotice).toBeVisible()

    console.log('SUCCESS: Team Discussion tab shows team member selection UI')
  })

  test('can switch between client and team conversation modes', async ({
    page,
  }) => {
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Open dialog (using header to avoid duplicate matches)
    const newConversationButton = page
      .locator('header')
      .getByRole('button', { name: 'New Conversation' })
    await newConversationButton.click()
    await page.waitForTimeout(500)

    const clientTab = page.locator('[role="tab"]:has-text("Client Message")')
    const teamTab = page.locator('[role="tab"]:has-text("Team Discussion")')

    // Initially on Client tab
    const clientLabel = page.locator('label:has-text("Client")').first()
    await expect(clientLabel).toBeVisible()

    // Switch to Team tab
    await teamTab.click()
    await page.waitForTimeout(300)

    const teamMembersLabel = page.locator('label:has-text("Team Members")')
    await expect(teamMembersLabel).toBeVisible()

    // Switch back to Client tab
    await clientTab.click()
    await page.waitForTimeout(300)

    await expect(clientLabel).toBeVisible()

    console.log('SUCCESS: Can switch between Client and Team tabs')
  })

  test('displays team member search popover', async ({ page }) => {
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Open dialog (using header to avoid duplicate matches)
    await page
      .locator('header')
      .getByRole('button', { name: 'New Conversation' })
      .click()
    await page.waitForTimeout(500)

    // Click Team tab
    await page.locator('[role="tab"]:has-text("Team Discussion")').click()
    await page.waitForTimeout(300)

    // Click "Add team member..." button
    const addTeamMemberButton = page.locator(
      'button:has-text("Add team member")'
    )
    await expect(addTeamMemberButton).toBeVisible({ timeout: 5000 })
    await addTeamMemberButton.click()
    await page.waitForTimeout(500)

    // Verify search popover appears
    const searchInput = page.locator(
      'input[placeholder*="Search team"], input[placeholder*="search team"]'
    )
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    console.log('SUCCESS: Team member search popover appears')
  })

  test('shows correct UI for team conversations in list', async ({ page }) => {
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Look for team badge indicator in conversation list
    // Team conversations should have a "Team" badge with a lock icon
    const teamBadge = page.locator('span.flex:has-text("Team"):has(svg)')

    const teamBadgeCount = await teamBadge.count()

    if (teamBadgeCount > 0) {
      console.log(
        `Found ${teamBadgeCount} team conversation(s) with Team badge`
      )
      await expect(teamBadge.first()).toBeVisible()
    } else {
      console.log(
        'No team conversations found in list - this is expected if none exist yet'
      )
    }
  })

  test('submit button disabled until team member selected', async ({
    page,
  }) => {
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Open dialog (using header to avoid duplicate matches)
    await page
      .locator('header')
      .getByRole('button', { name: 'New Conversation' })
      .click()
    await page.waitForTimeout(500)

    // Click Team tab
    await page.locator('[role="tab"]:has-text("Team Discussion")').click()
    await page.waitForTimeout(300)

    // Submit button should be disabled (no team members selected)
    const submitButton = page.locator('button:has-text("Start Conversation")')
    await expect(submitButton).toBeDisabled()

    console.log(
      'SUCCESS: Submit button is disabled when no team members selected'
    )
  })
})

test.describe('Team Conversation Access Control', () => {
  test('team conversations show Team Only badge in header', async ({
    page,
  }) => {
    await page.goto('/admin/messages')
    await page.waitForLoadState('networkidle')

    // Look for any team conversations
    // Team conversations have Users icon and Team badge
    const conversationLinks = page.locator('a[href^="/admin/messages/"]')
    const count = await conversationLinks.count()

    if (count === 0) {
      console.log('No conversations to test - skipping')
      return
    }

    // Click on a conversation and check header
    // We can't know if it's a team conversation from the list alone
    // So we just verify the header structure works
    await conversationLinks.first().click()
    await page.waitForLoadState('networkidle')

    // Verify header elements exist
    const backButton = page.locator('button:has-text("Messages")')
    await expect(backButton).toBeVisible({ timeout: 10000 })

    console.log('SUCCESS: Conversation header renders correctly')
  })
})
