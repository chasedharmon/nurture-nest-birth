'use client'

import Link from 'next/link'
import { type ComponentProps } from 'react'
import { trackCTAClick } from '@/lib/analytics'

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  ctaText: string
  ctaLocation: string
}

/**
 * Tracked Link Component
 *
 * A wrapper around Next.js Link that automatically tracks CTA clicks.
 *
 * Usage:
 * <TrackedLink
 *   href="/contact"
 *   ctaText="Schedule Consultation"
 *   ctaLocation="hero"
 * >
 *   Schedule Consultation
 * </TrackedLink>
 */
export function TrackedLink({
  ctaText,
  ctaLocation,
  href,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Track the CTA click
    trackCTAClick({
      cta_text: ctaText,
      cta_location: ctaLocation,
      destination: href.toString(),
    })

    // Call original onClick if provided
    onClick?.(event)
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}
