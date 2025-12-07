'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyMagicLink } from '@/app/actions/client-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  )
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided.')
        return
      }

      const result = await verifyMagicLink(token)

      if (result.success) {
        setStatus('success')
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/client/dashboard')
        }, 1000)
      } else {
        setStatus('error')
        setErrorMessage(
          result.error || 'Verification failed. Please try again.'
        )
      }
    }

    verify()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' &&
              'Please wait while we verify your login link...'}
            {status === 'success' && 'Redirecting you to your dashboard...'}
            {status === 'error' &&
              'There was a problem verifying your login link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center">
              <div className="text-green-600 dark:text-green-400 text-5xl mb-4">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;ve been successfully logged in!
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-sm">
                {errorMessage}
              </div>
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Your login link may have expired or been used already.</p>
                <Link
                  href="/client/login"
                  className="block text-primary hover:underline"
                >
                  Request a new login link
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ClientVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verifying...</CardTitle>
              <CardDescription>
                Please wait while we verify your login link...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
