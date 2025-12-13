'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Super Admin Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading the super admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
            <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-slate-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={reset} variant="outline" className="flex-1">
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="default" className="w-full">
                Go home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
