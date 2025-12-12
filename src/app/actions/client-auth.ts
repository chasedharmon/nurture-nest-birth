'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendMagicLinkEmail } from './notifications'
import { logAudit } from '@/lib/audit/logger'

const CLIENT_COOKIE_NAME = 'client_session'
const SESSION_EXPIRY_DAYS = 30
const MAGIC_LINK_EXPIRY_HOURS = 24
const BCRYPT_ROUNDS = 12

// ============================================================================
// Types
// ============================================================================

export type CrmRecordType = 'lead' | 'contact'

export interface CrmClientRecord {
  recordType: CrmRecordType
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  mobilePhone?: string | null
  mailingStreet?: string | null
  mailingCity?: string | null
  mailingState?: string | null
  mailingPostalCode?: string | null
  partnerName?: string | null
  expectedDueDate?: string | null
  actualBirthDate?: string | null
  accountId?: string | null
  leadStatus?: string | null
  leadSource?: string | null
  serviceInterest?: string | null
  message?: string | null
  portalAccessEnabled: boolean
  organizationId?: string | null
  // Backwards-compatible aliases for legacy code
  clientId: string // alias for id
  name: string // computed from firstName + lastName
}

export interface ClientSession extends CrmClientRecord {
  sessionId: string
}

// ============================================================================
// Token Generation
// ============================================================================

function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

// ============================================================================
// Password Hashing
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================================================
// CRM Client Lookup
// ============================================================================

/**
 * Find a CRM client (contact or lead) by email for portal authentication.
 * Contacts take priority over leads (converted customers first).
 */
async function findCrmClientByEmail(email: string): Promise<{
  recordType: CrmRecordType
  record: {
    id: string
    first_name: string
    last_name: string
    email: string
    password_hash: string | null
    portal_access_enabled: boolean
    organization_id: string | null
  }
} | null> {
  const supabase = createAdminClient()

  // First check crm_contacts (converted customers take priority)
  const { data: contact, error: contactError } = await supabase
    .from('crm_contacts')
    .select(
      'id, first_name, last_name, email, password_hash, portal_access_enabled, organization_id'
    )
    .ilike('email', email)
    .eq('portal_access_enabled', true)
    .limit(1)
    .single()

  if (!contactError && contact) {
    console.log('[Auth] Found CRM contact with portal access:', contact.id)
    return { recordType: 'contact', record: contact }
  }

  // Then check crm_leads (non-converted prospects)
  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select(
      'id, first_name, last_name, email, password_hash, portal_access_enabled, organization_id'
    )
    .ilike('email', email)
    .eq('portal_access_enabled', true)
    .eq('is_converted', false) // Don't allow login as converted lead
    .limit(1)
    .single()

  if (!leadError && lead) {
    console.log('[Auth] Found CRM lead with portal access:', lead.id)
    return { recordType: 'lead', record: lead }
  }

  // Legacy fallback: Check old leads table for backwards compatibility
  // This allows existing clients to login while migration is in progress
  const { data: legacyLead, error: legacyError } = await supabase
    .from('leads')
    .select('id, name, email, password_hash')
    .ilike('email', email)
    .limit(1)
    .single()

  if (!legacyError && legacyLead) {
    console.log('[Auth] Found legacy lead (backwards compat):', legacyLead.id)
    // Parse name into first/last
    const nameParts = (legacyLead.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      recordType: 'lead', // Treat as lead for limited portal access
      record: {
        id: legacyLead.id,
        first_name: firstName,
        last_name: lastName,
        email: legacyLead.email,
        password_hash: legacyLead.password_hash || null,
        portal_access_enabled: true, // Legacy leads always have access
        organization_id: null,
      },
    }
  }

  console.log('[Auth] No CRM client found with portal access for email:', email)
  return null
}

/**
 * Get full CRM client data for a session
 */
