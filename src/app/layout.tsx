import type { Metadata, Viewport } from 'next'
import { Inter, Lora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SkipToContent } from '@/components/ui/skip-to-content'
import { PersonalizationProvider } from '@/components/personalization'
import {
  ConditionalHeader,
  ConditionalFooter,
} from '@/components/layout/conditional-layout'
import {
  JSONLDScript,
  getOrganizationSchema,
  getLocalBusinessSchema,
} from '@/lib/schema'
import { PWAProvider } from '@/components/pwa'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Support for notched devices
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B4513' },
    { media: '(prefers-color-scheme: dark)', color: '#5D2E0C' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nurturenestbirth.com'),
  title: {
    default: 'Nurture Nest Birth | Professional Doula in Kearney, Nebraska',
    template: '%s | Nurture Nest Birth',
  },
  description:
    'Compassionate, evidence-based doula care in Central Nebraska and beyond. Birth support, postpartum doula services, infant feeding support, and more. Professionally trained with multiple certifications.',
  keywords: [
    'doula Kearney Nebraska',
    'birth doula',
    'postpartum doula',
    'infant feeding support',
    'Kearney NE',
    'professional doula',
    'doula Grand Island',
    'doula Hastings',
    'Nebraska doula',
    'Central Nebraska doula',
  ],
  authors: [{ name: 'Nurture Nest Birth' }],
  creator: 'Nurture Nest Birth',
  publisher: 'Nurture Nest Birth',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nurturenestbirth.com',
    siteName: 'Nurture Nest Birth',
    title: 'Nurture Nest Birth | Professional Doula in Kearney, Nebraska',
    description:
      'Compassionate, evidence-based doula care in Central Nebraska and beyond. Birth support, postpartum doula services, infant feeding support, and more.',
    images: [
      {
        url: '/images/hero-newborn.jpg',
        width: 1920,
        height: 1080,
        alt: 'Nurture Nest Birth - Doula Care in Kearney, Nebraska',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nurture Nest Birth | Professional Doula in Kearney, Nebraska',
    description:
      'Compassionate, evidence-based doula care in Central Nebraska and beyond.',
    images: ['/images/hero-newborn.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when ready
    // google: 'verification-code-here',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NNB CRM',
  },
  applicationName: 'Nurture Nest Birth CRM',
  manifest: '/manifest.webmanifest',
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <JSONLDScript data={getOrganizationSchema()} />
        <JSONLDScript data={getLocalBusinessSchema()} />
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        {/* Favicon variants */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        <PWAProvider showInstallPrompt={true} showUpdateBanner={true}>
          <PersonalizationProvider>
            <SkipToContent />
            <ConditionalHeader />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <ConditionalFooter />
          </PersonalizationProvider>
        </PWAProvider>
        <Analytics />
      </body>
    </html>
  )
}
