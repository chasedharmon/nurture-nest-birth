'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getClientSession } from './client-auth'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Types
// ============================================================================

interface ContactInfo {
  name: string
  email: string
  phone?: string
  partnerName?: string
}

interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
}

interface BirthPreferences {
  location?: string
  birthPlanNotes?: string
  specialRequests?: string
}

interface MedicalInfo {
  obgyn?: string
  hospital?: string
  insurance?: string
}

interface EmergencyContact {
  name?: string
  phone?: string
  relationship?: string
}

// ============================================================================
// Get Full Client Profile
// ============================================================================

export async function getClientProfile(clientId?: string) {
  const supabase = createAdminClient()

  // Get from session
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const targetId = clientId || session.id

  if (session.recordType === 'contact') {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile_phone,
        partner_name,
        mailing_street,
        mailing_city,
        mailing_state,
        mailing_postal_code,
        expected_due_date,
        actual_birth_date,
        account_id,
        created_at,
        updated_at
      `
      )
      .eq('id', targetId)
      .single()

    if (error) {
      console.error('[Profile] Failed to get contact profile:', error)
      return { success: false, error: 'Failed to load profile' }
    }

    // Transform to legacy format for backwards compatibility
    return {
      success: true,
      data: {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        partner_name: data.partner_name,
        address: {
          street: data.mailing_street,
          city: data.mailing_city,
          state: data.mailing_state,
          zip: data.mailing_postal_code,
        },
        expected_due_date: data.expected_due_date,
        actual_birth_date: data.actual_birth_date,
        created_at: data.created_at,
      },
    }
  } else {
    const { data, error } = await supabase
      .from('crm_leads')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        expected_due_date,
        lead_status,
        service_interest,
        message,
        created_at,
        updated_at
      `
      )
      .eq('id', targetId)
      .single()

    if (error) {
      console.error('[Profile] Failed to get lead profile:', error)
      return { success: false, error: 'Failed to load profile' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        expected_due_date: data.expected_due_date,
        lead_status: data.lead_status,
        service_interest: data.service_interest,
        message: data.message,
        created_at: data.created_at,
      },
    }
  }
}

// ============================================================================
// Update Contact Information
// ============================================================================

