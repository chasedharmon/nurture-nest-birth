'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { verifyCredentials } from '@/lib/sms/twilio'

// =====================================================
// Types
// =====================================================

type ProviderMode = 'platform' | 'byot'

interface SmsConfig {
  providerMode: ProviderMode
  platformSmsEnabled: boolean
  requireOptIn: boolean
  autoHandleOptOut: boolean
  rateLimitPerMinute: number
}

interface BYOTCredentials {
  accountSid: string
  authToken: string
  phoneNumber: string
  messagingServiceSid?: string
  isVerified?: boolean
  verifiedAt?: string
}

interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// =====================================================
// Get SMS Config
// =====================================================

export async function getSmsConfig(
  organizationId: string
): Promise<
  ActionResult<{ config: SmsConfig; credentials: BYOTCredentials | null }>
> {
  const supabase = createAdminClient()

  try {
    // Get SMS config
    const { data: configData } = await supabase
      .from('sms_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    // Get BYOT credentials if any
    const { data: credentialsData } = await supabase
      .from('sms_credentials')
      .select(
        'account_sid, phone_number, messaging_service_sid, is_verified, verified_at'
      )
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    const config: SmsConfig = {
      providerMode: (configData?.provider_mode as ProviderMode) || 'platform',
      platformSmsEnabled: configData?.platform_sms_enabled ?? true,
      requireOptIn: configData?.require_opt_in ?? true,
      autoHandleOptOut: configData?.auto_handle_opt_out ?? true,
      rateLimitPerMinute: configData?.rate_limit_per_minute ?? 60,
    }

    const credentials: BYOTCredentials | null = credentialsData
      ? {
          accountSid: credentialsData.account_sid,
          authToken: '********', // Never return auth token
          phoneNumber: credentialsData.phone_number,
          messagingServiceSid:
            credentialsData.messaging_service_sid || undefined,
          isVerified: credentialsData.is_verified,
          verifiedAt: credentialsData.verified_at,
        }
      : null

    return { success: true, data: { config, credentials } }
  } catch (error) {
    console.error('[SMS Settings] Error getting config:', error)
    return { success: false, error: 'Failed to load SMS settings' }
  }
}

// =====================================================
// Save SMS Config
// =====================================================

export async function saveSmsConfig(
  organizationId: string,
  config: SmsConfig
): Promise<ActionResult> {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.from('sms_config').upsert(
      {
        organization_id: organizationId,
        provider_mode: config.providerMode,
        platform_sms_enabled: config.platformSmsEnabled,
        require_opt_in: config.requireOptIn,
        auto_handle_opt_out: config.autoHandleOptOut,
        rate_limit_per_minute: config.rateLimitPerMinute,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    )

    if (error) {
      console.error('[SMS Settings] Error saving config:', error)
      return { success: false, error: 'Failed to save settings' }
    }

    return { success: true }
  } catch (error) {
    console.error('[SMS Settings] Error saving config:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}

// =====================================================
// Verify BYOT Credentials
// =====================================================

export async function verifyBYOTCredentials(
  organizationId: string,
  credentials: { accountSid: string; authToken: string; phoneNumber: string }
): Promise<ActionResult> {
  // Verify organization exists
  const supabase = createAdminClient()

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { success: false, error: 'Organization not found' }
  }

  // Validate inputs
  if (!credentials.accountSid.startsWith('AC')) {
    return { success: false, error: 'Account SID must start with "AC"' }
  }

  if (!credentials.phoneNumber.startsWith('+')) {
    return {
      success: false,
      error: 'Phone number must be in E.164 format (e.g., +1234567890)',
    }
  }

  // Verify with Twilio
  const result = await verifyCredentials({
    accountSid: credentials.accountSid,
    authToken: credentials.authToken,
    phoneNumber: credentials.phoneNumber,
  })

  if (!result.valid) {
    return {
      success: false,
      error: result.error || 'Invalid Twilio credentials',
    }
  }

  return { success: true }
}

// =====================================================
// Save BYOT Credentials
// =====================================================

export async function saveBYOTCredentials(
  organizationId: string,
  credentials: {
    accountSid: string
    authToken: string
    phoneNumber: string
    messagingServiceSid?: string
  }
): Promise<ActionResult> {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.from('sms_credentials').upsert(
      {
        organization_id: organizationId,
        provider: 'twilio',
        account_sid: credentials.accountSid,
        auth_token: credentials.authToken, // Note: In production, consider additional encryption
        phone_number: credentials.phoneNumber,
        messaging_service_sid: credentials.messagingServiceSid || null,
        is_verified: true,
        verified_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    )

    if (error) {
      console.error('[SMS Settings] Error saving credentials:', error)
      return { success: false, error: 'Failed to save credentials' }
    }

    // Update SMS config to use BYOT
    await saveSmsConfig(organizationId, {
      providerMode: 'byot',
      platformSmsEnabled: true,
      requireOptIn: true,
      autoHandleOptOut: true,
      rateLimitPerMinute: 60,
    })

    return { success: true }
  } catch (error) {
    console.error('[SMS Settings] Error saving credentials:', error)
    return { success: false, error: 'Failed to save credentials' }
  }
}

// =====================================================
// Delete BYOT Credentials
// =====================================================

export async function deleteBYOTCredentials(
  organizationId: string
): Promise<ActionResult> {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('sms_credentials')
      .delete()
      .eq('organization_id', organizationId)

    if (error) {
      console.error('[SMS Settings] Error deleting credentials:', error)
      return { success: false, error: 'Failed to delete credentials' }
    }

    // Update SMS config to use platform
    await saveSmsConfig(organizationId, {
      providerMode: 'platform',
      platformSmsEnabled: true,
      requireOptIn: true,
      autoHandleOptOut: true,
      rateLimitPerMinute: 60,
    })

    return { success: true }
  } catch (error) {
    console.error('[SMS Settings] Error deleting credentials:', error)
    return { success: false, error: 'Failed to delete credentials' }
  }
}
