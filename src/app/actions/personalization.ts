'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getClientSession } from './client-auth'
import type { VisitorProfile } from '@/lib/personalization/types'
import {
  calculateTrimester,
  isInServiceArea,
} from '@/lib/personalization/engine'

const VISITOR_COOKIE = 'nnb_visitor'
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

interface VisitorCookieData {
  id?: string // Lead ID
  email?: string
  visitCount: number
  firstVisit: string
  lastVisit: string
  interests: string[] // Service slugs they've viewed
  pageViews: string[] // Last 10 page views
  city?: string
}

/**
 * Get or create visitor cookie data
 */
async function getVisitorCookie(): Promise<VisitorCookieData | null> {
  const cookieStore = await cookies()
  const visitorCookie = cookieStore.get(VISITOR_COOKIE)

  if (!visitorCookie?.value) {
    return null
  }

  try {
    return JSON.parse(visitorCookie.value) as VisitorCookieData
  } catch {
    return null
  }
}

/**
 * Set visitor cookie
 */
async function setVisitorCookie(data: VisitorCookieData): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(VISITOR_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Track a page view and update visitor profile
 */
export async function trackPageView(
  path: string,
  metadata?: { city?: string }
): Promise<void> {
  const now = new Date().toISOString()
  let visitorData = await getVisitorCookie()

  if (!visitorData) {
    // First visit - create new visitor
    visitorData = {
      visitCount: 1,
      firstVisit: now,
      lastVisit: now,
      interests: [],
      pageViews: [path],
      city: metadata?.city,
    }
  } else {
    // Returning visitor
    visitorData.visitCount += 1
    visitorData.lastVisit = now

    // Add page to views (keep last 20)
    visitorData.pageViews = [path, ...visitorData.pageViews.slice(0, 19)]

    // Track service interests from page views
    const servicePages = [
      'birth-doula',
      'postpartum-care',
      'lactation',
      'sibling-prep',
    ]
    for (const service of servicePages) {
      if (path.includes(service) && !visitorData.interests.includes(service)) {
        visitorData.interests.push(service)
      }
    }

    // Update city if provided
    if (metadata?.city) {
      visitorData.city = metadata.city
    }
  }

  await setVisitorCookie(visitorData)
}

/**
 * Identify a visitor by email (e.g., after newsletter signup or contact form)
 */
export async function identifyVisitor(
  email: string,
  _name?: string,
  additionalData?: { dueDate?: string; serviceInterest?: string }
): Promise<{ success: boolean; profile?: VisitorProfile }> {
  const supabase = createAdminClient()
  let visitorData = await getVisitorCookie()

  // Check if this email exists as a lead
  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email, status, due_date, service_interest, source')
    .eq('email', email)
    .single()

  // Update or create visitor cookie with identity
  if (!visitorData) {
    visitorData = {
      id: lead?.id,
      email,
      visitCount: 1,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      interests: [],
      pageViews: [],
    }
  } else {
    visitorData.id = lead?.id
    visitorData.email = email
  }

  // Add service interest if provided
  if (additionalData?.serviceInterest) {
    if (!visitorData.interests.includes(additionalData.serviceInterest)) {
      visitorData.interests.push(additionalData.serviceInterest)
    }
  }

  await setVisitorCookie(visitorData)

  // Return the profile
  const profile = await getVisitorProfile()
  return { success: true, profile: profile || undefined }
}

/**
 * Get the current visitor profile (combines cookie data with database data)
 */
export async function getVisitorProfile(): Promise<VisitorProfile | null> {
  // First check if user is authenticated as a client
  const clientSession = await getClientSession()

  if (clientSession) {
    // User is an authenticated client
    const supabase = createAdminClient()
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, email, status, due_date, service_interest, source')
      .eq('id', clientSession.clientId)
      .single()

    return {
      id: clientSession.clientId,
      email: clientSession.email,
      name: clientSession.name,
      isClient: true,
      isNewsletterSubscriber: lead?.source === 'newsletter',
      stage: 'client',
      dueDate: lead?.due_date || undefined,
      trimester: lead?.due_date ? calculateTrimester(lead.due_date) : undefined,
      interests: {
        birthDoula:
          lead?.service_interest?.includes('birth') ||
          lead?.service_interest?.includes('doula') ||
          false,
        postpartumCare: lead?.service_interest?.includes('postpartum') || false,
        lactation: lead?.service_interest?.includes('lactation') || false,
        siblingPrep: lead?.service_interest?.includes('sibling') || false,
      },
      visitCount: 1,
      pageViews: [],
      source: (lead?.source as VisitorProfile['source']) || undefined,
    }
  }

  // Check visitor cookie
  const visitorData = await getVisitorCookie()

  if (!visitorData) {
    return null
  }

  // If we have an email, try to enrich from database
  let lead: {
    id: string
    name: string
    email: string
    status: string
    due_date?: string
    service_interest?: string
    source?: string
  } | null = null

  if (visitorData.email || visitorData.id) {
    const supabase = createAdminClient()
    const query = visitorData.id
      ? supabase.from('leads').select('*').eq('id', visitorData.id)
      : supabase.from('leads').select('*').eq('email', visitorData.email!)

    const { data } = await query.single()
    lead = data
  }

  // Determine stage
  let stage: VisitorProfile['stage'] = 'anonymous'
  if (lead) {
    if (lead.status === 'client') {
      stage = 'client'
    } else if (lead.status === 'new' || lead.status === 'contacted') {
      stage = 'lead'
    } else if (lead.status === 'scheduled') {
      stage = 'prospect'
    } else if (lead.status === 'lost') {
      stage = 'past_client'
    }
  } else if (visitorData.email) {
    stage = 'lead'
  }

  // Build interests from page views
  const interests = {
    birthDoula: visitorData.interests.includes('birth-doula'),
    postpartumCare: visitorData.interests.includes('postpartum-care'),
    lactation: visitorData.interests.includes('lactation'),
    siblingPrep: visitorData.interests.includes('sibling-prep'),
  }

  // Merge with lead interests if available
  if (lead?.service_interest) {
    if (
      lead.service_interest.includes('birth') ||
      lead.service_interest.includes('doula')
    ) {
      interests.birthDoula = true
    }
    if (lead.service_interest.includes('postpartum')) {
      interests.postpartumCare = true
    }
    if (lead.service_interest.includes('lactation')) {
      interests.lactation = true
    }
    if (lead.service_interest.includes('sibling')) {
      interests.siblingPrep = true
    }
  }

  const dueDate = lead?.due_date || undefined

  return {
    id: lead?.id || visitorData.id,
    email: visitorData.email || lead?.email,
    name: lead?.name || undefined,
    isClient: lead?.status === 'client',
    isNewsletterSubscriber: lead?.source === 'newsletter',
    location: visitorData.city
      ? {
          city: visitorData.city,
          inServiceArea: isInServiceArea(visitorData.city),
        }
      : undefined,
    interests,
    stage,
    dueDate,
    trimester: dueDate ? calculateTrimester(dueDate) : undefined,
    lastVisit: visitorData.lastVisit,
    visitCount: visitorData.visitCount,
    pageViews: visitorData.pageViews,
    source: (lead?.source as VisitorProfile['source']) || undefined,
  }
}

/**
 * Clear visitor profile (for testing or privacy requests)
 */
export async function clearVisitorProfile(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(VISITOR_COOKIE)
}