async function getCrmClientData(
  recordType: CrmRecordType,
  recordId: string
): Promise<CrmClientRecord | null> {
  const supabase = createAdminClient()

  if (recordType === 'contact') {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select(
        `
        id, first_name, last_name, email, phone, mobile_phone,
        mailing_street, mailing_city, mailing_state, mailing_postal_code,
        partner_name, expected_due_date, actual_birth_date,
        account_id, lead_source, portal_access_enabled, organization_id
      `
      )
      .eq('id', recordId)
      .single()

    if (error || !data) return null

    return {
      recordType: 'contact',
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      mobilePhone: data.mobile_phone,
      mailingStreet: data.mailing_street,
      mailingCity: data.mailing_city,
      mailingState: data.mailing_state,
      mailingPostalCode: data.mailing_postal_code,
      partnerName: data.partner_name,
      expectedDueDate: data.expected_due_date,
      actualBirthDate: data.actual_birth_date,
      accountId: data.account_id,
      leadSource: data.lead_source,
      portalAccessEnabled: data.portal_access_enabled,
      organizationId: data.organization_id,
      // Backwards-compatible aliases
      clientId: data.id,
      name: `${data.first_name} ${data.last_name}`.trim(),
    }
  } else {
    const { data, error } = await supabase
      .from('crm_leads')
      .select(
        `
        id, first_name, last_name, email, phone,
        expected_due_date, lead_status, lead_source,
        service_interest, message, portal_access_enabled, organization_id
      `
      )
      .eq('id', recordId)
      .single()

    if (error || !data) {
      // Fallback to legacy leads table
      const { data: legacyData, error: legacyError } = await supabase
        .from('leads')
        .select(
          'id, name, email, phone, expected_due_date, partner_name, actual_birth_date'
        )
        .eq('id', recordId)
        .single()

      if (legacyError || !legacyData) return null

      const nameParts = (legacyData.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      return {
        recordType: 'lead',
        id: legacyData.id,
        firstName,
        lastName,
        email: legacyData.email,
        phone: legacyData.phone,
        expectedDueDate: legacyData.expected_due_date,
        partnerName: legacyData.partner_name,
        actualBirthDate: legacyData.actual_birth_date,
        portalAccessEnabled: true,
        organizationId: null,
        // Backwards-compatible aliases
        clientId: legacyData.id,
        name: legacyData.name || '',
      }
    }

    return {
      recordType: 'lead',
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      expectedDueDate: data.expected_due_date,
      leadStatus: data.lead_status,
      leadSource: data.lead_source,
      serviceInterest: data.service_interest,
      message: data.message,
      portalAccessEnabled: data.portal_access_enabled,
      organizationId: data.organization_id,
      // Backwards-compatible aliases
      clientId: data.id,
      name: `${data.first_name} ${data.last_name}`.trim(),
    }
  }
}

// ============================================================================
// Session Management
// ============================================================================

async function createSession(
  recordType: CrmRecordType,
  recordId: string,
  legacyClientId?: string // For backwards compatibility
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = createAdminClient()
  const headersList = await headers()

  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  // Store session in database with CRM reference
  const { error } = await supabase.from('client_sessions').insert({
    client_id: legacyClientId || null, // Keep for backwards compat
    crm_record_type: recordType,
    crm_record_id: recordId,
    session_token: token,
    expires_at: expiresAt.toISOString(),
    ip_address: headersList.get('x-forwarded-for')?.split(',')[0] || null,
    user_agent: headersList.get('user-agent') || null,
  })

  if (error) {
    console.error('[Auth] Failed to create session:', error)
    throw new Error('Failed to create session')
  }

  return { token, expiresAt }
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies()

  cookieStore.set(CLIENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

async function invalidateSession(token: string) {
  const supabase = await createClient()

  await supabase.from('client_sessions').delete().eq('session_token', token)
}

async function updateSessionActivity(sessionId: string) {
  const supabase = await createClient()

  await supabase
    .from('client_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
}

// ============================================================================
// Sign In with Password
// ============================================================================

export async function signInClient(email: string, password: string) {
  console.log('[Auth] Sign in attempt for:', email)

  // Find CRM client
  const crmClient = await findCrmClientByEmail(email)

  if (!crmClient) {
    console.log('[Auth] No CRM client found with portal access')
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  const { recordType, record } = crmClient

  console.log(
    '[Auth] Found CRM client:',
    record.id,
    'type:',
    recordType,
    'password_hash exists:',
    !!record.password_hash
  )

  // Check password
  let isValidPassword = false

  if (record.password_hash) {
    // Has a real password set - verify with bcrypt
    isValidPassword = await verifyPassword(password, record.password_hash)
  } else {
    // No password set yet - for dev mode, allow default password
    if (process.env.NODE_ENV === 'development' && password === 'password123') {
      isValidPassword = true
      console.log('[Auth] Using development fallback password')
    }
  }

  if (!isValidPassword) {
    console.log(
      '[Auth] Invalid password - hash present:',
      !!record.password_hash
    )
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  // Create session
  try {
    const { token, expiresAt } = await createSession(recordType, record.id)
    await setSessionCookie(token, expiresAt)

    // Log audit event for client login
    if (record.organization_id) {
      await logAudit({
        organizationId: record.organization_id,
        action: 'login',
        entityType: 'client',
        entityId: record.id,
        metadata: {
          email: record.email,
          method: 'password',
          crmRecordType: recordType,
        },
      })
    }

    console.log('[Auth] Login successful for CRM', recordType, ':', record.id)

    return {
      success: true,
      clientId: record.id,
      recordType,
    }
  } catch {
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    }
  }
}

// ============================================================================
// Set Password (for first-time setup or reset)
// ============================================================================

export async function setClientPassword(
  recordType: CrmRecordType,
  recordId: string,
  password: string
) {
  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters.',
    }
  }

  const supabase = createAdminClient()
  const passwordHash = await hashPassword(password)

  const table = recordType === 'contact' ? 'crm_contacts' : 'crm_leads'

  const { error } = await supabase
    .from(table)
    .update({ password_hash: passwordHash })
    .eq('id', recordId)

  if (error) {
    console.error('[Auth] Failed to set password:', error)
    return {
      success: false,
      error: 'Failed to set password.',
    }
  }

  return { success: true }
}

// ============================================================================
// Magic Link Authentication
// ============================================================================

export async function requestMagicLink(email: string) {
  const supabase = createAdminClient()

  // Find CRM client
  const crmClient = await findCrmClientByEmail(email)

  if (!crmClient) {
    // Don't reveal if email exists or not
    console.log('[Auth] Magic link requested for unknown email:', email)
    return {
      success: true, // Always return success to prevent email enumeration
      message:
        'If an account exists with this email, you will receive a login link.',
    }
  }

  const { recordType, record } = crmClient

  // Generate token
  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + MAGIC_LINK_EXPIRY_HOURS)

  // Store token with CRM reference
  const { error: tokenError } = await supabase
    .from('client_auth_tokens')
    .insert({
      client_id: null, // Legacy field, no longer used
      crm_record_type: recordType,
      crm_record_id: record.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (tokenError) {
    console.error('[Auth] Failed to create magic link token:', tokenError)
    return {
      success: false,
      error: 'Failed to create login link. Please try again.',
    }
  }

  // Send email
  const clientName = `${record.first_name} ${record.last_name}`.trim()
  const emailResult = await sendMagicLinkEmail(record.email, token, clientName)

  if (!emailResult.success) {
    console.error('[Auth] Failed to send magic link email:', emailResult.error)
    return {
      success: false,
      error: 'Failed to send login link. Please try again.',
    }
  }

  console.log('[Auth] Magic link sent to:', email, 'CRM type:', recordType)

  return {
    success: true,
    message:
      'If an account exists with this email, you will receive a login link.',
  }
}

export async function verifyMagicLink(token: string) {
  const supabase = createAdminClient()

  // Look up the token - check for CRM fields first, then legacy
  const { data: authToken, error: tokenError } = await supabase
    .from('client_auth_tokens')
    .select('id, client_id, crm_record_type, crm_record_id, expires_at, used')
    .eq('token', token)
    .single()

  if (tokenError || !authToken) {
    return {
      success: false,
      error: 'Invalid or expired login link.',
    }
  }

  // Check if token is already used
  if (authToken.used) {
    return {
      success: false,
      error: 'This login link has already been used.',
    }
  }

  // Check if token is expired
  if (new Date(authToken.expires_at) < new Date()) {
    return {
      success: false,
      error: 'This login link has expired.',
    }
  }

  // Mark token as used
  await supabase
    .from('client_auth_tokens')
    .update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq('id', authToken.id)

  // Determine record type and ID
  let recordType: CrmRecordType
  let recordId: string

  if (authToken.crm_record_type && authToken.crm_record_id) {
    // New CRM-based token
    recordType = authToken.crm_record_type as CrmRecordType
    recordId = authToken.crm_record_id
  } else if (authToken.client_id) {
    // Legacy token - treat as lead
    recordType = 'lead'
    recordId = authToken.client_id
  } else {
    return {
      success: false,
      error: 'Invalid token data.',
    }
  }

  // Get client data for audit logging
  const clientData = await getCrmClientData(recordType, recordId)

  // Create session
  try {
    const { token: sessionToken, expiresAt } = await createSession(
      recordType,
      recordId,
      authToken.client_id || undefined // Keep legacy client_id for backwards compat
    )
    await setSessionCookie(sessionToken, expiresAt)

    // Log audit event for magic link login
    if (clientData?.organizationId) {
      await logAudit({
        organizationId: clientData.organizationId,
        action: 'login',
        entityType: 'client',
        entityId: recordId,
        metadata: {
          email: clientData.email,
          method: 'magic_link',
          crmRecordType: recordType,
        },
      })
    }

    console.log(
      '[Auth] Magic link login successful for CRM',
      recordType,
      ':',
      recordId
    )

    return {
      success: true,
      clientId: recordId,
      recordType,
    }
  } catch {
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    }
  }
}

// ============================================================================
// Session Validation
// ============================================================================

export async function getClientSession(): Promise<ClientSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CLIENT_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const supabase = createAdminClient()

  // Validate session in database - check CRM fields first
  const { data: session, error: sessionError } = await supabase
    .from('client_sessions')
    .select('id, client_id, crm_record_type, crm_record_id, expires_at')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    return null
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await invalidateSession(sessionToken)
    return null
  }

  // Update activity timestamp (don't await to avoid blocking)
  updateSessionActivity(session.id)

  // Determine record type and ID
  let recordType: CrmRecordType
  let recordId: string

  if (session.crm_record_type && session.crm_record_id) {
    // New CRM-based session
    recordType = session.crm_record_type as CrmRecordType
    recordId = session.crm_record_id
  } else if (session.client_id) {
    // Legacy session - treat as lead
    recordType = 'lead'
    recordId = session.client_id
  } else {
    return null
  }

  // Get full client data
  const clientData = await getCrmClientData(recordType, recordId)

  if (!clientData) {
    return null
  }

  return {
    sessionId: session.id,
    ...clientData,
  }
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOutClient() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CLIENT_COOKIE_NAME)?.value

  if (sessionToken) {
    const supabase = createAdminClient()

    // Get session info for audit logging
    const { data: session } = await supabase
      .from('client_sessions')
      .select('id, crm_record_type, crm_record_id, client_id')
      .eq('session_token', sessionToken)
      .single()

    if (session) {
      const recordType = session.crm_record_type || 'lead'
      const recordId = session.crm_record_id || session.client_id

      if (recordId) {
        const clientData = await getCrmClientData(
          recordType as CrmRecordType,
          recordId
        )

        // Log audit event for client logout
        if (clientData?.organizationId) {
          await logAudit({
            organizationId: clientData.organizationId,
            action: 'logout',
            entityType: 'client',
            entityId: recordId,
          })
        }
      }
    }

    await invalidateSession(sessionToken)
  }

  cookieStore.delete(CLIENT_COOKIE_NAME)
}

