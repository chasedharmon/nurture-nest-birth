'use server'

/**
 * CRM Portal Integration Server Actions
 *
 * These actions connect the CRM system with the Client Portal,
 * allowing portal users to view their CRM contact data and related records.
 *
 * The integration works through:
 * 1. Lead-Contact mapping (when leads are converted to contacts)
 * 2. Email-based matching (fallback for legacy leads)
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { CrmContact, CrmOpportunity, CrmActivity } from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

export interface PortalContactData {
  /** CRM Contact record */
  contact: Partial<CrmContact> | null
  /** Linked opportunities (service packages) */
  opportunities: Partial<CrmOpportunity>[]
  /** Activities (meetings, calls, etc.) */
  activities: Partial<CrmActivity>[]
  /** Whether CRM data is available */
  hasCrmData: boolean
  /** Error message if any */
  error: string | null
}

export interface ClientCrmLink {
  /** Legacy lead ID */
  leadId: string
  /** CRM Contact ID (if converted) */
  contactId: string | null
  /** Email used for matching */
  email: string
  /** Whether the lead has been converted */
  isConverted: boolean
}

// =====================================================
// PORTAL VISIBLE FIELDS
// =====================================================

/**
 * Fields clients CAN see in the portal
 */
const PORTAL_VISIBLE_CONTACT_FIELDS = new Set([
  'id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'mobile_phone',
  'address_street',
  'address_city',
  'address_state',
  'address_zip',
  'expected_due_date',
  'actual_birth_date',
  'partner_name',
  'partner_phone',
  'emergency_contact_name',
  'emergency_contact_phone',
  'preferred_hospital',
  'insurance_provider',
  'birth_preferences',
  'created_at',
])

// =====================================================
// LINK MANAGEMENT
// =====================================================

/**
 * Get or create a link between a legacy lead and CRM contact
 */