export async function updateContactInfo(data: ContactInfo) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // Only contacts can update their profile
  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  // Parse name into first/last
  const nameParts = data.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: data.phone || null,
      partner_name: data.partnerName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update contact info:', error)
    return { success: false, error: 'Failed to update contact information' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Address
// ============================================================================

export async function updateAddress(data: Address) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      mailing_street: data.street || null,
      mailing_city: data.city || null,
      mailing_state: data.state || null,
      mailing_postal_code: data.zip || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update address:', error)
    return { success: false, error: 'Failed to update address' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Birth Preferences
// ============================================================================

export async function updateBirthPreferences(data: BirthPreferences) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  // CRM contacts store birth preferences in custom_fields JSONB
  const { data: currentData, error: fetchError } = await supabase
    .from('crm_contacts')
    .select('custom_fields')
    .eq('id', session.id)
    .single()

  if (fetchError) {
    console.error('[Profile] Failed to fetch current data:', fetchError)
    return { success: false, error: 'Failed to update birth preferences' }
  }

  const customFields = currentData?.custom_fields || {}
  const updatedCustomFields = {
    ...customFields,
    birth_preferences: {
      location: data.location || '',
      birth_plan_notes: data.birthPlanNotes || '',
      special_requests: data.specialRequests || '',
    },
  }

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      custom_fields: updatedCustomFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update birth preferences:', error)
    return { success: false, error: 'Failed to update birth preferences' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Medical Information
// ============================================================================

export async function updateMedicalInfo(data: MedicalInfo) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  // CRM contacts store medical info in custom_fields JSONB
  const { data: currentData, error: fetchError } = await supabase
    .from('crm_contacts')
    .select('custom_fields')
    .eq('id', session.id)
    .single()

  if (fetchError) {
    console.error('[Profile] Failed to fetch current data:', fetchError)
    return { success: false, error: 'Failed to update medical information' }
  }

  const customFields = currentData?.custom_fields || {}
  const updatedCustomFields = {
    ...customFields,
    medical_info: {
      obgyn: data.obgyn || '',
      hospital: data.hospital || '',
      insurance: data.insurance || '',
    },
  }

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      custom_fields: updatedCustomFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update medical info:', error)
    return { success: false, error: 'Failed to update medical information' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Emergency Contact
// ============================================================================

export async function updateEmergencyContact(data: EmergencyContact) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  // CRM contacts store emergency contact in custom_fields JSONB
  const { data: currentData, error: fetchError } = await supabase
    .from('crm_contacts')
    .select('custom_fields')
    .eq('id', session.id)
    .single()

  if (fetchError) {
    console.error('[Profile] Failed to fetch current data:', fetchError)
    return { success: false, error: 'Failed to update emergency contact' }
  }

  const customFields = currentData?.custom_fields || {}
  const updatedCustomFields = {
    ...customFields,
    emergency_contact: {
      name: data.name || '',
      phone: data.phone || '',
      relationship: data.relationship || '',
    },
  }

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      custom_fields: updatedCustomFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update emergency contact:', error)
    return { success: false, error: 'Failed to update emergency contact' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Due Date
// ============================================================================

export async function updateDueDate(dueDate: string | null) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      expected_due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('[Profile] Failed to update due date:', error)
    return { success: false, error: 'Failed to update due date' }
  }

  revalidatePath('/client/profile')
  return { success: true }
}

// ============================================================================
// Update Full Profile (for intake form)
// ============================================================================

interface FullProfileUpdate {
  name?: string
  phone?: string
  partnerName?: string
  address?: Address
  expectedDueDate?: string
  birthPreferences?: BirthPreferences
  medicalInfo?: MedicalInfo
  emergencyContact?: EmergencyContact
}

export async function updateFullProfile(
  clientId: string,
  data: FullProfileUpdate
) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the client is updating their own profile
  if (session.id !== clientId) {
    return { success: false, error: 'Unauthorized' }
  }

  if (session.recordType !== 'contact') {
    return {
      success: false,
      error: 'Profile editing is only available for clients',
    }
  }

  const supabase = createAdminClient()

  // Fetch current custom_fields
  const { data: currentData, error: fetchError } = await supabase
    .from('crm_contacts')
    .select('custom_fields')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    console.error('[Profile] Failed to fetch current data:', fetchError)
    return { success: false, error: 'Failed to update profile' }
  }

  const customFields = currentData?.custom_fields || {}

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name) {
    const nameParts = data.name.trim().split(' ')
    updateData.first_name = nameParts[0] || ''
    updateData.last_name = nameParts.slice(1).join(' ') || ''
  }
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.partnerName !== undefined)
    updateData.partner_name = data.partnerName || null
  if (data.expectedDueDate !== undefined)
    updateData.expected_due_date = data.expectedDueDate || null

  if (data.address) {
    updateData.mailing_street = data.address.street || null
    updateData.mailing_city = data.address.city || null
    updateData.mailing_state = data.address.state || null
    updateData.mailing_postal_code = data.address.zip || null
  }

  // Update custom_fields for birth preferences, medical info, and emergency contact
  const updatedCustomFields = { ...customFields }

  if (data.birthPreferences) {
    updatedCustomFields.birth_preferences = {
      location: data.birthPreferences.location || '',
      birth_plan_notes: data.birthPreferences.birthPlanNotes || '',
      special_requests: data.birthPreferences.specialRequests || '',
    }
  }

  if (data.medicalInfo) {
    updatedCustomFields.medical_info = {
      obgyn: data.medicalInfo.obgyn || '',
      hospital: data.medicalInfo.hospital || '',
      insurance: data.medicalInfo.insurance || '',
    }
  }

  if (data.emergencyContact) {
    updatedCustomFields.emergency_contact = {
      name: data.emergencyContact.name || '',
      phone: data.emergencyContact.phone || '',
      relationship: data.emergencyContact.relationship || '',
    }
  }

  updateData.custom_fields = updatedCustomFields

  const { error } = await supabase
    .from('crm_contacts')
    .update(updateData)
    .eq('id', clientId)

  if (error) {
    console.error('[Profile] Failed to update full profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }

  revalidatePath('/client/profile')
  revalidatePath('/client/dashboard')
  return { success: true }
}
