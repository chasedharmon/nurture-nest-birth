'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeadStatus } from '@/lib/supabase/types'
import { logAudit, getAuditContext, diffChanges } from '@/lib/audit/logger'

export async function getLeadById(id: string) {
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lead:', error)
    return { success: false, error: error.message }
  }

  return { success: true, lead }
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient()

  // Get current lead data for audit diff
  const { data: oldLead } = await supabase
    .from('leads')
    .select('status')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('leads').update({ status }).eq('id', id)

  if (error) {
    console.error('Error updating lead status:', error)
    return { success: false, error: error.message }
  }

  // Log audit event
  const ctx = await getAuditContext()
  if (ctx) {
    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: 'update',
      entityType: 'lead',
      entityId: id,
      oldValues: { status: oldLead?.status },
      newValues: { status },
      metadata: { field: 'status' },
    })
  }

  // Revalidate admin pages to show updated data
  revalidatePath('/admin')
  revalidatePath(`/admin/leads/${id}`)

  return { success: true }
}

export async function updateLead(
  id: string,
  data: {
    name?: string
    email?: string
    phone?: string | null
    due_date?: string | null
    service_interest?: string | null
    message?: string | null
  }
) {
  const supabase = await createClient()

  // Get current lead data for audit diff
  const { data: oldLead } = await supabase
    .from('leads')
    .select('name, email, phone, due_date, service_interest, message')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('leads').update(data).eq('id', id)

  if (error) {
    console.error('Error updating lead:', error)
    return { success: false, error: error.message }
  }

  // Log audit event with only changed fields
  const ctx = await getAuditContext()
  if (ctx && oldLead) {
    const { oldValues, newValues } = diffChanges(
      oldLead as Record<string, unknown>,
      data as Record<string, unknown>
    )
    if (Object.keys(newValues).length > 0) {
      await logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: 'update',
        entityType: 'lead',
        entityId: id,
        oldValues,
        newValues,
      })
    }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/leads/${id}`)

  return { success: true }
}

interface SearchFilters {
  query?: string
  status?: LeadStatus | 'all'
  source?: 'contact_form' | 'newsletter' | 'manual' | 'all'
  limit?: number
  offset?: number
}

export async function searchLeads(filters: SearchFilters = {}) {
  const supabase = await createClient()
  const {
    query = '',
    status = 'all',
    source = 'all',
    limit = 50,
    offset = 0,
  } = filters

  let queryBuilder = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Search by name or email
  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,email.ilike.%${query}%`
    )
  }

  // Filter by status
  if (status && status !== 'all') {
    queryBuilder = queryBuilder.eq('status', status)
  }

  // Filter by source
  if (source && source !== 'all') {
    queryBuilder = queryBuilder.eq('source', source)
  }

  const { data: leads, error, count } = await queryBuilder

  if (error) {
    console.error('Error searching leads:', error)
    return { success: false, error: error.message }
  }

  return { success: true, leads, count }
}

export async function getAllLeads() {
  const supabase = await createClient()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all leads:', error)
    return { success: false, error: error.message }
  }

  return { success: true, leads }
}

// ============================================================================
// Create Lead (Manual Entry)
// ============================================================================

export interface CreateLeadData {
  // Required fields
  name: string
  email: string
  // Optional contact info
  phone?: string
  // Service info
  service_interest?: string
  due_date?: string
  message?: string
  // Attribution
  referral_source?: string
  referral_partner_id?: string
  source_detail?: string
  // UTM tracking (for marketing campaigns)
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export async function createLead(data: CreateLeadData) {
  const supabase = await createClient()

  // Validate required fields
  if (!data.name?.trim()) {
    return { success: false, error: 'Name is required' }
  }
  if (!data.email?.trim()) {
    return { success: false, error: 'Email is required' }
  }

  // Extract email domain
  const emailDomain = data.email.split('@')[1] || null

  const leadData = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || null,
    service_interest: data.service_interest?.trim() || null,
    due_date: data.due_date || null,
    message: data.message?.trim() || null,
    // Manual entry = 'manual' source
    source: 'manual' as const,
    status: 'new' as const,
    email_domain: emailDomain,
    // Attribution fields
    referral_source: data.referral_source || null,
    referral_partner_id: data.referral_partner_id || null,
    source_detail: data.source_detail?.trim() || null,
    // UTM fields
    utm_source: data.utm_source?.trim() || null,
    utm_medium: data.utm_medium?.trim() || null,
    utm_campaign: data.utm_campaign?.trim() || null,
    utm_term: data.utm_term?.trim() || null,
    utm_content: data.utm_content?.trim() || null,
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    return { success: false, error: error.message }
  }

  // Log audit event
  const ctx = await getAuditContext()
  if (ctx && lead) {
    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: 'create',
      entityType: 'lead',
      entityId: lead.id,
      newValues: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        service_interest: leadData.service_interest,
        source: leadData.source,
      },
    })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/leads')

  return { success: true, lead }
}
