/**
 * Personalization Types
 *
 * Defines the visitor profile structure for intelligent personalization.
 * Similar to marketing cloud personalization but tailored for doula services.
 */

export interface VisitorProfile {
  // Identity
  id?: string // Lead ID if known
  email?: string
  name?: string
  isClient: boolean
  isNewsletterSubscriber: boolean

  // Location & Service Area
  location?: {
    city?: string
    state?: string
    inServiceArea: boolean
  }

  // Interests & Behavior
  interests?: {
    birthDoula: boolean
    postpartumCare: boolean
    lactation: boolean
    siblingPrep: boolean
  }

  // Journey Stage
  stage: 'anonymous' | 'lead' | 'prospect' | 'client' | 'past_client'

  // Due Date (if applicable)
  dueDate?: string
  trimester?: 1 | 2 | 3 | 'postpartum'

  // Engagement
  lastVisit?: string
  visitCount: number
  pageViews: string[]

  // Source
  source?: 'newsletter' | 'contact_form' | 'referral' | 'organic' | 'direct'
}

export interface PersonalizedContent {
  // Welcome message
  greeting?: string

  // Location-based content
  serviceAreaMessage?: string

  // Interest-based recommendations
  recommendedServices?: Array<{
    slug: string
    name: string
    reason: string
  }>

  // Timeline-based content
  timelineMessage?: string

  // Call to action
  primaryCta?: {
    text: string
    href: string
  }
}

export interface PersonalizationConfig {
  // Service area cities/regions
  serviceArea: string[]

  // Content templates
  templates: {
    returningVisitor: string
    localVisitor: string
    expectingMom: string
    newMom: string
  }
}
