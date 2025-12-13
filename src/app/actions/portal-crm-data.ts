'use server'

/**
 * Portal CRM Data Server Actions
 *
 * These actions provide CRM data access for the Client Portal.
 * They work with the new CRM-based authentication system where
 * portal sessions reference either crm_leads or crm_contacts.
 *
 * Key features:
 * - Fetches data based on session's CRM record type (lead vs contact)
 * - Filters data to only portal-appropriate fields
 * - Provides unified interface for all portal pages
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getClientSession, type CrmRecordType } from './client-auth'
import type { OpportunityStage } from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

export interface PortalProfile {
  recordType: CrmRecordType
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  mobilePhone?: string | null

  // Address (contacts only)
  street?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null

  // Doula-specific
  partnerName?: string | null
  expectedDueDate?: string | null
  actualBirthDate?: string | null

  // Lead-specific
  leadStatus?: string
  serviceInterest?: string | null
  message?: string | null

  // Account info (contacts only)
  account?: {
    id: string
    name: string
    billingStreet?: string | null
    billingCity?: string | null
    billingState?: string | null
    billingPostalCode?: string | null
  } | null

  // Preferences (contacts only)
  preferredContactMethod?: string | null
  doNotEmail?: boolean
  doNotCall?: boolean

  createdAt: string
}

export interface PortalService {
  id: string
  name: string
  description: string | null
  stage: OpportunityStage
  stageDisplay: string
  amount: number | null
  serviceType: string | null
  closeDate: string | null
  actualCloseDate: string | null
  isActive: boolean
  isWon: boolean
  nextStep: string | null
  nextStepDate: string | null
}

export interface PortalMeeting {
  id: string
  activityType: 'event' | 'call'
  subject: string
  description: string | null
  status: 'open' | 'completed' | 'cancelled'
  dueDate: string | null
  dueDateTime: string | null
  location: string | null
  meetingLink: string | null
  isAllDay: boolean
  completedAt: string | null
}

export interface PortalTask {
  id: string
  subject: string
  description: string | null
  status: 'open' | 'completed' | 'cancelled'
  priority: 'high' | 'normal' | 'low'
  dueDate: string | null
}

export interface PortalMilestone {
  id: string
  title: string
  description: string | null
  completedAt: string | null
  dueDate: string | null
}

export interface PortalDashboardData {
  profile: PortalProfile
  services: PortalService[]
  upcomingMeetings: PortalMeeting[]
  tasks: PortalTask[]
  milestones: PortalMilestone[]
  accessLevel: 'full' | 'limited'
}

// =====================================================
// STAGE DISPLAY MAPPING
// =====================================================

const STAGE_DISPLAY_MAP: Record<OpportunityStage, string> = {
  qualification: 'Discussing Options',
  needs_analysis: 'Planning',
  proposal: 'Proposal Sent',
  negotiation: 'Finalizing Details',
  closed_won: 'Active Service',
  closed_lost: 'Closed',
}

function getStageDisplay(stage: OpportunityStage): string {
  return STAGE_DISPLAY_MAP[stage] || stage
}

// =====================================================
// PROFILE DATA
// =====================================================

/**
 * Get the current portal user's profile from CRM
 */
