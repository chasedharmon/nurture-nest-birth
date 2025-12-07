'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  // If no clientId provided, get from session
  let targetClientId = clientId
  if (!targetClientId) {
    const session = await getClientSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    targetClientId = session.clientId
  }

  const { data, error } = await supabase
    .from('leads')
    .select(
      `
      id,
      name,
      email,
      phone,
      partner_name,
      address,
      expected_due_date,
      actual_birth_date,
      birth_preferences,
      medical_info,
      emergency_contact,
      client_type,
      lifecycle_stage,
      created_at,
      last_login_at
    `
    )
    .eq('id', targetClientId)
    .single()

  if (error) {
    console.error('[Profile] Failed to get profile:', error)
    return { success: false, error: 'Failed to load profile' }
  }

  return { success: true, data }
}

// ============================================================================
// Update Contact Information
// ============================================================================

export async function updateContactInfo(data: ContactInfo) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      name: data.name,
      phone: data.phone || null,
      partner_name: data.partnerName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      address: {
        street: data.street || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      birth_preferences: {
        location: data.location || '',
        birth_plan_notes: data.birthPlanNotes || '',
        special_requests: data.specialRequests || '',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      medical_info: {
        obgyn: data.obgyn || '',
        hospital: data.hospital || '',
        insurance: data.insurance || '',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      emergency_contact: {
        name: data.name || '',
        phone: data.phone || '',
        relationship: data.relationship || '',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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

  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      expected_due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.clientId)

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
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name) updateData.name = data.name
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.partnerName !== undefined)
    updateData.partner_name = data.partnerName || null
  if (data.expectedDueDate !== undefined)
    updateData.expected_due_date = data.expectedDueDate || null

  if (data.address) {
    updateData.address = {
      street: data.address.street || '',
      city: data.address.city || '',
      state: data.address.state || '',
      zip: data.address.zip || '',
    }
  }

  if (data.birthPreferences) {
    updateData.birth_preferences = {
      location: data.birthPreferences.location || '',
      birth_plan_notes: data.birthPreferences.birthPlanNotes || '',
      special_requests: data.birthPreferences.specialRequests || '',
    }
  }

  if (data.medicalInfo) {
    updateData.medical_info = {
      obgyn: data.medicalInfo.obgyn || '',
      hospital: data.medicalInfo.hospital || '',
      insurance: data.medicalInfo.insurance || '',
    }
  }

  if (data.emergencyContact) {
    updateData.emergency_contact = {
      name: data.emergencyContact.name || '',
      phone: data.emergencyContact.phone || '',
      relationship: data.emergencyContact.relationship || '',
    }
  }

  const { error } = await supabase
    .from('leads')
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
