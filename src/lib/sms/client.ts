/**
 * SMS Client Library (Rails Only)
 *
 * This is a stubbed implementation for SMS messaging infrastructure.
 * When ready to go live, add your Twilio credentials to environment variables
 * and uncomment the Twilio SDK integration.
 *
 * Environment Variables Required for Live:
 * - TWILIO_ACCOUNT_SID: Your Twilio account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio auth token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (for sending)
 */

// import twilio from 'twilio'

// Uncomment when ready to integrate:
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID!,
//   process.env.TWILIO_AUTH_TOKEN!
// )

// =====================================================
// Constants
// =====================================================

export const SMS_CHAR_LIMIT = 160
export const SMS_EXTENDED_LIMIT = 1600 // Max for concatenated SMS

// =====================================================
// Types
// =====================================================

export interface SendSmsParams {
  to: string
  body: string
  from?: string // Defaults to TWILIO_PHONE_NUMBER
  clientId?: string // For tracking/logging
  templateId?: string // Reference to template used
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
  segmentCount?: number // Number of SMS segments used
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
// Utility Functions
// =====================================================

/**
 * Calculate the number of SMS segments a message will use
 * Standard SMS is 160 chars (or 70 for Unicode)
 */
export function calculateSegments(text: string): {
  segments: number
  charCount: number
  remaining: number
  isUnicode: boolean
} {
  // Check if message contains Unicode characters
  const isUnicode = /[^\x00-\x7F]/.test(text)
  const charLimit = isUnicode ? 70 : 160
  const multipartLimit = isUnicode ? 67 : 153 // Headers reduce available chars

  const charCount = text.length

  let segments: number
  if (charCount <= charLimit) {
    segments = 1
  } else {
    segments = Math.ceil(charCount / multipartLimit)
  }

  const remaining =
    segments === 1
      ? charLimit - charCount
      : multipartLimit - (charCount % multipartLimit)

  return {
    segments,
    charCount,
    remaining: Math.max(0, remaining),
    isUnicode,
  }
}

/**
 * Format a phone number to E.164 format (required by Twilio)
 * Assumes US numbers if no country code provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '')

  // If already has country code (11+ digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // If 10 digits, assume US
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // If already has full international format
  if (digits.length > 10) {
    return `+${digits}`
  }

  // Return as-is if we can't parse
  return phone
}

/**
 * Validate a phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // Basic E.164 validation: + followed by 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(formatted)
}

/**
 * Interpolate template variables in a message
 * Supports {{variable_name}} syntax
 */
export function interpolateVariables(
  template: string,
  data: Record<string, unknown>
): string {
  if (!template) return template

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    if (value === undefined || value === null) {
      return match // Keep the placeholder if no value
    }
    return String(value)
  })
}

// =====================================================
// Stubbed Client Functions
// =====================================================

/**
 * Send an SMS message
 * STUBBED: Logs action, returns mock success
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, body, clientId, templateId } = params

  // Validate phone number
  if (!isValidPhoneNumber(to)) {
    console.log('[SMS Stub] Invalid phone number:', to)
    return {
      success: false,
      error: 'Invalid phone number format',
    }
  }

  const formattedPhone = formatPhoneNumber(to)
  const { segments } = calculateSegments(body)

  console.log('[SMS Stub] Sending SMS:', {
    to: formattedPhone,
    bodyLength: body.length,
    segments,
    clientId,
    templateId,
  })

  // Stubbed: Return mock success
  const mockMessageId = `SM_stub_${Date.now()}_${Math.random().toString(36).substring(7)}`

  return {
    success: true,
    messageId: mockMessageId,
    segmentCount: segments,
  }

  // Real implementation:
  // try {
  //   const message = await client.messages.create({
  //     to: formattedPhone,
  //     from: params.from || process.env.TWILIO_PHONE_NUMBER!,
  //     body,
  //   })
  //   return {
  //     success: true,
  //     messageId: message.sid,
  //     segmentCount: message.numSegments,
  //   }
  // } catch (error) {
  //   return {
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
}

/**
 * Get delivery status for a message
 * STUBBED: Returns mock delivered status
 */
export async function getMessageStatus(
  messageId: string
): Promise<SmsDeliveryStatus> {
  console.log('[SMS Stub] Getting message status:', messageId)

  // Stubbed: Return mock delivered status
  return {
    messageId,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
  }

  // Real implementation:
  // const message = await client.messages(messageId).fetch()
  // return {
  //   messageId: message.sid,
  //   status: message.status,
  //   errorCode: message.errorCode?.toString(),
  //   errorMessage: message.errorMessage,
  // }
}

/**
 * Check if a phone number is opted in for SMS
 * STUBBED: Returns true for development
 */
export async function checkOptInStatus(
  phoneNumber: string
): Promise<SmsOptInStatus> {
  console.log('[SMS Stub] Checking opt-in status:', phoneNumber)

  // Stubbed: Return opted in for dev
  return {
    phoneNumber: formatPhoneNumber(phoneNumber),
    optedIn: true,
    optInDate: new Date().toISOString(),
    source: 'web_form',
  }

  // Real implementation would query the database
}

/**
 * Record an opt-in for a phone number
 * STUBBED: Logs action
 */
export async function recordOptIn(
  phoneNumber: string,
  source: SmsOptInStatus['source'] = 'web_form'
): Promise<{ success: boolean }> {
  console.log('[SMS Stub] Recording opt-in:', {
    phoneNumber: formatPhoneNumber(phoneNumber),
    source,
  })

  // Stubbed
  return { success: true }

  // Real implementation would insert into database
}

/**
 * Record an opt-out for a phone number
 * STUBBED: Logs action
 */
export async function recordOptOut(
  phoneNumber: string,
  source: SmsOptInStatus['source'] = 'sms_reply'
): Promise<{ success: boolean }> {
  console.log('[SMS Stub] Recording opt-out:', {
    phoneNumber: formatPhoneNumber(phoneNumber),
    source,
  })

  // Stubbed
  return { success: true }

  // Real implementation would update database
}

/**
 * Send a bulk SMS to multiple recipients
 * STUBBED: Logs action, returns mock results
 */
export async function sendBulkSms(
  recipients: Array<{ to: string; body: string; clientId?: string }>
): Promise<{
  results: SendSmsResult[]
  successCount: number
  failCount: number
}> {
  console.log('[SMS Stub] Sending bulk SMS:', {
    recipientCount: recipients.length,
  })

  const results: SendSmsResult[] = []
  let successCount = 0
  let failCount = 0

  for (const recipient of recipients) {
    const result = await sendSms(recipient)
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
// Webhook Handling (for Twilio callbacks)
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
 * Verify Twilio webhook signature
 * STUBBED: Always returns true in development
 */
export function verifyWebhookSignature(
  _authToken: string,
  _signature: string,
  _url: string,
  _params: Record<string, string>
): boolean {
  console.log('[SMS Stub] Verifying webhook signature')

  // Stubbed: Always valid in dev
  return true

  // Real implementation:
  // const twilio = require('twilio')
  // return twilio.validateRequest(authToken, signature, url, params)
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
