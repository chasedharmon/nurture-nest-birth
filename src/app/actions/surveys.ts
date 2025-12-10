'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Survey,
  SurveyResponse,
  SurveyInvitation,
  SurveyQuestion,
  SurveyType,
  SurveyTriggerType,
} from '@/lib/supabase/types'

// ============================================================================
// Survey CRUD
// ============================================================================

export interface SurveyFormData {
  name: string
  description?: string
  survey_type: SurveyType
  questions: SurveyQuestion[]
  thank_you_message?: string
  trigger_type: SurveyTriggerType
  is_active?: boolean
}

/**
 * Get all surveys for the organization
 */
export async function getSurveys(options?: {
  activeOnly?: boolean
  type?: SurveyType
}) {
  const supabase = await createClient()
  const { activeOnly = false, type } = options || {}

  let query = supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  if (type) {
    query = query.eq('survey_type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching surveys:', error)
    return { success: false, error: error.message }
  }

  return { success: true, surveys: data as Survey[] }
}

/**
 * Get a single survey by ID
 */
export async function getSurveyById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching survey:', error)
    return { success: false, error: error.message }
  }

  return { success: true, survey: data as Survey }
}

/**
 * Get a survey by invitation token (public access)
 */
export async function getSurveyByToken(token: string) {
  const supabase = await createClient()

  // First get the invitation
  const { data: invitation, error: invError } = await supabase
    .from('survey_invitations')
    .select(
      `
      *,
      survey:surveys(*),
      client:leads(id, name, email)
    `
    )
    .eq('token', token)
    .single()

  if (invError) {
    console.error('Error fetching survey invitation:', invError)
    return { success: false, error: 'Survey not found' }
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: 'This survey link has expired' }
  }

  // Check if already completed
  if (invitation.completed_at) {
    return {
      success: false,
      error: 'You have already completed this survey',
      alreadyCompleted: true,
    }
  }

  return {
    success: true,
    invitation: invitation as SurveyInvitation & {
      survey: Survey
      client: { id: string; name: string; email: string }
    },
  }
}

/**
 * Create a new survey
 */
