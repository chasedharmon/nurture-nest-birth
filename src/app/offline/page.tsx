'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <WifiOff className="h-8 w-8 text-amber-700" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
          <CardDescription>
            It looks like you&apos;ve lost your internet connection. Some
            features may be unavailable until you&apos;re back online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">What you can still do:</p>
            <ul className="mt-2 list-inside list-disc text-left">
              <li>View previously loaded pages</li>
              <li>Access cached client information</li>
              <li>Review your notes (if cached)</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your changes will sync automatically when you&apos;re back online.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
