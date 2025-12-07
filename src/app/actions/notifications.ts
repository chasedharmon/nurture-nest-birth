'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail, sendTrackedEmail } from '@/lib/email/send'
import { emailConfig } from '@/lib/email/config'
import {
  MagicLinkEmail,
  WelcomeEmail,
  MeetingScheduledEmail,
  MeetingReminderEmail,
  DocumentSharedEmail,
  PaymentReceivedEmail,
} from '@/lib/email/templates'
import type {
  NotificationStatus,
  MagicLinkEmailData,
  WelcomeEmailData,
  MeetingScheduledEmailData,
  MeetingReminderEmailData,
  DocumentSharedEmailData,
  PaymentReceivedEmailData,
} from '@/lib/email/types'

// ============================================================================
// Notification Logging
// ============================================================================

interface LogNotificationParams {
  clientId?: string
  notificationType: string
  channel: 'email' | 'sms'
  recipient: string
  subject?: string
  status: NotificationStatus
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export async function logNotification(params: LogNotificationParams) {
  const supabase = await createClient()

  const { error } = await supabase.from('notification_log').insert({
    client_id: params.clientId,
    notification_type: params.notificationType,
    channel: params.channel,
    recipient: params.recipient,
    subject: params.subject,
    status: params.status,
    sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    error_message: params.errorMessage,
    metadata: params.metadata || {},
  })

  if (error) {
    console.error('[Notifications] Failed to log notification:', error)
  }

  return { success: !error }
}

export async function getNotificationLog(clientId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Notifications] Failed to get log:', error)
    return []
  }

  return data
}

// ============================================================================
// Notification Preferences
// ============================================================================

export async function getNotificationPreferences(clientId: string) {
  // Use admin client to bypass RLS for client portal
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found
    console.error('[Notifications] Failed to get preferences:', error)
  }

  // Return defaults if not found
  return (
    data || {
      meeting_reminders: true,
      document_notifications: true,
      payment_reminders: true,
      marketing_emails: false,
      reminder_hours_before: 24,
    }
  )
}

export async function updateNotificationPreferences(
  clientId: string,
  preferences: {
    meeting_reminders?: boolean
    document_notifications?: boolean
    payment_reminders?: boolean
    marketing_emails?: boolean
    reminder_hours_before?: number
  }
) {
  // Use admin client to bypass RLS for client portal
  const supabase = createAdminClient()

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      client_id: clientId,
      ...preferences,
    },
    { onConflict: 'client_id' }
  )

  if (error) {
    console.error('[Notifications] Failed to update preferences:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send magic link email to client
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  clientName: string
) {
  const magicLinkUrl = `${emailConfig.urls.portal}/verify?token=${token}`

  const data: MagicLinkEmailData = {
    recipientName: clientName?.split(' ')[0] || 'Client', // First name
    magicLinkUrl,
    expiresInHours: 24,
  }

  const result = await sendEmail({
    to: email,
    subject: `Sign in to ${emailConfig.branding.name}`,
    template: MagicLinkEmail({ data }),
  })

  // Log notification
  await logNotification({
    notificationType: 'magic-link',
    channel: 'email',
    recipient: email,
    subject: `Sign in to ${emailConfig.branding.name}`,
    status: result.success ? 'sent' : 'failed',
    errorMessage: result.error,
    metadata: { messageId: result.messageId },
  })

  return result
}

/**
 * Send welcome email to new client
 */
export async function sendWelcomeEmail(clientId: string) {
  const supabase = await createClient()

  // Get client info
  const { data: client, error } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    console.error('[Notifications] Client not found:', clientId)
    return { success: false, error: 'Client not found' }
  }

  const data: WelcomeEmailData = {
    clientName: client.name.split(' ')[0],
    portalUrl: `${emailConfig.urls.portal}/dashboard`,
    doulaName: emailConfig.doula.name,
    doulaPhone: emailConfig.doula.phone,
  }

  return sendTrackedEmail({
    to: client.email,
    subject: `Welcome to ${emailConfig.branding.name}!`,
    template: WelcomeEmail({ data }),
    clientId,
    notificationType: 'welcome',
  })
}

/**
 * Send meeting scheduled notification
 */