// ============================================================================
// Session Management (for admin use)
// ============================================================================

export async function getClientSessions(
  recordType: CrmRecordType,
  recordId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_sessions')
    .select(
      'id, ip_address, user_agent, created_at, last_active_at, expires_at'
    )
    .eq('crm_record_type', recordType)
    .eq('crm_record_id', recordId)
    .order('last_active_at', { ascending: false })

  if (error) {
    console.error('[Auth] Failed to get sessions:', error)
    return []
  }

  return data
}

export async function revokeClientSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('[Auth] Failed to revoke session:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function revokeAllClientSessions(
  recordType: CrmRecordType,
  recordId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_sessions')
    .delete()
    .eq('crm_record_type', recordType)
    .eq('crm_record_id', recordId)

  if (error) {
    console.error('[Auth] Failed to revoke all sessions:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// Admin "Login As" Feature
// ============================================================================

export async function loginAsClient(
  recordType: CrmRecordType,
  recordId: string
) {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Auth] Login as client failed: No authenticated admin user')
    return {
      success: false,
      error: 'Unauthorized. You must be logged in as an admin.',
    }
  }

  // Verify the user is an admin
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    console.error('[Auth] Login as client failed: User is not an admin')
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
    }
  }

  // Get client data
  const clientData = await getCrmClientData(recordType, recordId)

  if (!clientData) {
    console.error('[Auth] Login as client failed: Client not found')
    return {
      success: false,
      error: 'Client not found.',
    }
  }

  // Create session for the client
  try {
    const { token, expiresAt } = await createSession(recordType, recordId)
    await setSessionCookie(token, expiresAt)

    const clientName = `${clientData.firstName} ${clientData.lastName}`.trim()
    console.log(
      `[Auth] Admin ${user.email} logged in as CRM ${recordType} ${clientData.email} (${recordId})`
    )

    return {
      success: true,
      clientId: recordId,
      clientName,
      clientEmail: clientData.email,
      recordType,
    }
  } catch {
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    }
  }
}

