/**
 * Email Configuration
 *
 * Centralized email settings. In multi-tenant future,
 * these would be pulled from tenant config.
 */

import { siteConfig } from '@/config/site'

export const emailConfig = {
  // Sender info
  from: {
    // Default from address (Resend requires verified domain or onboarding@resend.dev)
    email: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    name: siteConfig.business.name,
  },

  // Reply-to address
  replyTo: siteConfig.contact.email,

  // Admin notification recipient
  adminEmail: process.env.CONTACT_EMAIL || siteConfig.contact.email,

  // URLs for email links
  urls: {
    portal: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/client`
      : 'http://localhost:3000/client',
    website: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Branding for templates
  branding: {
    name: siteConfig.business.name,
    tagline: siteConfig.business.tagline,
    primaryColor: '#7c3aed', // Purple
    secondaryColor: '#ec4899', // Pink
    logoUrl: '', // TODO: Add logo URL when available
  },

  // Doula info for templates
  doula: {
    name: siteConfig.business.owner,
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
  },
} as const

export type EmailConfigType = typeof emailConfig