export async function getPortalProfile(): Promise<{
  data: PortalProfile | null
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    if (session.recordType === 'contact') {
      // Fetch contact with account
      const { data: contact, error } = await supabase
        .from('crm_contacts')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone,
          mobile_phone,
          mailing_street,
          mailing_city,
          mailing_state,
          mailing_postal_code,
          partner_name,
          expected_due_date,
          actual_birth_date,
          preferred_contact_method,
          do_not_email,
          do_not_call,
          created_at,
          account_id
        `
        )
        .eq('id', session.id)
        .single()

      if (error || !contact) {
        return { data: null, error: error?.message || 'Contact not found' }
      }

      // Fetch account if linked
      let account = null
      if (contact.account_id) {
        const { data: accountData } = await supabase
          .from('crm_accounts')
          .select(
            'id, name, billing_street, billing_city, billing_state, billing_postal_code'
          )
          .eq('id', contact.account_id)
          .single()

        if (accountData) {
          account = {
            id: accountData.id,
            name: accountData.name,
            billingStreet: accountData.billing_street,
            billingCity: accountData.billing_city,
            billingState: accountData.billing_state,
            billingPostalCode: accountData.billing_postal_code,
          }
        }
      }

      return {
        data: {
          recordType: 'contact',
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          mobilePhone: contact.mobile_phone,
          street: contact.mailing_street,
          city: contact.mailing_city,
          state: contact.mailing_state,
          postalCode: contact.mailing_postal_code,
          partnerName: contact.partner_name,
          expectedDueDate: contact.expected_due_date,
          actualBirthDate: contact.actual_birth_date,
          preferredContactMethod: contact.preferred_contact_method,
          doNotEmail: contact.do_not_email,
          doNotCall: contact.do_not_call,
          account,
          createdAt: contact.created_at,
        },
        error: null,
      }
    } else {
      // Fetch lead
      const { data: lead, error } = await supabase
        .from('crm_leads')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone,
          lead_status,
          service_interest,
          expected_due_date,
          message,
          created_at
        `
        )
        .eq('id', session.id)
        .single()

      if (error || !lead) {
        // Fallback to legacy leads table for backwards compatibility
        const { data: legacyLead, error: legacyError } = await supabase
          .from('leads')
          .select(
            'id, name, email, phone, expected_due_date, partner_name, actual_birth_date, status, created_at'
          )
          .eq('id', session.id)
          .single()

        if (legacyError || !legacyLead) {
          return {
            data: null,
            error: error?.message || legacyError?.message || 'Lead not found',
          }
        }

        // Parse name into first/last for legacy leads
        const nameParts = (legacyLead.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        return {
          data: {
            recordType: 'lead',
            id: legacyLead.id,
            firstName,
            lastName,
            email: legacyLead.email,
            phone: legacyLead.phone,
            partnerName: legacyLead.partner_name,
            expectedDueDate: legacyLead.expected_due_date,
            actualBirthDate: legacyLead.actual_birth_date,
            leadStatus: legacyLead.status,
            createdAt: legacyLead.created_at,
          },
          error: null,
        }
      }

      return {
        data: {
          recordType: 'lead',
          id: lead.id,
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          leadStatus: lead.lead_status,
          serviceInterest: lead.service_interest,
          expectedDueDate: lead.expected_due_date,
          message: lead.message,
          createdAt: lead.created_at,
        },
        error: null,
      }
    }
  } catch (err) {
    console.error('Error getting portal profile:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// SERVICES (OPPORTUNITIES)
// =====================================================

/**
 * Get services (opportunities) for the portal user
 * Only available for contacts (converted customers)
 */
export async function getPortalServices(): Promise<{
  data: PortalService[]
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: [], error: 'Not authenticated' }
    }

    // Leads don't have services
    if (session.recordType === 'lead') {
      return { data: [], error: null }
    }

    const supabase = createAdminClient()

    const { data: opportunities, error } = await supabase
      .from('crm_opportunities')
      .select(
        `
        id,
        name,
        description,
        stage,
        amount,
        service_type,
        close_date,
        actual_close_date,
        is_closed,
        is_won,
        next_step,
        next_step_date
      `
      )
      .eq('primary_contact_id', session.id)
      // Show all stages except closed_lost
      .neq('stage', 'closed_lost')
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    const services: PortalService[] = (opportunities || []).map(opp => ({
      id: opp.id,
      name: opp.name,
      description: opp.description,
      stage: opp.stage as OpportunityStage,
      stageDisplay: getStageDisplay(opp.stage as OpportunityStage),
      amount: opp.amount,
      serviceType: opp.service_type,
      closeDate: opp.close_date,
      actualCloseDate: opp.actual_close_date,
      isActive: opp.stage === 'closed_won',
      isWon: opp.is_won,
      nextStep: opp.next_step,
      nextStepDate: opp.next_step_date,
    }))

    return { data: services, error: null }
  } catch (err) {
    console.error('Error getting portal services:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MEETINGS (ACTIVITIES - EVENTS/CALLS)
// =====================================================

/**
 * Get meetings for the portal user
 */
export async function getPortalMeetings(options?: {
  upcoming?: boolean
  limit?: number
}): Promise<{
  data: PortalMeeting[]
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: [], error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('crm_activities')
      .select(
        `
        id,
        activity_type,
        subject,
        description,
        status,
        due_date,
        due_datetime,
        location,
        meeting_link,
        is_all_day,
        completed_at
      `
      )
      .eq('who_id', session.id)
      .in('activity_type', ['event', 'call'])

    // For upcoming meetings, filter by date and status
    if (options?.upcoming) {
      const now = new Date().toISOString()
      query = query
        .gte('due_datetime', now)
        .eq('status', 'open')
        .order('due_datetime', { ascending: true })
    } else {
      query = query.order('due_datetime', { ascending: false })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: activities, error } = await query

    if (error) {
      return { data: [], error: error.message }
    }

    const meetings: PortalMeeting[] = (activities || []).map(activity => ({
      id: activity.id,
      activityType: activity.activity_type as 'event' | 'call',
      subject: activity.subject,
      description: activity.description,
      status: activity.status as 'open' | 'completed' | 'cancelled',
      dueDate: activity.due_date,
      dueDateTime: activity.due_datetime,
      location: activity.location,
      meetingLink: activity.meeting_link,
      isAllDay: activity.is_all_day,
      completedAt: activity.completed_at,
    }))

    return { data: meetings, error: null }
  } catch (err) {
    console.error('Error getting portal meetings:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// TASKS (ACTIVITIES - TASKS)
// =====================================================

/**
 * Get open tasks for the portal user
 */
export async function getPortalTasks(options?: {
  status?: 'open' | 'completed' | 'all'
  limit?: number
}): Promise<{
  data: PortalTask[]
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: [], error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('crm_activities')
      .select(
        `
        id,
        subject,
        description,
        status,
        priority,
        due_date
      `
      )
      .eq('who_id', session.id)
      .eq('activity_type', 'task')

    const status = options?.status || 'open'
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: activities, error } = await query

    if (error) {
      return { data: [], error: error.message }
    }

    const tasks: PortalTask[] = (activities || []).map(activity => ({
      id: activity.id,
      subject: activity.subject,
      description: activity.description,
      status: activity.status as 'open' | 'completed' | 'cancelled',
      priority: activity.priority as 'high' | 'normal' | 'low',
      dueDate: activity.due_date,
    }))

    return { data: tasks, error: null }
  } catch (err) {
    console.error('Error getting portal tasks:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MILESTONES (ACTIVITIES - NOTES WITH MILESTONE TAG)
// =====================================================

/**
 * Get journey milestones for the portal user
 */
export async function getPortalMilestones(): Promise<{
  data: PortalMilestone[]
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: [], error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    // Milestones are notes with "milestone" in the subject or description
    const { data: activities, error } = await supabase
      .from('crm_activities')
      .select(
        `
        id,
        subject,
        description,
        status,
        due_date,
        completed_at
      `
      )
      .eq('who_id', session.id)
      .eq('activity_type', 'note')
      .ilike('subject', '%milestone%')
      .order('due_date', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    const milestones: PortalMilestone[] = (activities || []).map(activity => ({
      id: activity.id,
      title: activity.subject.replace(/\[milestone\]/i, '').trim(),
      description: activity.description,
      completedAt: activity.completed_at,
      dueDate: activity.due_date,
    }))

    return { data: milestones, error: null }
  } catch (err) {
    console.error('Error getting portal milestones:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// DASHBOARD (COMBINED DATA)
// =====================================================

/**
 * Get all dashboard data in a single call
 */
export async function getPortalDashboardData(): Promise<{
  data: PortalDashboardData | null
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Fetch all data in parallel
    const [
      profileResult,
      servicesResult,
      meetingsResult,
      tasksResult,
      milestonesResult,
    ] = await Promise.all([
      getPortalProfile(),
      getPortalServices(),
      getPortalMeetings({ upcoming: true, limit: 5 }),
      getPortalTasks({ status: 'open', limit: 5 }),
      getPortalMilestones(),
    ])

    if (profileResult.error || !profileResult.data) {
      return { data: null, error: profileResult.error || 'Profile not found' }
    }

    return {
      data: {
        profile: profileResult.data,
        services: servicesResult.data,
        upcomingMeetings: meetingsResult.data,
        tasks: tasksResult.data,
        milestones: milestonesResult.data,
        accessLevel: session.recordType === 'contact' ? 'full' : 'limited',
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal dashboard data:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// PROFILE UPDATE
// =====================================================

export interface ProfileUpdateData {
  phone?: string
  mobilePhone?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  partnerName?: string
  preferredContactMethod?: string
}

/**
 * Update the portal user's profile
 */
export async function updatePortalProfile(
  updates: ProfileUpdateData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createAdminClient()

    if (session.recordType === 'contact') {
      const { error } = await supabase
        .from('crm_contacts')
        .update({
          phone: updates.phone,
          mobile_phone: updates.mobilePhone,
          mailing_street: updates.street,
          mailing_city: updates.city,
          mailing_state: updates.state,
          mailing_postal_code: updates.postalCode,
          partner_name: updates.partnerName,
          preferred_contact_method: updates.preferredContactMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Leads have limited editable fields
      const { error } = await supabase
        .from('crm_leads')
        .update({
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Error updating portal profile:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// ACCOUNT DATA
// =====================================================

/**
 * Get account (household) data for the portal user
 * Only available for contacts
 */
export async function getPortalAccount(): Promise<{
  data: {
    id: string
    name: string
    billingStreet: string | null
    billingCity: string | null
    billingState: string | null
    billingPostalCode: string | null
    accountStatus: string
    lifecycleStage: string | null
  } | null
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Leads don't have accounts
    if (session.recordType === 'lead') {
      return { data: null, error: null }
    }

    const supabase = createAdminClient()

    // First get the contact to find account_id
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('account_id')
      .eq('id', session.id)
      .single()

    if (contactError || !contact?.account_id) {
      return { data: null, error: null }
    }

    const { data: account, error } = await supabase
      .from('crm_accounts')
      .select(
        `
        id,
        name,
        billing_street,
        billing_city,
        billing_state,
        billing_postal_code,
        account_status,
        lifecycle_stage
      `
      )
      .eq('id', contact.account_id)
      .single()

    if (error || !account) {
      return { data: null, error: error?.message || null }
    }

    return {
      data: {
        id: account.id,
        name: account.name,
        billingStreet: account.billing_street,
        billingCity: account.billing_city,
        billingState: account.billing_state,
        billingPostalCode: account.billing_postal_code,
        accountStatus: account.account_status,
        lifecycleStage: account.lifecycle_stage,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal account:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// INVOICES (via opportunities)
// =====================================================

/**
 * Get invoices for the portal user
 * Invoices are linked through opportunities
 */
export async function getPortalInvoices(): Promise<{
  data: Array<{
    id: string
    invoiceNumber: string
    amount: number
    status: string
    dueDate: string | null
    paidDate: string | null
    opportunityName: string
  }>
  error: string | null
}> {
  try {
    const session = await getClientSession()

    if (!session) {
      return { data: [], error: 'Not authenticated' }
    }

    // Leads don't have invoices
    if (session.recordType === 'lead') {
      return { data: [], error: null }
    }

    const supabase = createAdminClient()

    // Get opportunities for this contact, then get invoices
    const { data: opportunities, error: oppError } = await supabase
      .from('crm_opportunities')
      .select('id, name')
      .eq('primary_contact_id', session.id)

    if (oppError || !opportunities?.length) {
      return { data: [], error: null }
    }

    const opportunityIds = opportunities.map(o => o.id)
    const opportunityMap = new Map(opportunities.map(o => [o.id, o.name]))

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        amount,
        status,
        due_date,
        paid_date,
        opportunity_id
      `
      )
      .in('opportunity_id', opportunityIds)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return {
      data: (invoices || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.due_date,
        paidDate: inv.paid_date,
        opportunityName: opportunityMap.get(inv.opportunity_id) || 'Service',
      })),
      error: null,
    }
  } catch (err) {
    console.error('Error getting portal invoices:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}
