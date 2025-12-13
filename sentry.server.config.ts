/**
 * Sentry Server Configuration
 *
 * This file configures the Sentry SDK for server-side error tracking.
 * It captures errors in server components, API routes, and server actions.
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

    // Filter out non-actionable errors
    ignoreErrors: [
      // Expected errors
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      // Database connection issues that are transient
      'ECONNRESET',
      'ETIMEDOUT',
    ],

    // Additional filtering
    beforeSend(event, hint) {
      const error = hint.originalException

      // Don't send redirect errors (expected behavior)
      if (error instanceof Error && error.message?.includes('NEXT_REDIRECT')) {
        return null
      }

      // Don't send 404 errors
      if (error instanceof Error && error.message?.includes('NEXT_NOT_FOUND')) {
        return null
      }

      return event
    },

    // Additional tags for filtering
    initialScope: {
      tags: {
        app: 'nurture-nest-birth',
        component: 'server',
      },
    },
  })
}
