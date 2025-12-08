'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useOptionalPersonalization } from './personalization-provider'
import { Button } from '@/components/ui/button'

interface PersonalizedCtaProps extends Omit<
  ComponentProps<typeof Button>,
  'children'
> {
  fallbackText?: string
  fallbackHref?: string
}

/**
 * Personalized CTA Button
 *
 * Shows a call-to-action tailored to the visitor's journey stage.
 * - Clients: "Go to Your Portal"
 * - Leads/Prospects: "Schedule a Consultation"
 * - Third trimester: "Book a Consultation Today"
 * - Everyone else: "Get Started"
 */
export function PersonalizedCta({
  fallbackText = 'Get Started',
  fallbackHref = '/contact',
  ...buttonProps
}: PersonalizedCtaProps) {
  const personalization = useOptionalPersonalization()

  const cta = personalization?.content?.primaryCta || {
    text: fallbackText,
    href: fallbackHref,
  }

  return (
    <Button asChild {...buttonProps}>
      <Link href={cta.href}>{cta.text}</Link>
    </Button>
  )
}
