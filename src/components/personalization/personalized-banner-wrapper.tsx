'use client'

import { PersonalizedBanner } from './personalized-banner'
import { maxWidth, spacing } from '@/lib/design-system'

/**
 * Wrapper for PersonalizedBanner to be used in server components.
 * Adds proper spacing and centering.
 */
export function PersonalizedBannerWrapper() {
  return (
    <div className={`${spacing.container} pt-4`}>
      <div className={`mx-auto ${maxWidth.layout}`}>
        <PersonalizedBanner />
      </div>
    </div>
  )
}
