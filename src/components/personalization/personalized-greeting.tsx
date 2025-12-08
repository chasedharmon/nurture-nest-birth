'use client'

import { useOptionalPersonalization } from './personalization-provider'
import { FadeIn } from '@/components/ui/fade-in'

interface PersonalizedGreetingProps {
  fallback?: string
  className?: string
  showServiceArea?: boolean
}

/**
 * Personalized Greeting Component
 *
 * Displays a personalized greeting based on visitor profile.
 * Falls back to a generic greeting if no profile is available.
 */
export function PersonalizedGreeting({
  fallback = 'Welcome!',
  className = '',
  showServiceArea = false,
}: PersonalizedGreetingProps) {
  const personalization = useOptionalPersonalization()

  // If no context or still loading, show nothing (SSR safe)
  if (!personalization || personalization.isLoading) {
    return null
  }

  const { content } = personalization
  const greeting = content?.greeting || fallback

  return (
    <FadeIn>
      <div className={className}>
        <p className="text-lg font-medium text-foreground">{greeting}</p>
        {showServiceArea && content?.serviceAreaMessage && (
          <p className="mt-1 text-sm text-muted-foreground">
            {content.serviceAreaMessage}
          </p>
        )}
      </div>
    </FadeIn>
  )
}
