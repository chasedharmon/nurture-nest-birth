/**
 * Twilio Client with Hybrid Credential Support
 *
 * Supports two modes:
 * 1. Platform Mode: Uses platform-level Twilio credentials (your account)
 * 2. BYOT Mode: Uses organization's own Twilio credentials
 *
 * Environment Variables (for Platform Mode):
 * - TWILIO_ACCOUNT_SID: Platform Twilio account SID
 * - TWILIO_AUTH_TOKEN: Platform Twilio auth token
 * - TWILIO_PHONE_NUMBER: Platform sending phone number (E.164)
 * - TWILIO_STATUS_CALLBACK_URL: Webhook URL for delivery status
 */

import { createAdminClient } from '@/lib/supabase/server'
import type TwilioSDK from 'twilio'

// Twilio SDK - conditionally imported
let Twilio: typeof TwilioSDK | null = null

// Types for Twilio responses
interface TwilioMessageInstance {
  sid: string
  status: string
  numSegments: string
  errorCode?: number
  errorMessage?: string
  dateCreated: Date
  dateSent?: Date
}

// =====================================================
// Types
// =====================================================

export interface TwilioCredentials {
  accountSid: string
  authToken: string
  phoneNumber: string
  messagingServiceSid?: string
  statusCallbackUrl?: string
}

export interface TwilioSendParams {
  to: string
  body: string
  from?: string
  statusCallback?: string
  organizationId?: string
}

export interface TwilioSendResult {
  success: boolean
  messageId?: string
  segmentCount?: number
  status?: string
  error?: string
  errorCode?: string
  provider: 'platform' | 'byot' | 'stub'
}

export type ProviderMode = 'platform' | 'byot'

export interface SmsProviderConfig {
  mode: ProviderMode
  credentials: TwilioCredentials | null
  isConfigured: boolean
}

// =====================================================
// Configuration Detection
// =====================================================

/**
 * Check if platform Twilio is configured
 */
export function isPlatformTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
}

/**
 * Get platform Twilio credentials from environment
 */
export function getPlatformCredentials(): TwilioCredentials | null {
  if (!isPlatformTwilioConfigured()) {
    return null
  }

  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
  }
}

/**
 * Get BYOT credentials for an organization from database
 */
export async function getBYOTCredentials(
  organizationId: string
): Promise<TwilioCredentials | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('sms_credentials')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    accountSid: data.account_sid,
    authToken: data.auth_token,
    phoneNumber: data.phone_number,
    messagingServiceSid: data.messaging_service_sid || undefined,
    statusCallbackUrl: data.status_callback_url || undefined,
  }
}

/**
 * Get the SMS provider configuration for an organization
 * Determines which credentials to use based on org config
 */
export async function getSmsProviderConfig(
  organizationId: string
): Promise<SmsProviderConfig> {
  const supabase = createAdminClient()

  // Get org's SMS config
  const { data: config } = await supabase
    .from('sms_config')
    .select('provider_mode')
    .eq('organization_id', organizationId)
    .single()

  const mode: ProviderMode =
    (config?.provider_mode as ProviderMode) || 'platform'

  // Get appropriate credentials based on mode
  let credentials: TwilioCredentials | null = null

  if (mode === 'byot') {
    credentials = await getBYOTCredentials(organizationId)
    // Fall back to platform if BYOT not configured
    if (!credentials) {
      console.warn(
        `[Twilio] Org ${organizationId} set to BYOT but no credentials found, falling back to platform`
      )
      credentials = getPlatformCredentials()
    }
  } else {
    credentials = getPlatformCredentials()
  }

  return {
    mode: credentials === getPlatformCredentials() ? 'platform' : 'byot',
    credentials,
    isConfigured: credentials !== null,
  }
}

// =====================================================
// Twilio Client Factory
// =====================================================

/**
 * Create a Twilio client instance with given credentials
 */
async function createTwilioClient(
  credentials: TwilioCredentials
): Promise<TwilioSDK.Twilio | null> {
  // Lazy load Twilio SDK
  if (!Twilio) {
    try {
      const twilioModule = await import('twilio')
      Twilio = twilioModule.default
    } catch {
      console.error('[Twilio] Failed to load Twilio SDK. Is it installed?')
      return null
    }
  }

  try {
    return Twilio(credentials.accountSid, credentials.authToken)
  } catch (error) {
    console.error('[Twilio] Failed to create client:', error)
    return null
  }
}

// =====================================================
// Core Send Function
// =====================================================

/**
 * Send SMS via Twilio (real implementation)
 * Uses hybrid credential system - platform or BYOT based on org config
 */
