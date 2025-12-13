/**
 * Error Logging Utility
 *
 * Provides a centralized way to log errors throughout the application.
 * Integrates with Sentry for production error tracking.
 */

import * as Sentry from '@sentry/nextjs'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface ErrorLog {
  message: string
  stack?: string
  timestamp: string
  context?: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Map severity to Sentry levels
const severityToSentryLevel: Record<
  ErrorLog['severity'],
  Sentry.SeverityLevel
> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'fatal',
}

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  context?: ErrorContext,
  severity: ErrorLog['severity'] = 'medium'
): void {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    severity,
  }

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog)
  }

  // Send to Sentry in production (or when DSN is configured)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope(scope => {
      // Set severity level
      scope.setLevel(severityToSentryLevel[severity])

      // Add context as tags and extra data
      if (context?.component) {
        scope.setTag('component', context.component)
      }
      if (context?.action) {
        scope.setTag('action', context.action)
      }
      if (context?.userId) {
        scope.setUser({ id: context.userId })
      }
      if (context?.metadata) {
        scope.setExtras(context.metadata)
      }

      // Capture the exception
      Sentry.captureException(error)
    })
  }

  // Store in session storage for debugging (last 10 errors)
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('error-logs')
      const logs: ErrorLog[] = stored ? JSON.parse(stored) : []
      logs.unshift(errorLog)
      sessionStorage.setItem('error-logs', JSON.stringify(logs.slice(0, 10)))
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Log a warning (non-critical issue)
 */
export function logWarning(message: string, context?: ErrorContext): void {
  const warning = {
    message,
    timestamp: new Date().toISOString(),
    context,
    severity: 'low' as const,
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning logged:', warning)
  }
}

/**
 * Get stored error logs (for debugging)
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const stored = sessionStorage.getItem('error-logs')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear stored error logs
 */
export function clearErrorLogs(): void {
  try {
    sessionStorage.removeItem('error-logs')
  } catch {
    // Ignore storage errors
  }
}