export async function createSurvey(data: SurveyFormData) {
  const supabase = await createClient()

  const { data: survey, error } = await supabase
    .from('surveys')
    .insert({
      name: data.name,
      description: data.description || null,
      survey_type: data.survey_type,
      questions: data.questions,
      thank_you_message:
        data.thank_you_message || 'Thank you for your feedback!',
      trigger_type: data.trigger_type,
      is_active: data.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating survey:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/surveys')
  return { success: true, survey: survey as Survey }
}

/**
 * Update an existing survey
 */
export async function updateSurvey(id: string, data: Partial<SurveyFormData>) {
  const supabase = await createClient()

  const { data: survey, error } = await supabase
    .from('surveys')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating survey:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/surveys')
  revalidatePath(`/admin/surveys/${id}`)
  return { success: true, survey: survey as Survey }
}

/**
 * Toggle survey active status
 */
export async function toggleSurveyStatus(id: string) {
  const supabase = await createClient()

  // First get current status
  const { data: current, error: fetchError } = await supabase
    .from('surveys')
    .select('is_active')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  const { error } = await supabase
    .from('surveys')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/surveys')
  return { success: true, isActive: !current.is_active }
}

/**
 * Delete a survey
 */
export async function deleteSurvey(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('surveys').delete().eq('id', id)

  if (error) {
    console.error('Error deleting survey:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/surveys')
  return { success: true }
}

// ============================================================================
// Survey Invitations
// ============================================================================

/**
 * Send a survey invitation to a client
 */
export async function sendSurveyInvitation(data: {
  surveyId: string
  clientId: string
  serviceId?: string
  sendVia: 'email' | 'portal' | 'sms'
}) {
  const supabase = await createClient()

  // Get client info for the email
  const { data: client, error: clientError } = await supabase
    .from('leads')
    .select('name, email, organization_id')
    .eq('id', data.clientId)
    .single()

  if (clientError || !client) {
    return { success: false, error: 'Client not found' }
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('survey_invitations')
    .insert({
      survey_id: data.surveyId,
      client_id: data.clientId,
      service_id: data.serviceId || null,
      organization_id: client.organization_id,
      sent_via: data.sendVia,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating survey invitation:', error)
    return { success: false, error: error.message }
  }

  // TODO: Actually send the email/SMS/portal notification
  // For now, just log and return the invitation
  console.log(
    `[Survey] Invitation created for ${client.email}, token: ${invitation.token}`
  )

  return { success: true, invitation: invitation as SurveyInvitation }
}

/**
 * Mark invitation as opened
 */
export async function markInvitationOpened(token: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('survey_invitations')
    .update({ opened_at: new Date().toISOString() })
    .eq('token', token)
    .is('opened_at', null)

  if (error) {
    console.error('Error marking invitation opened:', error)
  }

  return { success: !error }
}

// ============================================================================
// Survey Responses
// ============================================================================

/**
 * Submit a survey response
 */
export async function submitSurveyResponse(data: {
  token: string
  responses: Record<string, string | number>
  npsScore?: number
  feedbackText?: string
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = await createClient()

  // Get invitation details
  const { data: invitation, error: invError } = await supabase
    .from('survey_invitations')
    .select('survey_id, client_id, service_id, organization_id, completed_at')
    .eq('token', data.token)
    .single()

  if (invError || !invitation) {
    return { success: false, error: 'Invalid survey link' }
  }

  if (invitation.completed_at) {
    return { success: false, error: 'Survey already completed' }
  }

  // Determine NPS sentiment
  let sentiment: 'promoter' | 'passive' | 'detractor' | null = null
  if (data.npsScore !== undefined) {
    if (data.npsScore >= 9) sentiment = 'promoter'
    else if (data.npsScore >= 7) sentiment = 'passive'
    else sentiment = 'detractor'
  }

  // Create response
  const { data: response, error } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: invitation.survey_id,
      client_id: invitation.client_id,
      service_id: invitation.service_id,
      organization_id: invitation.organization_id,
      responses: data.responses,
      nps_score: data.npsScore,
      feedback_text: data.feedbackText || null,
      sentiment,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting survey response:', error)
    return { success: false, error: error.message }
  }

  return { success: true, response: response as SurveyResponse }
}

/**
 * Get survey responses for a specific survey
 */
export async function getSurveyResponses(
  surveyId: string,
  options?: { limit?: number; offset?: number }
) {
  const supabase = await createClient()
  const { limit = 50, offset = 0 } = options || {}

  const { data, error, count } = await supabase
    .from('survey_responses')
    .select(
      `
      *,
      client:leads(id, name, email),
      service:client_services(id, service_type)
    `,
      { count: 'exact' }
    )
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching survey responses:', error)
    return { success: false, error: error.message }
  }

  return {
    success: true,
    responses: data as (SurveyResponse & {
      client: { id: string; name: string; email: string }
      service: { id: string; service_type: string } | null
    })[],
    total: count || 0,
  }
}

/**
 * Get survey statistics/summary
 */
export async function getSurveyStats(surveyId: string) {
  const supabase = await createClient()

  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('nps_score, sentiment, submitted_at')
    .eq('survey_id', surveyId)
    .not('nps_score', 'is', null)

  if (error) {
    console.error('Error fetching survey stats:', error)
    return { success: false, error: error.message }
  }

  const total = responses.length
  const promoters = responses.filter(r => r.sentiment === 'promoter').length
  const passives = responses.filter(r => r.sentiment === 'passive').length
  const detractors = responses.filter(r => r.sentiment === 'detractor').length

  const nps =
    total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null

  const avgScore =
    total > 0
      ? responses.reduce((sum, r) => sum + (r.nps_score || 0), 0) / total
      : null

  // Get invitation stats
  const { data: invitations } = await supabase
    .from('survey_invitations')
    .select('id, completed_at')
    .eq('survey_id', surveyId)

  const invitationCount = invitations?.length || 0
  const completedCount = invitations?.filter(i => i.completed_at).length || 0
  const responseRate =
    invitationCount > 0
      ? Math.round((completedCount / invitationCount) * 100)
      : null

  return {
    success: true,
    stats: {
      totalResponses: total,
      promoters,
      passives,
      detractors,
      nps,
      averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
      invitationsSent: invitationCount,
      responseRate,
    },
  }
}

// ============================================================================
// NPS Dashboard Stats
// ============================================================================

/**
 * Get overall NPS stats across all surveys
 */
export async function getOverallNPSStats() {
  const supabase = await createClient()

  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('nps_score, sentiment, submitted_at')
    .not('nps_score', 'is', null)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching overall NPS stats:', error)
    return { success: false, error: error.message }
  }

  const total = responses.length
  const promoters = responses.filter(r => r.sentiment === 'promoter').length
  const passives = responses.filter(r => r.sentiment === 'passive').length
  const detractors = responses.filter(r => r.sentiment === 'detractor').length

  const nps =
    total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null

  // Calculate trend (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const recentResponses = responses.filter(
    r => new Date(r.submitted_at) >= thirtyDaysAgo
  )
  const previousResponses = responses.filter(
    r =>
      new Date(r.submitted_at) >= sixtyDaysAgo &&
      new Date(r.submitted_at) < thirtyDaysAgo
  )

  const recentNPS =
    recentResponses.length > 0
      ? Math.round(
          ((recentResponses.filter(r => r.sentiment === 'promoter').length -
            recentResponses.filter(r => r.sentiment === 'detractor').length) /
            recentResponses.length) *
            100
        )
      : null

  const previousNPS =
    previousResponses.length > 0
      ? Math.round(
          ((previousResponses.filter(r => r.sentiment === 'promoter').length -
            previousResponses.filter(r => r.sentiment === 'detractor').length) /
            previousResponses.length) *
            100
        )
      : null

  const trend =
    recentNPS !== null && previousNPS !== null ? recentNPS - previousNPS : null

  return {
    success: true,
    stats: {
      totalResponses: total,
      promoters,
      passives,
      detractors,
      nps,
      trend,
      recentResponses: recentResponses.length,
    },
  }
}