export async function sendMeetingScheduledEmail(meetingId: string) {
  const supabase = await createClient()

  // Get meeting with client info
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      leads:client_id (id, name, email)
    `
    )
    .eq('id', meetingId)
    .single()

  if (error || !meeting) {
    console.error('[Notifications] Meeting not found:', meetingId)
    return { success: false, error: 'Meeting not found' }
  }

  const client = meeting.leads as { id: string; name: string; email: string }

  // Check notification preferences
  const prefs = await getNotificationPreferences(client.id)
  if (!prefs.meeting_reminders) {
    console.log('[Notifications] Meeting notifications disabled for client')
    return { success: true, skipped: true }
  }

  const data: MeetingScheduledEmailData = {
    clientName: client.name?.split(' ')[0] || 'Client',
    meetingType: meeting.meeting_type,
    meetingTitle: meeting.title,
    scheduledAt: new Date(meeting.scheduled_at),
    duration: meeting.duration_minutes || 60,
    location: meeting.location,
    meetingLink: meeting.meeting_link,
    preparationNotes: meeting.preparation_notes,
    doulaName: emailConfig.doula.name || 'Your Doula',
  }

  return sendTrackedEmail({
    to: client.email,
    subject: `Your appointment is confirmed - ${formatMeetingType(meeting.meeting_type)}`,
    template: MeetingScheduledEmail({ data }),
    clientId: client.id,
    notificationType: 'meeting-scheduled',
  })
}

/**
 * Send meeting reminder notification
 */
export async function sendMeetingReminderEmail(
  meetingId: string,
  hoursUntil: number = 24
) {
  const supabase = await createClient()

  // Get meeting with client info
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      leads:client_id (id, name, email)
    `
    )
    .eq('id', meetingId)
    .single()

  if (error || !meeting) {
    console.error('[Notifications] Meeting not found:', meetingId)
    return { success: false, error: 'Meeting not found' }
  }

  const client = meeting.leads as { id: string; name: string; email: string }

  // Check notification preferences
  const prefs = await getNotificationPreferences(client.id)
  if (!prefs.meeting_reminders) {
    console.log('[Notifications] Meeting notifications disabled for client')
    return { success: true, skipped: true }
  }

  const data: MeetingReminderEmailData = {
    clientName: client.name?.split(' ')[0] || 'Client',
    meetingType: meeting.meeting_type,
    meetingTitle: meeting.title,
    scheduledAt: new Date(meeting.scheduled_at),
    duration: meeting.duration_minutes || 60,
    location: meeting.location,
    meetingLink: meeting.meeting_link,
    preparationNotes: meeting.preparation_notes,
    hoursUntil,
    doulaName: emailConfig.doula.name || 'Your Doula',
  }

  const timeLabel = hoursUntil <= 2 ? 'soon' : 'tomorrow'

  return sendTrackedEmail({
    to: client.email,
    subject: `Reminder: Your appointment is ${timeLabel}`,
    template: MeetingReminderEmail({ data }),
    clientId: client.id,
    notificationType: 'meeting-reminder',
  })
}

/**
 * Send document shared notification
 */
export async function sendDocumentSharedEmail(
  documentId: string,
  clientId: string
) {
  const supabase = await createClient()

  // Get document and client info
  const [docResult, clientResult] = await Promise.all([
    supabase.from('client_documents').select('*').eq('id', documentId).single(),
    supabase
      .from('leads')
      .select('id, name, email')
      .eq('id', clientId)
      .single(),
  ])

  if (docResult.error || !docResult.data) {
    console.error('[Notifications] Document not found:', documentId)
    return { success: false, error: 'Document not found' }
  }

  if (clientResult.error || !clientResult.data) {
    console.error('[Notifications] Client not found:', clientId)
    return { success: false, error: 'Client not found' }
  }

  const document = docResult.data
  const client = clientResult.data

  // Check notification preferences
  const prefs = await getNotificationPreferences(client.id)
  if (!prefs.document_notifications) {
    console.log('[Notifications] Document notifications disabled for client')
    return { success: true, skipped: true }
  }

  const data: DocumentSharedEmailData = {
    clientName: client.name.split(' ')[0],
    documentTitle: document.title,
    documentType: document.document_type,
    documentDescription: document.description,
    portalUrl: emailConfig.urls.portal,
    doulaName: emailConfig.doula.name,
  }

  return sendTrackedEmail({
    to: client.email,
    subject: `New document: ${document.title}`,
    template: DocumentSharedEmail({ data }),
    clientId: client.id,
    notificationType: 'document-shared',
  })
}

/**
 * Send payment received notification
 */
export async function sendPaymentReceivedEmail(paymentId: string) {
  const supabase = await createClient()

  // Get payment with client and service info
  const { data: payment, error } = await supabase
    .from('payments')
    .select(
      `
      *,
      leads:client_id (id, name, email),
      client_services:service_id (service_type, package_name)
    `
    )
    .eq('id', paymentId)
    .single()

  if (error || !payment) {
    console.error('[Notifications] Payment not found:', paymentId)
    return { success: false, error: 'Payment not found' }
  }

  const client = payment.leads as { id: string; name: string; email: string }
  const service = payment.client_services as {
    service_type: string
    package_name?: string
  } | null

  // Get remaining balance
  const { data: summary } = await supabase.rpc('get_client_payment_summary', {
    p_client_id: client.id,
  })

  const data: PaymentReceivedEmailData = {
    clientName: client.name?.split(' ')[0] || 'Client',
    amount: payment.amount,
    paymentMethod: payment.payment_method || 'other',
    serviceName: service
      ? service.package_name || formatServiceType(service.service_type)
      : undefined,
    transactionDate: new Date(payment.payment_date || payment.created_at),
    remainingBalance: summary?.balance_due || 0,
    doulaName: emailConfig.doula.name || 'Your Doula',
  }

  return sendTrackedEmail({
    to: client.email,
    subject: `Payment received - Thank you!`,
    template: PaymentReceivedEmail({ data }),
    clientId: client.id,
    notificationType: 'payment-received',
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatMeetingType(type: string): string {
  const labels: Record<string, string> = {
    consultation: 'Free Consultation',
    prenatal: 'Prenatal Visit',
    birth: 'Birth Support',
    postpartum: 'Postpartum Visit',
    follow_up: 'Follow-up Visit',
    other: 'Appointment',
  }
  return labels[type] || type
}

function formatServiceType(type: string): string {
  const labels: Record<string, string> = {
    birth_doula: 'Birth Doula',
    postpartum_doula: 'Postpartum Doula',
    lactation_consulting: 'Lactation Consulting',
    childbirth_education: 'Childbirth Education',
    other: 'Service',
  }
  return labels[type] || type
}
