/**
 * Sentry Edge Configuration
 *
 * This file configures the Sentry SDK for edge runtime error tracking.
 * It captures errors in middleware and edge API routes.
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Performance monitoring sample rate
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Additional tags for filtering
    initialScope: {
      tags: {
        app: 'nurture-nest-birth',
        component: 'edge',
      },
    },
  })
}
