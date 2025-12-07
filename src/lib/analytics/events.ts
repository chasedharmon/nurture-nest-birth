/**
 * Analytics Event Tracking
 *
 * Provides type-safe event tracking that works with Vercel Analytics.
 * All events are automatically sent to Vercel Analytics without additional setup.
 *
 * Usage:
 * import { trackEvent } from '@/lib/analytics'
 * trackEvent('contact_form_submit', { service: 'birth-doula' })
 */

import { track } from '@vercel/analytics'

/**
 * Standard event names for the application
 */
export const EVENTS = {
  // Contact & Conversion
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  CONTACT_FORM_SUCCESS: 'contact_form_success',
  CONTACT_FORM_ERROR: 'contact_form_error',
  CTA_CLICK: 'cta_click',
  CONSULTATION_CLICK: 'consultation_click',

  // Navigation
  NAV_CLICK: 'nav_click',
  FOOTER_LINK_CLICK: 'footer_link_click',
  SERVICE_LINK_CLICK: 'service_link_click',

  // Service Pages
  SERVICE_PAGE_VIEW: 'service_page_view',
  PRICING_VIEW: 'pricing_view',

  // Blog
  BLOG_POST_VIEW: 'blog_post_view',
  BLOG_POST_SHARE: 'blog_post_share',

  // Testimonials
  TESTIMONIALS_VIEW: 'testimonials_view',

  // FAQ
  FAQ_VIEW: 'faq_view',
  FAQ_EXPAND: 'faq_expand',

  // Gallery
  GALLERY_IMAGE_VIEW: 'gallery_image_view',

  // Resources
  RESOURCE_DOWNLOAD: 'resource_download',

  // Newsletter
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  NEWSLETTER_SUCCESS: 'newsletter_success',
  NEWSLETTER_ERROR: 'newsletter_error',

  // Phone/Email Actions
  PHONE_CLICK: 'phone_click',
  EMAIL_CLICK: 'email_click',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Event properties for different event types
 */
export interface EventProperties {
  // Contact form events
  service?: string
  source?: string
  error?: string

  // Navigation events
  destination?: string
  location?: string

  // Content events
  title?: string
  category?: string

  // CTA events
  cta_location?: string
  cta_text?: string

  // Generic metadata
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a custom event
 */
export function trackEvent(
  name: EventName | string,
  properties?: EventProperties
): void {
  try {
    // Send to Vercel Analytics
    track(name, properties)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', name, properties)
    }
  } catch (error) {
    // Silently fail - don't let analytics break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics tracking error:', error)
    }
  }
}

/**
 * Track contact form submission
 */
export function trackContactFormSubmit(data: {
  service?: string
  source?: string
}): void {
  trackEvent(EVENTS.CONTACT_FORM_SUBMIT, data)
}

/**
 * Track contact form success
 */
export function trackContactFormSuccess(data: { service?: string }): void {
  trackEvent(EVENTS.CONTACT_FORM_SUCCESS, data)
}

/**
 * Track contact form error
 */
export function trackContactFormError(data: {
  error: string
  service?: string
}): void {
  trackEvent(EVENTS.CONTACT_FORM_ERROR, data)
}

/**
 * Track CTA button click
 */
export function trackCTAClick(data: {
  cta_text: string
  cta_location: string
  destination?: string
}): void {
  trackEvent(EVENTS.CTA_CLICK, data)
}

/**
 * Track navigation click
 */
export function trackNavClick(data: {
  destination: string
  location: 'header' | 'footer' | 'mobile_menu'
}): void {
  trackEvent(EVENTS.NAV_CLICK, data)
}

/**
 * Track service page view
 */
export function trackServicePageView(data: {
  service: string
  title: string
}): void {
  trackEvent(EVENTS.SERVICE_PAGE_VIEW, data)
}

/**
 * Track blog post view
 */
export function trackBlogPostView(data: { title: string; slug: string }): void {
  trackEvent(EVENTS.BLOG_POST_VIEW, data)
}

/**
 * Track FAQ expansion
 */
export function trackFAQExpand(data: { question: string }): void {
  trackEvent(EVENTS.FAQ_EXPAND, data)
}

/**
 * Track phone/email clicks
 */
export function trackContactClick(type: 'phone' | 'email'): void {
  trackEvent(type === 'phone' ? EVENTS.PHONE_CLICK : EVENTS.EMAIL_CLICK)
}
