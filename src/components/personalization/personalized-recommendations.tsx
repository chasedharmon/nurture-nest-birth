'use client'

import Link from 'next/link'
import { useOptionalPersonalization } from './personalization-provider'
import { FadeIn } from '@/components/ui/fade-in'

interface PersonalizedRecommendationsProps {
  className?: string
  maxItems?: number
}

/**
 * Personalized Service Recommendations
 *
 * Shows service recommendations based on:
 * - Visitor's expressed interests
 * - Pages they've viewed
 * - Their pregnancy trimester (if known)
 */
export function PersonalizedRecommendations({
  className = '',
  maxItems = 2,
}: PersonalizedRecommendationsProps) {
  const personalization = useOptionalPersonalization()

  // Don't render if no recommendations or still loading
  if (
    !personalization ||
    personalization.isLoading ||
    !personalization.content?.recommendedServices?.length
  ) {
    return null
  }

  const recommendations = personalization.content.recommendedServices.slice(
    0,
    maxItems
  )

  return (
    <FadeIn>
      <div className={className}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recommended for You
        </h3>
        <ul className="mt-3 space-y-2">
          {recommendations.map(service => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary">
                    {service.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {service.reason}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  )
}
