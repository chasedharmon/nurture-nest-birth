import { test, expect } from '@playwright/test'

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('should load contact page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact/)
    await expect(
      page.getByRole('heading', { name: /Let's Connect/i })
    ).toBeVisible()
  })

  test('should display contact form', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main.getByText(/Send Me a Message/i)).toBeVisible()
    await expect(page.getByLabel(/^Name/i)).toBeVisible()
    await expect(page.getByLabel(/^Email/i)).toBeVisible()
    await expect(page.getByLabel(/^Phone$/i)).toBeVisible()
    await expect(page.getByLabel(/^Message/i)).toBeVisible()
  })

  test('should display contact information', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(
      main.getByText(/hello@nurturenestbirth.com/i).first()
    ).toBeVisible()
    await expect(main.getByText(/\(308\) 440-5153/i).first()).toBeVisible()
    await expect(
      main.getByText(/Kearney, Grand Island, Hastings/i)
    ).toBeVisible()
  })

  test('should have required form fields marked', async ({ page }) => {
    const nameInput = page.getByLabel(/Name/i)
    const emailInput = page.getByLabel(/^Email/i)
    const messageInput = page.getByLabel(/Message/i)

    await expect(nameInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(messageInput).toHaveAttribute('required', '')
  })

  test('should validate email field type', async ({ page }) => {
    const emailInput = page.getByLabel(/^Email/i)
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should have service selection dropdown', async ({ page }) => {
    const serviceSelect = page.getByLabel(/Service Interest/i)
    await expect(serviceSelect).toBeVisible()

    // Check options exist
    await serviceSelect.selectOption('birth-doula')
    await expect(serviceSelect).toHaveValue('birth-doula')

    await serviceSelect.selectOption('postpartum-care')
    await expect(serviceSelect).toHaveValue('postpartum-care')

    await serviceSelect.selectOption('lactation')
    await expect(serviceSelect).toHaveValue('lactation')

    await serviceSelect.selectOption('sibling-prep')
    await expect(serviceSelect).toHaveValue('sibling-prep')
  })

  test('should accept phone number input', async ({ page }) => {
    const phoneInput = page.getByLabel(/Phone/i)
    await phoneInput.fill('(308) 555-1234')
    await expect(phoneInput).toHaveValue('(308) 555-1234')
  })

  test('should accept due date input', async ({ page }) => {
    const dueDateInput = page.getByLabel(/Due Date/i)
    await dueDateInput.fill('2025-06-15')
    await expect(dueDateInput).toHaveValue('2025-06-15')
  })

  test('should fill out complete form', async ({ page }) => {
    await page.getByLabel(/Name/i).fill('Jane Doe')
    await page.getByLabel(/^Email/i).fill('jane@example.com')
    await page.getByLabel(/Phone/i).fill('(308) 555-1234')
    await page.getByLabel(/Due Date/i).fill('2025-06-15')
    await page.getByLabel(/Service Interest/i).selectOption('birth-doula')
    await page
      .getByLabel(/Message/i)
      .fill('I would like to schedule a consultation.')

    // Verify all fields are filled
    await expect(page.getByLabel(/Name/i)).toHaveValue('Jane Doe')
    await expect(page.getByLabel(/^Email/i)).toHaveValue('jane@example.com')
    await expect(page.getByLabel(/Phone/i)).toHaveValue('(308) 555-1234')
    await expect(page.getByLabel(/Due Date/i)).toHaveValue('2025-06-15')
    await expect(page.getByLabel(/Service Interest/i)).toHaveValue(
      'birth-doula'
    )
    await expect(page.getByLabel(/Message/i)).toHaveValue(
      'I would like to schedule a consultation.'
    )
  })

  test('should have submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Send Message/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toHaveAttribute('type', 'submit')
  })

  test('should display Calendly placeholder', async ({ page }) => {
    await expect(
      page.getByText(/Calendly scheduling widget will appear here/i)
    ).toBeVisible()
  })

  test('should have link to FAQ page', async ({ page }) => {
    const faqLink = page.getByRole('link', { name: /View FAQ/i })
    await expect(faqLink).toBeVisible()
    await faqLink.click()
    await expect(page).toHaveURL(/\/faq/)
  })

  test('should have clickable email link', async ({ page }) => {
    const main = page.getByRole('main')
    const emailLink = main.getByRole('link', {
      name: /hello@nurturenestbirth.com/i,
    })
    await expect(emailLink).toHaveAttribute(
      'href',
      'mailto:hello@nurturenestbirth.com'
    )
  })

  test('should have clickable phone link', async ({ page }) => {
    const phoneLink = page.getByRole('link', { name: /\(308\) 440-5153/i })
    await expect(phoneLink).toHaveAttribute('href', 'tel:+13084405153')
  })

  test('should be mobile responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      await expect(
        page.getByRole('heading', { name: /Let's Connect/i })
      ).toBeVisible()
      await expect(page.getByLabel(/Name/i)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /Send Message/i })
      ).toBeVisible()
    }
  })

  test('should display consent notice', async ({ page }) => {
    await expect(
      page.getByText(/By submitting this form, you agree to be contacted/i)
    ).toBeVisible()
  })
})
