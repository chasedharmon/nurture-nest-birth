/**
 * SMS Client Library
 *
 * Provides SMS sending capabilities with:
 * - Hybrid credential support (Platform Twilio or BYOT)
 * - Usage tracking and soft limit enforcement
 * - Automatic message logging to database
 * - Opt-in/opt-out consent management
 *
 * Environment Variables (for Platform Mode):
 * - TWILIO_ACCOUNT_SID: Platform Twilio account SID
 * - TWILIO_AUTH_TOKEN: Platform Twilio auth token
 * - TWILIO_PHONE_NUMBER: Platform sending phone number (E.164)
 */

import { createAdminClient } from '@/lib/supabase/server'
import {
  sendViaTwilio,
  isPlatformTwilioConfigured,
  TwilioSendResult,
} from './twilio'
import { checkSmsLimit, incrementUsage, SmsLimitCheck } from './tracking'
import {
  calculateSegments,
  formatPhoneNumber,
  isValidPhoneNumber,
  interpolateVariables,
  SMS_CHAR_LIMIT,
  SMS_EXTENDED_LIMIT,
} from './utils'

// Re-export utility functions for server-side convenience
// NOTE: Client components should import directly from '@/lib/sms/utils'
export {
  calculateSegments,
  formatPhoneNumber,
  isValidPhoneNumber,
  interpolateVariables,
  SMS_CHAR_LIMIT,
  SMS_EXTENDED_LIMIT,
}

// =====================================================
// Types
// =====================================================

export interface SendSmsParams {
  to: string
  body: string
  from?: string
  organizationId?: string
  clientId?: string
  templateId?: string
  workflowExecutionId?: string
  skipOptInCheck?: boolean // For transactional messages
  skipUsageTracking?: boolean // For BYOT mode
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
  segmentCount?: number
  provider?: 'platform' | 'byot' | 'stub'
  limitWarning?: string
  dbMessageId?: string
}

export interface SmsOptInStatus {
  phoneNumber: string
  optedIn: boolean
  optInDate?: string
  optOutDate?: string
  source?: 'web_form' | 'sms_reply' | 'manual' | 'import'
}

export interface SmsDeliveryStatus {
  messageId: string
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'
  errorCode?: string
  errorMessage?: string
  deliveredAt?: string
}

// =====================================================
// Main Send Function
// =====================================================

/**
 * Send an SMS message with full tracking and limit checking
 *
 * This is the main entry point for sending SMS. It:
 * 1. Validates the phone number
 * 2. Checks opt-in status (unless skipped)
 * 3. Checks usage limits (soft limit with overage warning)
 * 4. Sends via Twilio (platform or BYOT)
 * 5. Logs message to database
 * 6. Updates usage tracking
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const {
    to,
    body,
    from,
    organizationId,
    clientId,
    templateId,
    workflowExecutionId,
    skipOptInCheck = false,
    skipUsageTracking = false,
  } = params

  // Validate phone number
  if (!isValidPhoneNumber(to)) {
    console.log('[SMS] Invalid phone number:', to)
    return {
      success: false,
      error: 'Invalid phone number format',
    }
  }

  const formattedPhone = formatPhoneNumber(to)
  const { segments } = calculateSegments(body)

  // Check opt-in status (unless skipped for transactional messages)
  if (!skipOptInCheck && organizationId) {
    const optInStatus = await checkOptInStatus(formattedPhone, organizationId)
    if (!optInStatus.optedIn) {
      console.log('[SMS] Recipient not opted in:', formattedPhone)
      return {
        success: false,
        error: 'Recipient has not opted in to receive SMS',
      }
    }
  }

  // Check usage limits (soft limit)
  let limitCheck: SmsLimitCheck | null = null
  if (organizationId && !skipUsageTracking) {
    limitCheck = await checkSmsLimit(organizationId, segments)

    if (!limitCheck.canSend) {
      return {
        success: false,
        error: limitCheck.warningMessage || 'SMS limit reached',
      }
    }
  }

  // Send via Twilio
  const twilioResult: TwilioSendResult = await sendViaTwilio({
    to: formattedPhone,
    body,
    from,
    organizationId,
  })

  // Log message to database
  let dbMessageId: string | undefined

  if (organizationId) {
    dbMessageId = await logSmsMessage({
      organizationId,
      toPhone: formattedPhone,
      body,
      templateId,
      clientId,
      workflowExecutionId,
      externalId: twilioResult.messageId,
      segmentCount: twilioResult.segmentCount || segments,
      status: twilioResult.success ? 'sent' : 'failed',
      errorCode: twilioResult.errorCode,
      errorMessage: twilioResult.error,
    })
  }

  // Update usage tracking
  if (organizationId && !skipUsageTracking && twilioResult.success) {
    await incrementUsage(organizationId, twilioResult.segmentCount || segments)
  }

  return {
    success: twilioResult.success,
    messageId: twilioResult.messageId,
    error: twilioResult.error,
    segmentCount: twilioResult.segmentCount || segments,
    provider: twilioResult.provider,
    limitWarning: limitCheck?.warningMessage || undefined,
    dbMessageId,
  }
}

// =====================================================
// Message Logging
// =====================================================

interface LogSmsMessageParams {
  organizationId: string
  toPhone: string
  body: string
  templateId?: string
  clientId?: string
  workflowExecutionId?: string
  externalId?: string
  segmentCount: number
  status: string
  errorCode?: string
  errorMessage?: string
}

async function logSmsMessage(
  params: LogSmsMessageParams
): Promise<string | undefined> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('sms_messages')
    .insert({
      org_id: params.organizationId,
      to_phone: params.toPhone,
      body: params.body,
      template_id: params.templateId || null,
      client_id: params.clientId || null,
      workflow_execution_id: params.workflowExecutionId || null,
      external_id: params.externalId || null,
      segment_count: params.segmentCount,
      status: params.status,
      error_code: params.errorCode || null,
      error_message: params.errorMessage || null,
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[SMS] Failed to log message:', error)
    return undefined
  }

  return data?.id
}

// =====================================================
// Delivery Status
// =====================================================

/**
 * Get delivery status for a message from database
 */
