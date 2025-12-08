'use client'

import Link from 'next/link'
import { useOptionalPersonalization } from './personalization-provider'
import { FadeIn } from '@/components/ui/fade-in'
import { Button } from '@/components/ui/button'

interface PersonalizedBannerProps {
  className?: string
}

/**
 * Personalized Banner Component
 *
 * Shows a contextual banner based on visitor's profile:
 * - Timeline message for pregnant visitors
 * - Welcome back for returning clients
 * - Service area message for local visitors
 */
export function PersonalizedBanner({
  className = '',
}: PersonalizedBannerProps) {
  const personalization = useOptionalPersonalization()

  // Don't render if no context, loading, or no personalized message
  if (
    !personalization ||
    personalization.isLoading ||
    (!personalization.content?.timelineMessage &&
      personalization.profile?.visitCount === 1)
  ) {
    return null
  }

  const { profile, content } = personalization

  // For returning clients, show a special welcome back
  if (profile?.isClient) {
    return (
      <FadeIn>
        <div
          className={`rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">
                {content?.greeting || 'Welcome back!'}
              </p>
              <p className="text-sm text-muted-foreground">
                Access your documents, invoices, and appointments.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/client/dashboard">Go to Portal</Link>
            </Button>
          </div>
        </div>
      </FadeIn>
    )
  }

  // For expecting visitors with due date
  if (content?.timelineMessage) {
    return (
      <FadeIn>
        <div
          className={`rounded-lg border border-secondary/20 bg-secondary/5 p-4 ${className}`}
        >
          <p className="text-sm text-foreground">{content.timelineMessage}</p>
        </div>
      </FadeIn>
    )
  }

  // For returning visitors (not first visit)
  if (profile && profile.visitCount > 1) {
    return (
      <FadeIn>
        <div
          className={`rounded-lg border border-border/50 bg-muted/30 p-4 ${className}`}
        >
          <p className="text-sm text-foreground">{content?.greeting}</p>
          {content?.serviceAreaMessage && (
            <p className="mt-1 text-xs text-muted-foreground">
              {content.serviceAreaMessage}
            </p>
          )}
        </div>
      </FadeIn>
    )
  }

  return null
}
