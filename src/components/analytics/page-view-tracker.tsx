'use client'

import { useEffect } from 'react'
import { trackEvent, type EventName } from '@/lib/analytics'

interface PageViewTrackerProps {
  eventName: EventName
  properties?: Record<string, string | number | boolean>
}

/**
 * Page View Tracker Component
 *
 * Tracks page views when the component mounts.
 * Use this in page components to track visits.
 *
 * Usage:
 * <PageViewTracker
 *   eventName="service_page_view"
 *   properties={{ service: 'birth-doula', title: 'Birth Doula Support' }}
 * />
 */
export function PageViewTracker({
  eventName,
  properties,
}: PageViewTrackerProps) {
  useEffect(() => {
    trackEvent(eventName, properties)
  }, [eventName, properties])

  return null
}
