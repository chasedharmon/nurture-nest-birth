import type { MetadataRoute } from 'next'

/**
 * Web App Manifest for Progressive Web App (PWA) functionality.
 *
 * This manifest defines how the app appears when installed on a device:
 * - App name and icons shown on home screen
 * - Display mode (standalone = app-like, no browser UI)
 * - Theme and background colors
 * - Start URL when launched
 * - Screenshots for app stores
 *
 * Next.js automatically serves this at /manifest.webmanifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nurture Nest Birth CRM',
    short_name: 'NNB CRM',
    description:
      'Professional doula practice management - clients, appointments, workflows, and billing in one place.',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fdf8f4',
    theme_color: '#8B4513',
    categories: ['business', 'productivity', 'health'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Maskable icons (with safe zone padding)
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-dashboard.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard - Desktop View',
      },
      {
        src: '/screenshots/mobile-clients.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Clients - Mobile View',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/admin',
        icons: [{ src: '/icons/shortcut-dashboard.png', sizes: '96x96' }],
      },
      {
        name: 'Clients',
        short_name: 'Clients',
        url: '/admin/clients',
        icons: [{ src: '/icons/shortcut-clients.png', sizes: '96x96' }],
      },
      {
        name: 'Calendar',
        short_name: 'Calendar',
        url: '/admin/calendar',
        icons: [{ src: '/icons/shortcut-calendar.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
