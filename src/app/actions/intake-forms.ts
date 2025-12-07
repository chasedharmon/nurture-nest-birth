'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientSession } from './client-auth'
import { updateFullProfile } from './client-profile'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Types
// ============================================================================

export interface IntakeFormTemplate {
  id: string
  name: string
  description?: string
  form_schema: {
    sections: IntakeFormSection[]
  }
  is_active: boolean
  is_default: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface IntakeFormSection {
  id: string
  title: string
  description?: string
  fields: IntakeFormField[]
}

export interface IntakeFormField {
  id: string
  label: string
  type:
    | 'text'
    | 'textarea'
    | 'date'
    | 'tel'
    | 'email'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'number'
  required?: boolean
  placeholder?: string
  options?: string[]
  showIf?: {
    field: string
    value: string
  }
  helpText?: string
}

export interface IntakeFormSubmission {
  id: string
  client_id: string
  template_id?: string
  form_data: Record<string, unknown>
  status: 'draft' | 'submitted' | 'reviewed' | 'archived'
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
  created_at: string
}

// ============================================================================
// Get Intake Form Templates
// ============================================================================

export async function getIntakeFormTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('intake_form_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[Intake] Failed to get templates:', error)
    return []
  }

  return data as IntakeFormTemplate[]
}

export async function getDefaultIntakeTemplate() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('intake_form_templates')
    .select('*')
    .eq('is_active', true)
    .eq('is_default', true)
    .single()

  if (error) {
    // If no default, get first active template
    const { data: fallback } = await supabase
      .from('intake_form_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()

    return fallback as IntakeFormTemplate | null
  }

  return data as IntakeFormTemplate
}

export async function getIntakeFormTemplate(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('intake_form_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    console.error('[Intake] Failed to get template:', error)
    return null
  }

  return data as IntakeFormTemplate
}

// ============================================================================
// Submit Intake Form
// ============================================================================

export async function submitIntakeForm(
  templateId: string,
  formData: Record<string, unknown>
) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  // Create submission record
  const { data: submission, error: submitError } = await supabase
    .from('intake_form_submissions')
    .insert({
      client_id: session.clientId,
      template_id: templateId,
      form_data: formData,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (submitError) {
    console.error('[Intake] Failed to submit form:', submitError)
    return { success: false, error: 'Failed to submit form' }
  }

  // Update client profile with relevant data
  const profileUpdate = mapIntakeDataToProfile(formData)
  if (Object.keys(profileUpdate).length > 0) {
    await updateFullProfile(session.clientId, profileUpdate)
  }

  revalidatePath('/client/intake')
  revalidatePath('/client/dashboard')

  return { success: true, submissionId: submission.id }
}

// ============================================================================
// Save Intake Form Draft
// ============================================================================

export async function saveIntakeDraft(
  templateId: string,
  formData: Record<string, unknown>,
  existingDraftId?: string
) {
  const session = await getClientSession()
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  if (existingDraftId) {
    // Update existing draft
    const { error } = await supabase
      .from('intake_form_submissions')
      .update({
        form_data: formData,
      })
      .eq('id', existingDraftId)
      .eq('status', 'draft')

    if (error) {
      console.error('[Intake] Failed to update draft:', error)
      return { success: false, error: 'Failed to save draft' }
    }

    return { success: true, draftId: existingDraftId }
  }

  // Create new draft
  const { data, error } = await supabase
    .from('intake_form_submissions')
    .insert({
      client_id: session.clientId,
      template_id: templateId,
      form_data: formData,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('[Intake] Failed to create draft:', error)
    return { success: false, error: 'Failed to save draft' }
  }

  return { success: true, draftId: data.id }
}

// ============================================================================
// Get Client Submissions
// ============================================================================

export async function getClientIntakeSubmissions(clientId?: string) {
  const supabase = await createClient()

  // If no clientId, get from session
  let targetClientId = clientId
  if (!targetClientId) {
    const session = await getClientSession()
    if (!session) {
      return []
    }
    targetClientId = session.clientId
  }

  const { data, error } = await supabase
    .from('intake_form_submissions')
    .select(
      `
      *,
      template:intake_form_templates(id, name)
    `
    )
    .eq('client_id', targetClientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Intake] Failed to get submissions:', error)
    return []
  }

  return data as (IntakeFormSubmission & {
    template?: { id: string; name: string }
  })[]
}

export async function getClientDraft(clientId?: string) {
  const supabase = await createClient()

  let targetClientId = clientId
  if (!targetClientId) {
    const session = await getClientSession()
    if (!session) {
      return null
    }
    targetClientId = session.clientId
  }

  const { data, error } = await supabase
    .from('intake_form_submissions')
    .select('*')
    .eq('client_id', targetClientId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No draft found is not an error
    return null
  }

  return data as IntakeFormSubmission
}

// ============================================================================
// Admin: Review Submission
// ============================================================================

export async function reviewIntakeSubmission(
  submissionId: string,
  reviewerId: string,
  notes?: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('intake_form_submissions')
    .update({
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      notes: notes || null,
    })
    .eq('id', submissionId)

  if (error) {
    console.error('[Intake] Failed to review submission:', error)
    return { success: false, error: 'Failed to mark as reviewed' }
  }

  return { success: true }
}

export async function getSubmissionDetails(submissionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('intake_form_submissions')
    .select(
      `
      *,
      template:intake_form_templates(*),
      client:leads(id, name, email),
      reviewer:users(id, full_name, email)
    `
    )
    .eq('id', submissionId)
    .single()

  if (error) {
    console.error('[Intake] Failed to get submission:', error)
    return null
  }

  return data
}

// ============================================================================
// Helper: Map intake form data to profile fields
// ============================================================================

function mapIntakeDataToProfile(formData: Record<string, unknown>) {
  const profile: Record<string, unknown> = {}

  // Personal info
  if (formData.preferred_name) profile.name = formData.preferred_name
  if (formData.partner_name) profile.partnerName = formData.partner_name

  // Due date
  if (formData.due_date) profile.expectedDueDate = formData.due_date

  // Medical info
  if (formData.provider_name || formData.hospital_name) {
    profile.medicalInfo = {
      obgyn: formData.provider_name || formData.provider_practice || '',
      hospital: formData.hospital_name || '',
      insurance: '',
    }
  }

  // Birth preferences
  if (formData.birth_location || formData.important_aspects) {
    profile.birthPreferences = {
      location: formData.birth_location || '',
      birthPlanNotes: formData.important_aspects || '',
      specialRequests: formData.concerns || '',
    }
  }

  // Emergency contact
  if (formData.emergency_name && formData.emergency_phone) {
    profile.emergencyContact = {
      name: formData.emergency_name,
      phone: formData.emergency_phone,
      relationship: formData.emergency_relationship || '',
    }
  }

  return profile
}
