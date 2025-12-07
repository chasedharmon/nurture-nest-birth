# Testing Guide

This document provides guidance on testing the Nurture Nest Birth website.

## Testing Strategy

### Test Types

1. **E2E Tests (Playwright)** - User journey testing ⭐ Primary focus
2. **Unit Tests (Vitest)** - Component and utility testing (Future)
3. **Manual Testing** - Visual and UX testing

## Playwright E2E Testing

### Setup (When Ready to Run Tests)

```bash
# Install Playwright
pnpm add -D @playwright/test

# Install browsers
pnpm exec playwright install
```

### Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm test:e2e --headed

# Run tests in UI mode (interactive)
pnpm test:e2e --ui

# Run specific test file
pnpm test:e2e tests/e2e/homepage.spec.ts
```

## Test Scenarios

### Critical User Journeys

#### 1. Homepage Visit

**Goal**: Verify homepage loads and displays key content

- ✅ Hero section visible
- ✅ Services overview visible
- ✅ CTA buttons present
- ✅ Navigation works
- ✅ Animations play smoothly

#### 2. Service Discovery

**Goal**: User can browse and learn about services

- ✅ Navigate from homepage to services
- ✅ Each service page loads
- ✅ Service details visible
- ✅ Can navigate between services
- ✅ Back to services index works

#### 3. Content Consumption

**Goal**: User can read blog content

- ✅ Blog index loads
- ✅ Blog posts are listed
- ✅ Can click into a blog post
- ✅ Blog content is readable
- ✅ Back to blog button works

#### 4. Contact Journey

**Goal**: User can find contact information

- ✅ Contact page loads
- ✅ Contact info displayed
- ✅ FAQ page accessible
- ✅ Pricing information visible

#### 5. Mobile Experience

**Goal**: Site works on mobile devices

- ✅ Responsive layout at 375px (mobile)
- ✅ Navigation accessible on mobile
- ✅ Content readable
- ✅ Touch targets appropriately sized

#### 6. Accessibility

**Goal**: Site is accessible

- ✅ Keyboard navigation works
- ✅ Focus states visible
- ✅ Headings in correct order
- ✅ Alt text on images
- ✅ Form labels present (when forms added)

## Test Example

Here's what a Playwright test looks like:

```typescript
// tests/e2e/homepage.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check title
    await expect(page).toHaveTitle(/Nurture Nest Birth/)

    // Check hero is visible
    const hero = page.locator('h1').first()
    await expect(hero).toBeVisible()

    // Check CTA buttons
    const ctaButtons = page.locator('a:has-text("Schedule")')
    await expect(ctaButtons.first()).toBeVisible()
  })

  test('should navigate to services', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Click services link
    await page.click('a[href="/services"]')

    // Verify we're on services page
    await expect(page).toHaveURL(/\/services/)
    await expect(page.locator('h1')).toContainText('Services')
  })
})
```

## Manual Testing Checklist

### Before Each Deploy

#### Visual QA

- [ ] All pages load without errors
- [ ] Images display correctly
- [ ] Fonts load properly
- [ ] Colors appear correct
- [ ] Animations are smooth
- [ ] No layout shifts

#### Responsive Testing

- [ ] Mobile (375px) - iPhone SE
- [ ] Tablet (768px) - iPad
- [ ] Desktop (1440px) - MacBook
- [ ] Large Desktop (1920px)

#### Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

#### Navigation

- [ ] All internal links work
- [ ] External links open in new tab
- [ ] Back button works correctly
- [ ] 404 page displays for bad URLs

#### SEO

- [ ] View source shows content (not empty)
- [ ] Meta tags present
- [ ] OpenGraph tags present
- [ ] Structured data valid (test with Google Rich Results Test)
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt

#### Performance

- [ ] Pages load in < 2 seconds
- [ ] No console errors
- [ ] No console warnings (except known React warnings)
- [ ] Images lazy load
- [ ] Fonts don't cause layout shift

#### Accessibility

- [ ] Can tab through all interactive elements
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA
- [ ] Headings are in logical order
- [ ] Images have alt text
- [ ] Links have descriptive text

## Common Issues to Watch For

### Performance

- ❌ Unoptimized images (use next/image)
- ❌ Large bundle sizes (check build output)
- ❌ Unnecessary client components
- ❌ Missing loading states

### Accessibility

- ❌ Missing alt text on images
- ❌ Non-descriptive link text ("click here")
- ❌ Poor color contrast
- ❌ Missing form labels
- ❌ Keyboard navigation broken

### SEO

- ❌ Missing meta descriptions
- ❌ Duplicate titles
- ❌ Missing canonical URLs
- ❌ Broken internal links
- ❌ Missing structured data

### Mobile

- ❌ Text too small to read
- ❌ Touch targets too small
- ❌ Horizontal scrolling
- ❌ Overlapping content
- ❌ Hidden navigation

## Test Automation (Future)

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - name: Run Playwright tests
        run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Tools

### Recommended Browser Extensions

- **Lighthouse** (Chrome DevTools) - Performance auditing
- **axe DevTools** - Accessibility testing
- **React Developer Tools** - Component debugging
- **WAVE** - Accessibility evaluation

### Online Tools

- [PageSpeed Insights](https://pagespeed.web.dev/) - Performance
- [Google Rich Results Test](https://search.google.com/test/rich-results) - Structured data
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly) - Mobile UX
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Color contrast

## When to Run Tests

### Always

- Before committing major features
- Before deploying to production
- After updating dependencies
- After making layout changes

### Regularly

- Weekly during active development
- Monthly during maintenance
- After reported bugs

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Web Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Last Updated**: December 6, 2025