export async function getMessageStatus(
  messageId: string
): Promise<SmsDeliveryStatus> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('sms_messages')
    .select('external_id, status, error_code, error_message, delivered_at')
    .eq('id', messageId)
    .single()

  if (error || !data) {
    return {
      messageId,
      status: 'queued',
    }
  }

  return {
    messageId: data.external_id || messageId,
    status: data.status as SmsDeliveryStatus['status'],
    errorCode: data.error_code || undefined,
    errorMessage: data.error_message || undefined,
    deliveredAt: data.delivered_at || undefined,
  }
}

// =====================================================
// Opt-In/Opt-Out Management
// =====================================================

/**
 * Check if a phone number is opted in for SMS
 */
export async function checkOptInStatus(
  phoneNumber: string,
  organizationId?: string
): Promise<SmsOptInStatus> {
  const formattedPhone = formatPhoneNumber(phoneNumber)
  const supabase = createAdminClient()

  let query = supabase
    .from('sms_consent')
    .select('*')
    .eq('phone_number', formattedPhone)

  if (organizationId) {
    query = query.eq('org_id', organizationId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    // No consent record - default behavior
    // In strict mode, this would be opted out
    // For now, we allow sending if no record exists (implicit opt-in)
    return {
      phoneNumber: formattedPhone,
      optedIn: true, // Default to true for backward compatibility
      source: 'web_form',
    }
  }

  return {
    phoneNumber: formattedPhone,
    optedIn: data.opted_in,
    optInDate: data.opt_in_date,
    optOutDate: data.opt_out_date,
    source: data.source,
  }
}

/**
 * Record an opt-in for a phone number
 */
export async function recordOptIn(
  phoneNumber: string,
  organizationId: string,
  source: SmsOptInStatus['source'] = 'web_form',
  clientId?: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phoneNumber)
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('record_sms_consent', {
    p_phone_number: formattedPhone,
    p_opted_in: true,
    p_source: source,
    p_org_id: organizationId,
    p_client_id: clientId || null,
  })

  if (error) {
    console.error('[SMS] Failed to record opt-in:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Record an opt-out for a phone number
 */
export async function recordOptOut(
  phoneNumber: string,
  organizationId: string,
  source: SmsOptInStatus['source'] = 'sms_reply'
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phoneNumber)
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('record_sms_consent', {
    p_phone_number: formattedPhone,
    p_opted_in: false,
    p_source: source,
    p_org_id: organizationId,
    p_client_id: null,
  })

  if (error) {
    console.error('[SMS] Failed to record opt-out:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// =====================================================
// Bulk SMS
// =====================================================

/**
 * Send a bulk SMS to multiple recipients
 */
export async function sendBulkSms(
  recipients: Array<{
    to: string
    body: string
    clientId?: string
    templateId?: string
  }>,
  organizationId: string
): Promise<{
  results: SendSmsResult[]
  successCount: number
  failCount: number
}> {
  console.log('[SMS] Sending bulk SMS:', {
    recipientCount: recipients.length,
    organizationId,
  })

  const results: SendSmsResult[] = []
  let successCount = 0
  let failCount = 0

  for (const recipient of recipients) {
    const result = await sendSms({
      ...recipient,
      organizationId,
    })
    results.push(result)
    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  }

  return { results, successCount, failCount }
}

// =====================================================
// Configuration Helpers
// =====================================================

/**
 * Check if SMS is configured and ready to send
 */
export function isSmsConfigured(): boolean {
  return isPlatformTwilioConfigured()
}

// =====================================================
// Webhook Types (for backward compatibility)
// =====================================================

export interface TwilioWebhookPayload {
  MessageSid: string
  From: string
  To: string
  Body: string
  AccountSid: string
  NumMedia: string
  NumSegments: string
}

export interface TwilioStatusCallbackPayload {
  MessageSid: string
  MessageStatus:
    | 'queued'
    | 'sending'
    | 'sent'
    | 'delivered'
    | 'failed'
    | 'undelivered'
  ErrorCode?: string
  ErrorMessage?: string
}

/**
 * Parse an incoming SMS message
 * Handles opt-out keywords (STOP, UNSUBSCRIBE, etc.)
 */
export function parseIncomingSms(payload: TwilioWebhookPayload): {
  from: string
  body: string
  isOptOut: boolean
  isOptIn: boolean
} {
  const body = payload.Body.trim().toUpperCase()
  const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
  const optInKeywords = ['START', 'YES', 'UNSTOP', 'SUBSCRIBE']

  return {
    from: payload.From,
    body: payload.Body,
    isOptOut: optOutKeywords.includes(body),
    isOptIn: optInKeywords.includes(body),
  }
}
