'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ReferralPartner, ReferralPartnerType } from '@/lib/supabase/types'

export interface ReferralPartnerFormData {
  name: string
  email?: string
  phone?: string
  business_name?: string
  partner_type: ReferralPartnerType
  referral_code?: string
  commission_percent?: number
  notes?: string
  address?: string
  specialization?: string
}

/**
 * Get all referral partners for the organization
 */
export async function getReferralPartners(options?: {
  activeOnly?: boolean
  limit?: number
}) {
  const supabase = await createClient()
  const { activeOnly = false, limit = 100 } = options || {}

  let query = supabase
    .from('referral_partners')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit)

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching referral partners:', error)
    return { success: false, error: error.message }
  }

  return { success: true, partners: data as ReferralPartner[] }
}

/**
 * Get a single referral partner by ID
 */
export async function getReferralPartnerById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('referral_partners')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching referral partner:', error)
    return { success: false, error: error.message }
  }

  return { success: true, partner: data as ReferralPartner }
}

/**
 * Create a new referral partner
 */
export async function createReferralPartner(data: ReferralPartnerFormData) {
  const supabase = await createClient()

  // Generate a unique referral code if not provided
  const referralCode = data.referral_code || generateReferralCode(data.name)

  const { data: partner, error } = await supabase
    .from('referral_partners')
    .insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      business_name: data.business_name || null,
      partner_type: data.partner_type,
      referral_code: referralCode,
      commission_percent: data.commission_percent || null,
      notes: data.notes || null,
      address: data.address || null,
      specialization: data.specialization || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating referral partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/referral-partners')
  return { success: true, partner: partner as ReferralPartner }
}

/**
 * Update an existing referral partner
 */
export async function updateReferralPartner(
  id: string,
  data: Partial<ReferralPartnerFormData>
) {
  const supabase = await createClient()

  const { data: partner, error } = await supabase
    .from('referral_partners')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating referral partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/referral-partners')
  revalidatePath(`/admin/setup/referral-partners/${id}`)
  return { success: true, partner: partner as ReferralPartner }
}

/**
 * Toggle referral partner active status
 */
export async function toggleReferralPartnerStatus(id: string) {
  const supabase = await createClient()

  // First get current status
  const { data: current, error: fetchError } = await supabase
    .from('referral_partners')
    .select('is_active')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching referral partner:', fetchError)
    return { success: false, error: fetchError.message }
  }

  // Toggle the status
  const { error } = await supabase
    .from('referral_partners')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error toggling referral partner status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/referral-partners')
  return { success: true, isActive: !current.is_active }
}

/**
 * Delete a referral partner
 */
export async function deleteReferralPartner(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('referral_partners')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting referral partner:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/referral-partners')
  return { success: true }
}

/**
 * Get referral partner statistics
 */
export async function getReferralPartnerStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('referral_partners')
    .select('id, name, lead_count, converted_count, is_active')
    .order('lead_count', { ascending: false })

  if (error) {
    console.error('Error fetching referral partner stats:', error)
    return { success: false, error: error.message }
  }

  const stats = {
    totalPartners: data.length,
    activePartners: data.filter(p => p.is_active).length,
    totalLeads: data.reduce((sum, p) => sum + (p.lead_count || 0), 0),
    totalConversions: data.reduce(
      (sum, p) => sum + (p.converted_count || 0),
      0
    ),
    topPartners: data.slice(0, 5),
    averageConversionRate:
      data.length > 0
        ? data.reduce((sum, p) => {
            const rate =
              p.lead_count > 0 ? (p.converted_count / p.lead_count) * 100 : 0
            return sum + rate
          }, 0) / data.length
        : 0,
  }

  return { success: true, stats }
}

/**
 * Generate a unique referral code from a name
 */
function generateReferralCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${base}${random}`
}

/**
 * Get the referral URL for a partner
 */
export function getReferralUrl(baseUrl: string, referralCode: string): string {
  return `${baseUrl}?ref=${referralCode}`
}
