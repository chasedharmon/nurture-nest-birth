'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, FileText, Shield } from 'lucide-react'
import { acceptTerms } from '@/app/actions/terms'

function AcceptTermsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin'

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = termsAccepted && privacyAccepted && !isSubmitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    const result = await acceptTerms()

    if (result.success) {
      router.push(redirectTo)
      router.refresh()
    } else {
      setError(result.error || 'Failed to accept terms. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Terms & Privacy</CardTitle>
          <CardDescription>
            Please review and accept our Terms of Service and Privacy Policy to
            continue using Nurture Nest Birth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={checked =>
                    setTermsAccepted(checked === true)
                  }
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="terms"
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms of Service
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you agree to be bound by our{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      Terms of Service
                    </a>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={checked =>
                    setPrivacyAccepted(checked === true)
                  }
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="privacy"
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Privacy Policy
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you acknowledge that you have read and
                    understand our{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <p>
                Your data is protected. We use industry-standard encryption and
                never sell your information.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit}
              size="lg"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AcceptTermsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptTermsPage() {
  return (
    <Suspense fallback={<AcceptTermsLoading />}>
      <AcceptTermsContent />
    </Suspense>
  )
}
