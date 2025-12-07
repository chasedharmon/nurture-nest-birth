import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Nurture Nest Birth/)
    await expect(
      page.getByRole('heading', { name: /Compassionate Birth Support/i })
    ).toBeVisible()
  })

  test('should display hero section with CTA buttons', async ({ page }) => {
    const heroSection = page.locator('section').first()
    await expect(heroSection).toBeVisible()

    // Check for primary CTA
    const scheduleCTA = heroSection.getByRole('link', {
      name: /Schedule Your Free Consultation/i,
    })
    await expect(scheduleCTA).toBeVisible()

    // Check for secondary CTA
    const servicesCTA = heroSection.getByRole('link', {
      name: /Explore My Services/i,
    })
    await expect(servicesCTA).toBeVisible()
  })

  test('should navigate to services page from hero CTA', async ({ page }) => {
    const heroSection = page.locator('section').first()
    await heroSection
      .getByRole('link', { name: /Explore My Services/i })
      .click()
    await expect(page).toHaveURL(/\/services/)
    await expect(
      page.getByRole('heading', { name: /Services/i }).first()
    ).toBeVisible()
  })

  test('should navigate to contact page from hero CTA', async ({ page }) => {
    const heroSection = page.locator('section').first()
    await heroSection
      .getByRole('link', { name: /Schedule Your Free Consultation/i })
      .click()
    await expect(page).toHaveURL(/\/contact/)
    await expect(
      page.getByRole('heading', { name: /Let's Connect/i })
    ).toBeVisible()
  })

  test('should display services overview section', async ({ page }) => {
    const main = page.getByRole('main')

    // Check for service cards within main content
    await expect(main.getByText(/Birth Doula/i).first()).toBeVisible()
    await expect(main.getByText(/Postpartum Care/i).first()).toBeVisible()
    await expect(main.getByText(/Lactation Consulting/i).first()).toBeVisible()
    await expect(main.getByText(/Sibling Preparation/i).first()).toBeVisible()
  })

  test('should navigate to individual service page from service card', async ({
    page,
  }) => {
    const birthDoulaCard = page
      .getByRole('link', { name: /Learn More/i })
      .first()
    await birthDoulaCard.click()
    await expect(page).toHaveURL(/\/services\//)
  })

  test('should display testimonials preview section', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main.getByText(/What Families Are Saying/i)).toBeVisible()
  })

  test('should navigate to testimonials page from preview CTA', async ({
    page,
  }) => {
    const viewAllTestimonials = page.getByRole('link', {
      name: /View All Testimonials/i,
    })
    if (await viewAllTestimonials.isVisible()) {
      await viewAllTestimonials.click()
      await expect(page).toHaveURL(/\/testimonials/)
    }
  })

  test('should display final CTA section', async ({ page }) => {
    await expect(page.getByText(/Ready to Start Your Journey/i)).toBeVisible()
    await expect(
      page.getByText(/Let's Connect About Your Birth Experience/i)
    ).toBeVisible()
  })

  test('should navigate to contact from final CTA', async ({ page }) => {
    const finalCTA = page
      .getByRole('link', { name: /Schedule Free Consultation/i })
      .last()
    await finalCTA.click()
    await expect(page).toHaveURL(/\/contact/)
  })

  test('should be mobile responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that content is visible on mobile
      await expect(
        page.getByRole('heading', { name: /Compassionate Birth Support/i })
      ).toBeVisible()

      // Check mobile navigation exists
      const nav = page.locator('nav')
      await expect(nav).toBeVisible()
    }
  })

  test('should have accessible navigation', async ({ page, isMobile }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()

    if (!isMobile) {
      // Check for main navigation links within nav (desktop only)
      await expect(nav.getByRole('link', { name: /About/i })).toBeVisible()
      await expect(nav.getByRole('link', { name: /Services/i })).toBeVisible()
      await expect(nav.getByRole('link', { name: /Contact/i })).toBeVisible()
    }
    // Mobile navigation might be collapsed, just verify nav exists
  })
})