export async function sendViaTwilio(
  params: TwilioSendParams
): Promise<TwilioSendResult> {
  const { to, body, from, statusCallback, organizationId } = params

  // Get provider config
  const providerConfig = organizationId
    ? await getSmsProviderConfig(organizationId)
    : {
        mode: 'platform' as const,
        credentials: getPlatformCredentials(),
        isConfigured: isPlatformTwilioConfigured(),
      }

  // If no credentials configured, use stub mode
  if (!providerConfig.isConfigured || !providerConfig.credentials) {
    console.log('[Twilio] No credentials configured, using stub mode')
    return sendViaStub(params)
  }

  const credentials = providerConfig.credentials

  // Create Twilio client
  const client = await createTwilioClient(credentials)

  if (!client) {
    console.log('[Twilio] Client creation failed, using stub mode')
    return sendViaStub(params)
  }

  try {
    const messageOptions: {
      to: string
      body: string
      from?: string
      messagingServiceSid?: string
      statusCallback?: string
    } = {
      to,
      body,
    }

    // Use messaging service if available, otherwise use phone number
    if (credentials.messagingServiceSid) {
      messageOptions.messagingServiceSid = credentials.messagingServiceSid
    } else {
      messageOptions.from = from || credentials.phoneNumber
    }

    // Add status callback if available
    if (statusCallback || credentials.statusCallbackUrl) {
      messageOptions.statusCallback =
        statusCallback || credentials.statusCallbackUrl
    }

    const message = (await client.messages.create(
      messageOptions
    )) as TwilioMessageInstance

    return {
      success: true,
      messageId: message.sid,
      segmentCount: parseInt(message.numSegments, 10) || 1,
      status: message.status,
      provider: providerConfig.mode,
    }
  } catch (error) {
    const twilioError = error as { code?: number; message?: string }
    console.error('[Twilio] Send failed:', twilioError)

    return {
      success: false,
      error: twilioError.message || 'Unknown Twilio error',
      errorCode: twilioError.code?.toString(),
      provider: providerConfig.mode,
    }
  }
}

/**
 * Stub implementation for when Twilio is not configured
 * Logs the action and returns mock success
 */
export function sendViaStub(params: TwilioSendParams): TwilioSendResult {
  console.log('[Twilio Stub] Would send SMS:', {
    to: params.to,
    bodyLength: params.body.length,
    organizationId: params.organizationId,
  })

  // Generate mock message ID
  const mockMessageId = `SM_stub_${Date.now()}_${Math.random().toString(36).substring(7)}`

  return {
    success: true,
    messageId: mockMessageId,
    segmentCount: Math.ceil(params.body.length / 160),
    status: 'queued',
    provider: 'stub',
  }
}

// =====================================================
// Message Status Functions
// =====================================================

/**
 * Get message delivery status from Twilio
 */
export async function getMessageStatus(
  messageId: string,
  organizationId?: string
): Promise<{
  status: string
  errorCode?: string
  errorMessage?: string
  dateSent?: Date
}> {
  // Get provider config
  const providerConfig = organizationId
    ? await getSmsProviderConfig(organizationId)
    : {
        mode: 'platform' as const,
        credentials: getPlatformCredentials(),
        isConfigured: isPlatformTwilioConfigured(),
      }

  if (!providerConfig.isConfigured || !providerConfig.credentials) {
    // Stub mode - return mock delivered
    return {
      status: 'delivered',
      dateSent: new Date(),
    }
  }

  const client = await createTwilioClient(providerConfig.credentials)

  if (!client) {
    return {
      status: 'delivered',
      dateSent: new Date(),
    }
  }

  try {
    const message = (await client
      .messages(messageId)
      .fetch()) as TwilioMessageInstance

    return {
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage,
      dateSent: message.dateSent,
    }
  } catch (error) {
    console.error('[Twilio] Failed to get message status:', error)
    return {
      status: 'unknown',
    }
  }
}

// =====================================================
// Webhook Signature Verification
// =====================================================

/**
 * Verify Twilio webhook signature
 */
export async function verifyWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  organizationId?: string
): Promise<boolean> {
  // Get auth token for verification
  const providerConfig = organizationId
    ? await getSmsProviderConfig(organizationId)
    : {
        mode: 'platform' as const,
        credentials: getPlatformCredentials(),
        isConfigured: isPlatformTwilioConfigured(),
      }

  if (!providerConfig.credentials) {
    // No credentials - in dev mode, accept all
    if (process.env.NODE_ENV === 'development') {
      console.log('[Twilio] Dev mode: accepting webhook without verification')
      return true
    }
    return false
  }

  try {
    const twilio = await import('twilio')
    return twilio.validateRequest(
      providerConfig.credentials.authToken,
      signature,
      url,
      params
    )
  } catch (error) {
    console.error('[Twilio] Webhook verification failed:', error)
    return false
  }
}

// =====================================================
// Credential Verification
// =====================================================

/**
 * Verify Twilio credentials by making a test API call
 */
export async function verifyCredentials(
  credentials: TwilioCredentials
): Promise<{ valid: boolean; error?: string }> {
  const client = await createTwilioClient(credentials)

  if (!client) {
    return { valid: false, error: 'Failed to create Twilio client' }
  }

  try {
    // Try to fetch account info - if credentials are valid, this succeeds
    await client.api.accounts(credentials.accountSid).fetch()
    return { valid: true }
  } catch (error) {
    const twilioError = error as { message?: string; code?: number }
    return {
      valid: false,
      error: twilioError.message || 'Invalid credentials',
    }
  }
}

// =====================================================
// Exports for Client Module Compatibility
// =====================================================

export { isPlatformTwilioConfigured as isTwilioConfigured }
