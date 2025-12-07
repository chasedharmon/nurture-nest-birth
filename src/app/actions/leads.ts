'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeadStatus } from '@/lib/supabase/types'

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

  const { error } = await supabase.from('leads').update({ status }).eq('id', id)

  if (error) {
    console.error('Error updating lead status:', error)
    return { success: false, error: error.message }
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

  const { error } = await supabase.from('leads').update(data).eq('id', id)

  if (error) {
    console.error('Error updating lead:', error)
    return { success: false, error: error.message }
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
