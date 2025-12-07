'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Global Error Page
 *
 * This component is automatically used by Next.js when an error occurs
 * in the app directory. It provides a user-friendly error message and
 * recovery options.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error handler:', error)
    }

    // In production, send to error logging service
    // Example: logErrorToService(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has
            occurred. Please try again, or contact us if the problem continues.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-muted p-4 text-sm">
              <summary className="cursor-pointer font-medium">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 space-y-2">
                <p className="text-xs">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs">
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
                {error.stack && (
                  <pre className="overflow-auto text-xs">{error.stack}</pre>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} size="sm">
              Try Again
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Return Home</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
