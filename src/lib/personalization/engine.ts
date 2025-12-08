/**
 * Personalization Engine
 *
 * Core logic for generating personalized content based on visitor profile.
 */

import { siteConfig } from '@/config/site'
import type { VisitorProfile, PersonalizedContent } from './types'

/**
 * Calculate trimester from due date
 */
export function calculateTrimester(
  dueDate: string
): 1 | 2 | 3 | 'postpartum' | undefined {
  const due = new Date(dueDate)
  const now = new Date()
  const weeksUntilDue = Math.floor(
    (due.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  if (weeksUntilDue < 0) return 'postpartum'
  if (weeksUntilDue <= 13) return 3 // Third trimester (27-40 weeks)
  if (weeksUntilDue <= 27) return 2 // Second trimester (14-26 weeks)
  return 1 // First trimester
}

/**
 * Check if a city is in the service area
 */
export function isInServiceArea(city?: string): boolean {
  if (!city) return false
  const lowerCity = city.toLowerCase()
  return siteConfig.location.serviceArea.some(
    area => area.toLowerCase() === lowerCity
  )
}

/**
 * Get time-based greeting
 */
function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Generate personalized greeting
 */
function generateGreeting(profile: VisitorProfile): string {
  const timeGreeting = getTimeGreeting()

  if (profile.name && profile.name.trim()) {
    // Known user with name
    const firstName = profile.name.split(' ')[0]
    return `${timeGreeting}, ${firstName}!`
  }

  if (profile.isClient) {
    return `${timeGreeting}! Welcome back.`
  }

  if (profile.visitCount > 1) {
    return `${timeGreeting}! Nice to see you again.`
  }

  return `${timeGreeting}!`
}

/**
 * Generate service area message
 */
function generateServiceAreaMessage(
  profile: VisitorProfile
): string | undefined {
  if (profile.location?.city && profile.location.inServiceArea) {
    return `Proudly serving families in ${profile.location.city} and surrounding communities.`
  }

  // If we know they're in the service area but don't have the city
  if (profile.location?.inServiceArea) {
    return `Serving ${siteConfig.location.serviceArea.join(', ')}, and surrounding communities.`
  }

  return undefined
}

/**
 * Generate timeline-based message based on due date
 */
function generateTimelineMessage(profile: VisitorProfile): string | undefined {
  if (!profile.dueDate || !profile.trimester) return undefined

  const due = new Date(profile.dueDate)
  const now = new Date()
  const weeksUntilDue = Math.floor(
    (due.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  switch (profile.trimester) {
    case 1:
      return `Congratulations on your pregnancy! It's never too early to start planning your birth experience.`
    case 2:
      return `You're in the second trimester - a great time to explore doula support options!`
    case 3:
      if (weeksUntilDue <= 4) {
        return `Your due date is approaching! Let's make sure everything is in place for your birth.`
      }
      return `You're in the home stretch! Now is the perfect time to finalize your birth support plans.`
    case 'postpartum':
      return `Whether you've just welcomed your baby or are settling into parenthood, postpartum support is here for you.`
    default:
      return undefined
  }
}

/**
 * Generate recommended services based on interests and stage
 */
function generateRecommendedServices(
  profile: VisitorProfile
): PersonalizedContent['recommendedServices'] {
  const services: PersonalizedContent['recommendedServices'] = []

  if (
    profile.interests?.birthDoula ||
    profile.trimester === 2 ||
    profile.trimester === 3
  ) {
    services.push({
      slug: 'birth-doula',
      name: 'Birth Doula Support',
      reason: profile.dueDate
        ? 'Continuous support during your labor and delivery'
        : 'The cornerstone of doula support',
    })
  }

  if (profile.interests?.postpartumCare || profile.trimester === 'postpartum') {
    services.push({
      slug: 'postpartum-care',
      name: 'Postpartum Care',
      reason: 'In-home support during those precious first weeks',
    })
  }

  if (
    profile.interests?.lactation ||
    profile.trimester === 3 ||
    profile.trimester === 'postpartum'
  ) {
    services.push({
      slug: 'lactation',
      name: 'Lactation Consulting',
      reason: 'Expert guidance for your feeding journey',
    })
  }

  if (profile.interests?.siblingPrep) {
    services.push({
      slug: 'sibling-prep',
      name: 'Sibling Preparation',
      reason: 'Help your older children prepare for the new baby',
    })
  }

  // Return top 2 recommendations
  return services.slice(0, 2)
}

/**
 * Generate primary CTA based on profile
 */
function generatePrimaryCta(
  profile: VisitorProfile
): PersonalizedContent['primaryCta'] {
  if (profile.isClient) {
    return {
      text: 'Go to Your Portal',
      href: '/client/dashboard',
    }
  }

  if (profile.stage === 'lead' || profile.stage === 'prospect') {
    return {
      text: 'Schedule a Consultation',
      href: '/contact',
    }
  }

  if (profile.trimester === 3) {
    return {
      text: 'Book a Consultation Today',
      href: '/contact',
    }
  }

  return {
    text: 'Get Started',
    href: '/contact',
  }
}

/**
 * Main personalization function
 * Takes a visitor profile and generates personalized content
 */
export function generatePersonalizedContent(
  profile: VisitorProfile
): PersonalizedContent {
  return {
    greeting: generateGreeting(profile),
    serviceAreaMessage: generateServiceAreaMessage(profile),
    timelineMessage: generateTimelineMessage(profile),
    recommendedServices: generateRecommendedServices(profile),
    primaryCta: generatePrimaryCta(profile),
  }
}

/**
 * Create a default anonymous profile
 */
export function createAnonymousProfile(): VisitorProfile {
  return {
    isClient: false,
    isNewsletterSubscriber: false,
    stage: 'anonymous',
    visitCount: 1,
    pageViews: [],
  }
}
