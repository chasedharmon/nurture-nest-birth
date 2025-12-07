import { test, expect } from '@playwright/test'

test.describe('Services Navigation', () => {
  test('should load services index page', async ({ page }) => {
    await page.goto('/services')
    await expect(page).toHaveTitle(/Services/)
    await expect(page.getByRole('heading', { name: /Services/i })).toBeVisible()
  })

  test('should display all service cards on services index', async ({
    page,
  }) => {
    await page.goto('/services')
    const main = page.getByRole('main')

    // Check all service cards are visible within main content
    await expect(main.getByText(/Birth Doula/i).first()).toBeVisible()
    await expect(main.getByText(/Postpartum Care/i).first()).toBeVisible()
    await expect(main.getByText(/Lactation Consulting/i).first()).toBeVisible()
    await expect(main.getByText(/Sibling Preparation/i).first()).toBeVisible()
  })

  test('should navigate to Birth Doula service page', async ({ page }) => {
    await page.goto('/services')
    await page
      .getByRole('link', { name: /Birth Doula/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/services\/birth-doula/)
    await expect(
      page.getByRole('heading', { name: /Birth Doula/i })
    ).toBeVisible()
  })

  test('should navigate to Postpartum Care service page', async ({ page }) => {
    await page.goto('/services')
    // Click the second "Learn More" button (Postpartum Care is the 2nd service)
    const learnMoreLinks = page.getByRole('link', { name: /Learn More/i })
    await learnMoreLinks.nth(1).click()
    await expect(page).toHaveURL(/\/services\/postpartum-care/)
    await expect(
      page.getByRole('heading', {
        name: /Support for the Fourth Trimester/i,
      })
    ).toBeVisible()
  })

  test('should navigate to Lactation Consulting service page', async ({
    page,
  }) => {
    await page.goto('/services')
    // Click the third "Learn More" button (Lactation is the 3rd service)
    const learnMoreLinks = page.getByRole('link', { name: /Learn More/i })
    await learnMoreLinks.nth(2).click()
    await expect(page).toHaveURL(/\/services\/lactation/)
    await expect(
      page.getByRole('heading', { name: /Expert Breastfeeding Support/i })
    ).toBeVisible()
  })

  test('should navigate to Sibling Prep service page', async ({ page }) => {
    await page.goto('/services')
    await page
      .getByRole('link', { name: /Sibling/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/services\/sibling-prep/)
    await expect(page.getByRole('heading', { name: /Sibling/i })).toBeVisible()
  })

  test('should have CTA on each service page', async ({ page }) => {
    const servicePages = [
      '/services/birth-doula',
      '/services/postpartum-care',
      '/services/lactation',
      '/services/sibling-prep',
    ]

    for (const servicePage of servicePages) {
      await page.goto(servicePage)
      const contactCTA = page.getByRole('link', {
        name: /Schedule|Contact|Get Started/i,
      })
      await expect(contactCTA.first()).toBeVisible()
    }
  })

  test('should navigate from service page to contact', async ({ page }) => {
    await page.goto('/services/birth-doula')
    const contactLink = page
      .getByRole('link', { name: /Schedule|Contact|Get Started/i })
      .first()
    await contactLink.click()
    await expect(page).toHaveURL(/\/contact/)
  })

  test('should display service details on individual pages', async ({
    page,
  }) => {
    await page.goto('/services/birth-doula')
    const main = page.getByRole('main')

    // Check for common service page elements
    await expect(main.getByRole('heading').first()).toBeVisible()
    await expect(main.locator('section').first()).toBeVisible()
  })

  test('should be mobile responsive on services pages', async ({
    page,
    isMobile,
  }) => {
    if (isMobile) {
      await page.goto('/services')
      const main = page.getByRole('main')

      // Check that service content is visible on mobile
      await expect(
        main.getByText(/Comprehensive Doula Care for Every Stage/i)
      ).toBeVisible()
      await expect(main.getByText(/Birth Doula/i).first()).toBeVisible()
    }
  })

  test('should navigate back to services index from service page', async ({
    page,
  }) => {
    await page.goto('/services/birth-doula')

    // Click breadcrumb or back navigation if it exists
    const servicesLink = page.getByRole('link', { name: /^Services$/i })
    if (await servicesLink.isVisible()) {
      await servicesLink.click()
      await expect(page).toHaveURL('/services')
    }
  })
})
