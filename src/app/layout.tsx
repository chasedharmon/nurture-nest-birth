import type { Metadata, Viewport } from 'next'
import { Inter, Lora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SkipToContent } from '@/components/ui/skip-to-content'
import {
  JSONLDScript,
  getOrganizationSchema,
  getLocalBusinessSchema,
} from '@/lib/schema'
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
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nurturenestbirth.com'),
  title: {
    default: 'Nurture Nest Birth | DONA-Certified Doula in Kearney, Nebraska',
    template: '%s | Nurture Nest Birth',
  },
  description:
    'Compassionate, evidence-based doula care in Kearney, Nebraska. Birth support, postpartum care, lactation consulting, and sibling preparation. DONA-certified with over 3 years experience.',
  keywords: [
    'doula Kearney Nebraska',
    'birth doula',
    'postpartum doula',
    'lactation consultant',
    'Kearney NE',
    'DONA certified',
    'doula Grand Island',
    'doula Hastings',
    'Nebraska doula',
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
    title: 'Nurture Nest Birth | DONA-Certified Doula in Kearney, Nebraska',
    description:
      'Compassionate, evidence-based doula care in Kearney, Nebraska. Birth support, postpartum care, lactation consulting, and sibling preparation.',
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
    title: 'Nurture Nest Birth | DONA-Certified Doula in Kearney, Nebraska',
    description:
      'Compassionate, evidence-based doula care in Kearney, Nebraska.',
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
      </head>
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        <SkipToContent />
        <Header />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
