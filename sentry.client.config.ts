/**
 * Sentry Client Configuration
 *
 * This file configures the Sentry SDK for browser-side error tracking.
 * It runs on every page load and captures client-side errors.
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay configuration
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integration configuration
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out non-actionable errors
    ignoreErrors: [
      // Network errors that are expected
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // Browser extension errors
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // Common third-party script errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // User cancellation
      'AbortError: The operation was aborted',
      'AbortError: The user aborted a request',
    ],

    // Additional filtering
    beforeSend(event, _hint) {
      // Don't send errors in development (still log them locally)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry] Would have sent:', event)
        return null
      }

      // Filter out errors from bot traffic
      const userAgent = event.request?.headers?.['user-agent'] || ''
      if (/bot|crawler|spider|crawling/i.test(userAgent)) {
        return null
      }

      // Add user context if available
      const userId =
        typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null
      if (userId) {
        event.user = { ...event.user, id: userId }
      }

      return event
    },

    // Additional tags for filtering
    initialScope: {
      tags: {
        app: 'nurture-nest-birth',
        component: 'client',
      },
    },
  })
}