// ============================================================================
// Portal Access Management
// ============================================================================

export async function grantPortalAccess(
  recordType: CrmRecordType,
  recordId: string,
  sendInvite: boolean = true
) {
  const supabase = createAdminClient()
  const table = recordType === 'contact' ? 'crm_contacts' : 'crm_leads'

  const { error } = await supabase
    .from(table)
    .update({
      portal_access_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)

  if (error) {
    console.error('[Auth] Failed to grant portal access:', error)
    return { success: false, error: error.message }
  }

  if (sendInvite) {
    // Get client email for sending invite
    const clientData = await getCrmClientData(recordType, recordId)
    if (clientData) {
      const clientName = `${clientData.firstName} ${clientData.lastName}`.trim()
      // Generate a magic link for the invite
      const token = generateSecureToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + MAGIC_LINK_EXPIRY_HOURS * 7) // 7 days for invite

      await supabase.from('client_auth_tokens').insert({
        crm_record_type: recordType,
        crm_record_id: recordId,
        token,
        expires_at: expiresAt.toISOString(),
      })

      await sendMagicLinkEmail(clientData.email, token, clientName)
      console.log('[Auth] Portal invite sent to:', clientData.email)
    }
  }

  console.log('[Auth] Portal access granted for CRM', recordType, ':', recordId)
  return { success: true }
}

export async function revokePortalAccess(
  recordType: CrmRecordType,
  recordId: string
) {
  const supabase = createAdminClient()
  const table = recordType === 'contact' ? 'crm_contacts' : 'crm_leads'

  // Revoke access
  const { error } = await supabase
    .from(table)
    .update({
      portal_access_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)

  if (error) {
    console.error('[Auth] Failed to revoke portal access:', error)
    return { success: false, error: error.message }
  }

  // Invalidate all sessions for this CRM record
  await supabase
    .from('client_sessions')
    .delete()
    .eq('crm_record_type', recordType)
    .eq('crm_record_id', recordId)

  console.log('[Auth] Portal access revoked for CRM', recordType, ':', recordId)
  return { success: true }
}

// ============================================================================
// Helper Functions
// ============================================================================

export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getClientSession()
  return session !== null
}

/**
 * Check if the current session is for a contact (full access) or lead (limited access)
 */
export async function getClientAccessLevel(): Promise<
  'full' | 'limited' | null
> {
  const session = await getClientSession()
  if (!session) return null
  return session.recordType === 'contact' ? 'full' : 'limited'
}
