/**
 * UTM Parameter Capture and Attribution Tracking
 *
 * This module captures UTM parameters from URLs and stores them in sessionStorage
 * for later use when creating leads. It also captures the referring URL and
 * landing page for attribution tracking.
 */

const STORAGE_KEY = 'nurture_nest_attribution'

/**
 * Attribution data captured from the visitor's session
 */
export interface AttributionData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer_url?: string
  landing_page?: string
  captured_at?: string
}

/**
 * Standard referral source options for "How did you hear about us?"
 */
export const REFERRAL_SOURCE_OPTIONS = [
  { value: 'google_search', label: 'Google Search' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_family', label: 'Friend or Family Referral' },
  { value: 'healthcare_provider', label: 'Healthcare Provider' },
  { value: 'online_ad', label: 'Online Advertisement' },
  { value: 'event', label: 'Local Event or Workshop' },
  { value: 'other', label: 'Other' },
] as const

export type ReferralSource = (typeof REFERRAL_SOURCE_OPTIONS)[number]['value']

/**
 * Extract UTM parameters from a URL
 */
function extractUTMParams(url: string): Partial<AttributionData> {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams

    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

/**
 * Capture attribution data from the current page
 * Should be called on initial page load (typically in a layout or root component)
 *
 * This function only captures data once per session to preserve the original
 * attribution source. If attribution data already exists, it won't be overwritten.
 */
export function captureAttribution(): AttributionData | null {
  if (!isBrowser()) {
    return null
  }

  // Check if we already have attribution data
  const existing = getStoredAttribution()
  if (existing) {
    return existing
  }

  // Capture new attribution data
  const currentUrl = window.location.href
  const utmParams = extractUTMParams(currentUrl)

  const attributionData: AttributionData = {
    ...utmParams,
    referrer_url: document.referrer || undefined,
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  }

  // Only store if we have meaningful data
  if (
    attributionData.utm_source ||
    attributionData.utm_campaign ||
    attributionData.referrer_url
  ) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attributionData))
    } catch {
      // SessionStorage might be full or disabled
      console.warn('Failed to store attribution data')
    }
  }

  return attributionData
}

/**
 * Get stored attribution data from sessionStorage
 */
export function getStoredAttribution(): AttributionData | null {
  if (!isBrowser()) {
    return null
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as AttributionData
    }
  } catch {
    // Invalid JSON or storage error
  }

  return null
}

/**
 * Clear stored attribution data (e.g., after form submission)
 */
export function clearAttribution(): void {
  if (!isBrowser()) {
    return
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage might be disabled
  }
}

/**
 * Get attribution data for form submission
 * Returns a clean object with only non-empty values
 */
export function getAttributionForSubmission(): Partial<AttributionData> {
  const data = getStoredAttribution()
  if (!data) {
    return {}
  }

  // Filter out empty values and the captured_at timestamp
  const result: Partial<AttributionData> = {}

  if (data.utm_source) result.utm_source = data.utm_source
  if (data.utm_medium) result.utm_medium = data.utm_medium
  if (data.utm_campaign) result.utm_campaign = data.utm_campaign
  if (data.utm_term) result.utm_term = data.utm_term
  if (data.utm_content) result.utm_content = data.utm_content
  if (data.referrer_url) result.referrer_url = data.referrer_url
  if (data.landing_page) result.landing_page = data.landing_page

  return result
}

/**
 * Merge attribution data with form data for submission
 */
export function mergeAttributionWithFormData(
  formData: FormData,
  attribution?: Partial<AttributionData>
): FormData {
  const data = attribution || getAttributionForSubmission()

  if (data.utm_source) formData.set('utm_source', data.utm_source)
  if (data.utm_medium) formData.set('utm_medium', data.utm_medium)
  if (data.utm_campaign) formData.set('utm_campaign', data.utm_campaign)
  if (data.utm_term) formData.set('utm_term', data.utm_term)
  if (data.utm_content) formData.set('utm_content', data.utm_content)
  if (data.referrer_url) formData.set('referrer_url', data.referrer_url)
  if (data.landing_page) formData.set('landing_page', data.landing_page)

  return formData
}

/**
 * Format referral source value for display
 */
export function formatReferralSource(value: string | null | undefined): string {
  if (!value) return 'Not specified'

  const option = REFERRAL_SOURCE_OPTIONS.find(opt => opt.value === value)
  return option?.label || value
}

/**
 * Format UTM data for display in admin UI
 */
export function formatUTMForDisplay(data: Partial<AttributionData>): string[] {
  const parts: string[] = []

  if (data.utm_source) parts.push(`Source: ${data.utm_source}`)
  if (data.utm_medium) parts.push(`Medium: ${data.utm_medium}`)
  if (data.utm_campaign) parts.push(`Campaign: ${data.utm_campaign}`)
  if (data.utm_term) parts.push(`Term: ${data.utm_term}`)
  if (data.utm_content) parts.push(`Content: ${data.utm_content}`)

  return parts
}

/**
 * Check if a lead has any attribution data
 */
export function hasAttributionData(data: Partial<AttributionData>): boolean {
  return !!(
    data.utm_source ||
    data.utm_medium ||
    data.utm_campaign ||
    data.referrer_url
  )
}
