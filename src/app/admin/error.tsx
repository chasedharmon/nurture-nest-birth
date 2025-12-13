'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

/**
 * Admin Error Boundary
 *
 * This error boundary is specific to the admin section and provides
 * admin-friendly error messages and recovery options.
 * Automatically reports errors to Sentry in production.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console
    console.error('[Admin Error]', error)

    // Send to Sentry with admin context
    Sentry.captureException(error, {
      tags: {
        section: 'admin',
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Nurture Nest Birth CRM
          </h1>
        </div>
      </header>

      {/* Error Content */}
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="font-serif text-2xl">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              We encountered an error while loading this page. This has been
              logged and we&apos;ll look into it. In the meantime, you can try
              refreshing or navigating to a different section.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="rounded-lg border border-border bg-muted/50 p-4">
                <summary className="flex cursor-pointer items-center gap-2 font-medium">
                  <Bug className="h-4 w-4" />
                  Error Details (Dev Only)
                </summary>
                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Message:
                    </span>
                    <p className="mt-1 rounded bg-background p-2 font-mono text-sm text-destructive">
                      {error.message}
                    </p>
                  </div>
                  {error.digest && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Error ID:
                      </span>
                      <p className="mt-1 font-mono text-sm">{error.digest}</p>
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Stack Trace:
                      </span>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-background p-2 font-mono text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/admin">
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs text-muted-foreground">
              If this problem persists, try signing out and back in, or contact
              support.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