export async function getClientCrmLink(
  leadId: string
): Promise<{ data: ClientCrmLink | null; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // First, check if the lead has been converted
    const { data: crmLead, error: crmLeadError } = await supabase
      .from('crm_leads')
      .select('id, email, is_converted, converted_contact_id')
      .eq('id', leadId)
      .single()

    if (!crmLeadError && crmLead && crmLead.is_converted) {
      // Lead was converted to CRM contact
      return {
        data: {
          leadId,
          contactId: crmLead.converted_contact_id,
          email: crmLead.email ?? '',
          isConverted: true,
        },
        error: null,
      }
    }

    // Fallback: Check the legacy leads table
    const { data: legacyLead, error: legacyError } = await supabase
      .from('leads')
      .select('id, email')
      .eq('id', leadId)
      .single()

    if (legacyError || !legacyLead) {
      return { data: null, error: 'Lead not found' }
    }

    // Try to find a matching CRM contact by email
    const { data: matchingContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('email', legacyLead.email)
      .single()

    return {
      data: {
        leadId,
        contactId: matchingContact?.id ?? null,
        email: legacyLead.email,
        isConverted: false,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting client CRM link:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// PORTAL DATA ACCESS
// =====================================================

/**
 * Get CRM contact data for a portal client.
 * This filters out sensitive fields and only returns portal-safe data.
 */
export async function getPortalContactData(
  clientId: string
): Promise<PortalContactData> {
  try {
    const supabase = createAdminClient()

    // Get the CRM link
    const { data: link, error: linkError } = await getClientCrmLink(clientId)

    if (linkError || !link) {
      return {
        contact: null,
        opportunities: [],
        activities: [],
        hasCrmData: false,
        error: linkError,
      }
    }

    // If no CRM contact, return empty
    if (!link.contactId) {
      return {
        contact: null,
        opportunities: [],
        activities: [],
        hasCrmData: false,
        error: null,
      }
    }

    // Fetch CRM contact data
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', link.contactId)
      .single()

    if (contactError || !contact) {
      return {
        contact: null,
        opportunities: [],
        activities: [],
        hasCrmData: false,
        error: contactError?.message ?? 'Contact not found',
      }
    }

    // Filter contact data to only portal-visible fields
    const filteredContact = filterPortalContactData(contact)

    // Fetch related opportunities
    const { data: opportunities } = await supabase
      .from('crm_opportunities')
      .select('id, name, stage, amount, close_date, created_at, description')
      .eq('primary_contact_id', link.contactId)
      .order('created_at', { ascending: false })

    // Fetch related activities (only completed or upcoming)
    const { data: activities } = await supabase
      .from('crm_activities')
      .select(
        'id, activity_type, subject, description, status, due_date, completed_at, created_at'
      )
      .eq('who_id', link.contactId)
      .in('status', ['completed', 'scheduled', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20)

    return {
      contact: filteredContact,
      opportunities: (opportunities ?? []).map(filterPortalOpportunityData),
      activities: (activities ?? []).map(filterPortalActivityData),
      hasCrmData: true,
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal contact data:', err)
    return {
      contact: null,
      opportunities: [],
      activities: [],
      hasCrmData: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get upcoming appointments for a portal client from CRM activities
 */
export async function getPortalUpcomingAppointments(
  clientId: string,
  limit: number = 5
): Promise<{
  data: Partial<CrmActivity>[]
  error: string | null
}> {
  try {
    const supabase = createAdminClient()

    // Get the CRM link
    const { data: link, error: linkError } = await getClientCrmLink(clientId)

    if (linkError || !link?.contactId) {
      return { data: [], error: null }
    }

    // Fetch upcoming meetings/calls
    const { data: activities, error } = await supabase
      .from('crm_activities')
      .select(
        'id, activity_type, subject, description, due_date, location, meeting_url'
      )
      .eq('who_id', link.contactId)
      .in('activity_type', ['meeting', 'call', 'consultation'])
      .eq('status', 'scheduled')
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(limit)

    if (error) {
      return { data: [], error: error.message }
    }

    return {
      data: (activities ?? []).map(filterPortalActivityData),
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal appointments:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get care journey milestones from CRM activities for a portal client
 */
export async function getPortalJourneyMilestones(clientId: string): Promise<{
  data: Array<{
    id: string
    title: string
    description: string | null
    completedAt: string | null
    dueDate: string | null
  }>
  error: string | null
}> {
  try {
    const supabase = createAdminClient()

    // Get the CRM link
    const { data: link, error: linkError } = await getClientCrmLink(clientId)

    if (linkError || !link?.contactId) {
      return { data: [], error: null }
    }

    // Fetch milestone-type activities
    const { data: activities, error } = await supabase
      .from('crm_activities')
      .select('id, subject, description, status, due_date, completed_at')
      .eq('who_id', link.contactId)
      .eq('activity_type', 'milestone')
      .order('due_date', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    return {
      data: (activities ?? []).map(a => ({
        id: a.id,
        title: a.subject,
        description: a.description,
        completedAt: a.completed_at,
        dueDate: a.due_date,
      })),
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal milestones:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// DATA FILTERING HELPERS
// =====================================================

/**
 * Filter contact data to only include portal-safe fields
 */
function filterPortalContactData(contact: CrmContact): Partial<CrmContact> {
  const filtered: Partial<CrmContact> = {}

  for (const [key, value] of Object.entries(contact)) {
    if (PORTAL_VISIBLE_CONTACT_FIELDS.has(key)) {
      ;(filtered as Record<string, unknown>)[key] = value
    }
  }

  return filtered
}

/**
 * Filter opportunity data for portal display
 */
function filterPortalOpportunityData(
  opp: Partial<CrmOpportunity>
): Partial<CrmOpportunity> {
  return {
    id: opp.id,
    name: opp.name,
    stage: opp.stage,
    amount: opp.amount,
    close_date: opp.close_date,
    description: opp.description,
  }
}

/**
 * Filter activity data for portal display
 */
function filterPortalActivityData(
  activity: Partial<CrmActivity>
): Partial<CrmActivity> {
  return {
    id: activity.id,
    activity_type: activity.activity_type,
    subject: activity.subject,
    description: activity.description,
    status: activity.status,
    due_date: activity.due_date,
    completed_at: activity.completed_at,
  }
}

// =====================================================
// PROFILE UPDATE (Portal -> CRM)
// =====================================================

/**
 * Update contact information from the portal.
 * Only allows updating specific fields.
 */
export async function updatePortalContactInfo(
  clientId: string,
  updates: {
    phone?: string
    mobile_phone?: string
    address_street?: string
    address_city?: string
    address_state?: string
    address_zip?: string
    partner_name?: string
    partner_phone?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    birth_preferences?: string
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // Get the CRM link
    const { data: link, error: linkError } = await getClientCrmLink(clientId)

    if (linkError || !link?.contactId) {
      // Update legacy lead instead
      const { error } = await supabase
        .from('leads')
        .update({
          phone: updates.phone,
          partner_name: updates.partner_name,
          // Map other fields as needed
        })
        .eq('id', clientId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true, error: null }
    }

    // Update CRM contact
    const { error } = await supabase
      .from('crm_contacts')
      .update({
        phone: updates.phone,
        mobile_phone: updates.mobile_phone,
        address_street: updates.address_street,
        address_city: updates.address_city,
        address_state: updates.address_state,
        address_zip: updates.address_zip,
        partner_name: updates.partner_name,
        partner_phone: updates.partner_phone,
        emergency_contact_name: updates.emergency_contact_name,
        emergency_contact_phone: updates.emergency_contact_phone,
        birth_preferences: updates.birth_preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', link.contactId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Error updating portal contact info:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
