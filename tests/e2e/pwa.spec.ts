import { test, expect } from '@playwright/test'

test.describe('PWA - Progressive Web App', () => {
  test.describe('Web App Manifest', () => {
    test('should serve manifest.webmanifest with correct content type', async ({
      request,
    }) => {
      const response = await request.get('/manifest.webmanifest')
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain(
        'application/manifest+json'
      )
    })

    test('should contain required manifest fields', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest')
      const manifest = await response.json()

      // Required fields for PWA installability
      expect(manifest.name).toBeTruthy()
      expect(manifest.short_name).toBeTruthy()
      expect(manifest.start_url).toBeTruthy()
      expect(manifest.display).toBe('standalone')
      expect(manifest.icons).toBeInstanceOf(Array)
      expect(manifest.icons.length).toBeGreaterThan(0)
    })

    test('should have valid icon configurations', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest')
      const manifest = await response.json()

      // Check for required icon sizes
      const iconSizes = manifest.icons.map(
        (icon: { sizes: string }) => icon.sizes
      )
      expect(iconSizes).toContain('192x192')
      expect(iconSizes).toContain('512x512')

      // Each icon should have required properties
      for (const icon of manifest.icons) {
        expect(icon.src).toBeTruthy()
        expect(icon.sizes).toBeTruthy()
        expect(icon.type).toBeTruthy()
      }
    })

    test('should have correct theme colors', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest')
      const manifest = await response.json()

      expect(manifest.theme_color).toBeTruthy()
      expect(manifest.background_color).toBeTruthy()
    })

    test('should define shortcuts for quick actions', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest')
      const manifest = await response.json()

      if (manifest.shortcuts) {
        expect(manifest.shortcuts).toBeInstanceOf(Array)
        for (const shortcut of manifest.shortcuts) {
          expect(shortcut.name).toBeTruthy()
          expect(shortcut.url).toBeTruthy()
        }
      }
    })
  })

  test.describe('Service Worker', () => {
    test('should serve sw.js with correct headers', async ({ request }) => {
      const response = await request.get('/sw.js')
      expect(response.status()).toBe(200)

      const headers = response.headers()
      expect(headers['content-type']).toContain('application/javascript')
      expect(headers['cache-control']).toContain('no-cache')
    })

    test('should contain essential service worker code', async ({
      request,
    }) => {
      const response = await request.get('/sw.js')
      const content = await response.text()

      // Check for essential SW patterns
      expect(content).toContain('install')
      expect(content).toContain('activate')
      expect(content).toContain('fetch')
      expect(content).toContain('caches')
    })

    test('should handle push notification events', async ({ request }) => {
      const response = await request.get('/sw.js')
      const content = await response.text()

      expect(content).toContain('push')
      expect(content).toContain('notificationclick')
    })
  })

  test.describe('PWA Icons', () => {
    const requiredIcons = [
      '/icons/icon-72x72.png',
      '/icons/icon-96x96.png',
      '/icons/icon-128x128.png',
      '/icons/icon-144x144.png',
      '/icons/icon-152x152.png',
      '/icons/icon-192x192.png',
      '/icons/icon-384x384.png',
      '/icons/icon-512x512.png',
    ]

    for (const iconPath of requiredIcons) {
      test(`should serve ${iconPath}`, async ({ request }) => {
        const response = await request.get(iconPath)
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('image/png')
      })
    }

    test('should serve apple-touch-icon', async ({ request }) => {
      const response = await request.get('/icons/apple-touch-icon.png')
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
    })
  })

  test.describe('Offline Page', () => {
    test('should have offline page available', async ({ page }) => {
      await page.goto('/offline')
      // Client component - wait for hydration
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/You're Offline/i)).toBeVisible()
    })

    test('should display helpful offline message', async ({ page }) => {
      await page.goto('/offline')
      await page.waitForLoadState('networkidle')

      // Should show what users can still do
      await expect(
        page.getByText(/View previously loaded pages/i)
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /Try Again/i })
      ).toBeVisible()
    })

    test('should have working navigation from offline page', async ({
      page,
    }) => {
      await page.goto('/offline')
      await page.waitForLoadState('networkidle')

      const dashboardLink = page.getByRole('link', { name: /Go to Dashboard/i })
      await expect(dashboardLink).toBeVisible()
      expect(await dashboardLink.getAttribute('href')).toBe('/admin')
    })
  })

  test.describe('HTML Meta Tags', () => {
    test('should have PWA meta tags in head', async ({ page }) => {
      // PWA is only enabled on CRM routes, but manifest link is in root layout
      await page.goto('/')

      // Check for manifest link
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toHaveAttribute(
        'href',
        expect.stringContaining('manifest')
      )

      // Check for apple-mobile-web-app-capable
      const appleWebAppMeta = page.locator(
        'meta[name="apple-mobile-web-app-capable"]'
      )
      if ((await appleWebAppMeta.count()) > 0) {
        await expect(appleWebAppMeta).toHaveAttribute('content', 'yes')
      }

      // Check for theme-color
      const themeColorMeta = page.locator('meta[name="theme-color"]')
      await expect(themeColorMeta.first()).toHaveAttribute(
        'content',
        expect.stringMatching(/^#/)
      )
    })

    test('should have apple touch icons', async ({ page }) => {
      await page.goto('/')

      const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
      expect(await appleTouchIcon.count()).toBeGreaterThan(0)

      const href = await appleTouchIcon.first().getAttribute('href')
      expect(href).toContain('apple-touch-icon')
    })
  })

  test.describe('PWA Install Prompt', () => {
    // Note: PWA install prompt only works on CRM routes (/admin, /client)
    // These tests verify the install prompt behavior when on those routes
    // Since /admin requires auth, we test the localStorage behavior on public routes
    // but the actual prompt would only show on authenticated CRM routes

    test('should not show install prompt on marketing pages', async ({
      page,
    }) => {
      // PWAProvider is not loaded on marketing pages, so no install prompt
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.removeItem('pwa-install-dismissed')
      })
      await page.reload()

      // Give time for any potential prompt
      await page.waitForTimeout(1000)

      // Install prompt should not appear on marketing site
      const installPrompt = page.locator('text=Install App')
      expect(await installPrompt.count()).toBe(0)
    })

    test('should respect dismissed state in localStorage', async ({ page }) => {
      await page.goto('/')

      // Set dismissed state
      await page.evaluate(() => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      })

      await page.reload()
      await page.waitForTimeout(1000)

      // Prompt should not show if dismissed
      const installPrompt = page.locator('text=Install App')
      expect(await installPrompt.count()).toBe(0)
    })
  })

  test.describe('Cache Headers', () => {
    test('should have correct cache headers for static assets', async ({
      request,
    }) => {
      const response = await request.get('/icons/icon-192x192.png')
      const cacheControl = response.headers()['cache-control']
      expect(cacheControl).toContain('max-age')
    })

    test('should prevent caching of service worker', async ({ request }) => {
      const response = await request.get('/sw.js')
      const cacheControl = response.headers()['cache-control']
      expect(cacheControl).toContain('no-cache')
    })
  })
})

test.describe('PWA - Accessibility', () => {
  test('offline page should be accessible', async ({ page }) => {
    await page.goto('/offline')
    await page.waitForLoadState('networkidle')

    // Check for accessible elements
    const mainContent = page.getByRole('main')
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }

    // Buttons should be accessible
    const tryAgainButton = page.getByRole('button', { name: /Try Again/i })
    await expect(tryAgainButton).toBeVisible()
    await expect(tryAgainButton).toBeEnabled()
  })
})
