/**
 * Error Logging Utility
 *
 * Provides a centralized way to log errors throughout the application.
 * In production, this can be extended to send errors to external services
 * like Sentry, LogRocket, or other error tracking platforms.
 */

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

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example integrations (commented out - add when ready):
    // sendToSentry(errorLog)
    // sendToLogRocket(errorLog)
    // sendToDatadog(errorLog)

    // For now, just log critical errors to console in production
    if (severity === 'critical') {
      console.error('Critical error:', errorLog)
    }
  }

  // Store in session storage for debugging (last 10 errors)
  try {
    const stored = sessionStorage.getItem('error-logs')
    const logs: ErrorLog[] = stored ? JSON.parse(stored) : []
    logs.unshift(errorLog)
    sessionStorage.setItem('error-logs', JSON.stringify(logs.slice(0, 10)))
  } catch {
    // Ignore storage errors
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
