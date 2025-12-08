'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendMagicLinkEmail } from './notifications'

const CLIENT_COOKIE_NAME = 'client_session'
const SESSION_EXPIRY_DAYS = 30
const MAGIC_LINK_EXPIRY_HOURS = 24
const BCRYPT_ROUNDS = 12

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
// Session Management
// ============================================================================

async function createSession(
  clientId: string
): Promise<{ token: string; expiresAt: Date }> {
  // Use admin client to bypass RLS for session creation
  const supabase = createAdminClient()
  const headersList = await headers()

  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  // Store session in database
  const { error } = await supabase.from('client_sessions').insert({
    client_id: clientId,
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

  // Use admin client to bypass RLS for auth operations
  const supabase = createAdminClient()

  // Find the client by email - use limit(1) to handle potential duplicates
  // Try with password_hash first, fall back to without if column doesn't exist
  let clients:
    | {
        id: string
        name: string
        email: string
        password_hash?: string | null
      }[]
    | null = null
  let clientError: { code: string; message: string } | null = null

  // Try case-insensitive search using ilike
  const { data: clientsWithHash, error: hashError } = await supabase
    .from('leads')
    .select('id, name, email, password_hash')
    .ilike('email', email)
    .limit(1)

  if (hashError?.code === '42703') {
    // Column doesn't exist, query without it
    console.log('[Auth] password_hash column not found, using fallback query')
    const { data: clientsNoHash, error: noHashError } = await supabase
      .from('leads')
      .select('id, name, email')
      .ilike('email', email)
      .limit(1)
    console.log('[Auth] Fallback query result:', {
      count: clientsNoHash?.length,
      error: noHashError,
    })
    clients = clientsNoHash?.map(c => ({ ...c, password_hash: null })) || null
    clientError = noHashError as typeof clientError
  } else {
    console.log('[Auth] Primary query result:', {
      count: clientsWithHash?.length,
      error: hashError,
    })
    clients = clientsWithHash
    clientError = hashError as typeof clientError
  }

  const client = clients?.[0]

  if (clientError || !client) {
    console.error(
      '[Auth] Client lookup error:',
      clientError,
      '| clients found:',
      clients?.length || 0
    )
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  console.log(
    '[Auth] Found client:',
    client.id,
    'password_hash exists:',
    !!client.password_hash
  )

  // Check password
  let isValidPassword = false

  if (client.password_hash) {
    // Has a real password set - verify with bcrypt
    isValidPassword = await verifyPassword(password, client.password_hash)
  } else {
    // No password set yet - for dev mode, allow default password
    // In production, this should require setting a password first
    if (process.env.NODE_ENV === 'development' && password === 'password123') {
      isValidPassword = true
      console.log('[Auth] Using development fallback password')
    }
  }

  if (!isValidPassword) {
    console.log(
      '[Auth] Invalid password - hash present:',
      !!client.password_hash
    )
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  // Create session
  try {
    const { token, expiresAt } = await createSession(client.id)
    await setSessionCookie(token, expiresAt)

    // Update last login
    await supabase
      .from('leads')
      .update({
        last_login_at: new Date().toISOString(),
        email_verified: true,
      })
      .eq('id', client.id)

    console.log('[Auth] Login successful for:', client.id)

    return {
      success: true,
      clientId: client.id,
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

export async function setClientPassword(clientId: string, password: string) {
  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters.',
    }
  }

  const supabase = await createClient()
  const passwordHash = await hashPassword(password)

  const { error } = await supabase
    .from('leads')
    .update({ password_hash: passwordHash })
    .eq('id', clientId)

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
  const supabase = await createClient()

  // Find the client by email
  const { data: client, error: clientError } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', email.toLowerCase())
    .single()

  if (clientError || !client) {
    // Don't reveal if email exists or not
    console.log('[Auth] Magic link requested for unknown email:', email)
    return {
      success: true, // Always return success to prevent email enumeration
      message:
        'If an account exists with this email, you will receive a login link.',
    }
  }

  // Generate token
  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + MAGIC_LINK_EXPIRY_HOURS)

  // Store token
  const { error: tokenError } = await supabase
    .from('client_auth_tokens')
    .insert({
      client_id: client.id,
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
  const emailResult = await sendMagicLinkEmail(client.email, token, client.name)

  if (!emailResult.success) {
    console.error('[Auth] Failed to send magic link email:', emailResult.error)
    return {
      success: false,
      error: 'Failed to send login link. Please try again.',
    }
  }

  console.log('[Auth] Magic link sent to:', email)

  return {
    success: true,
    message:
      'If an account exists with this email, you will receive a login link.',
  }
}

export async function verifyMagicLink(token: string) {
  const supabase = await createClient()

  // Look up the token
  const { data: authToken, error: tokenError } = await supabase
    .from('client_auth_tokens')
    .select('id, client_id, expires_at, used')
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

  // Update last login
  await supabase
    .from('leads')
    .update({
      last_login_at: new Date().toISOString(),
      email_verified: true,
    })
    .eq('id', authToken.client_id)

  // Create session
  try {
    const { token: sessionToken, expiresAt } = await createSession(
      authToken.client_id
    )
    await setSessionCookie(sessionToken, expiresAt)

    console.log('[Auth] Magic link login successful for:', authToken.client_id)

    return {
      success: true,
      clientId: authToken.client_id,
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

export async function getClientSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CLIENT_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  // Use admin client to bypass RLS for session validation
  const supabase = createAdminClient()

  // Validate session in database
  const { data: session, error: sessionError } = await supabase
    .from('client_sessions')
    .select('id, client_id, expires_at')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    // Invalid session - just return null
    // Cookie modification not allowed from Server Components
    return null
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    // Expired - clean up database record (cookie will be ignored)
    await invalidateSession(sessionToken)
    return null
  }

  // Update activity timestamp (don't await to avoid blocking)
  updateSessionActivity(session.id)

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('leads')
    .select(
      'id, name, email, phone, expected_due_date, actual_birth_date, partner_name'
    )
    .eq('id', session.client_id)
    .single()

  if (clientError || !client) {
    return null
  }

  return {
    sessionId: session.id,
    clientId: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    partnerName: client.partner_name,
    expectedDueDate: client.expected_due_date,
    actualBirthDate: client.actual_birth_date,
  }
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOutClient() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CLIENT_COOKIE_NAME)?.value

  if (sessionToken) {
    await invalidateSession(sessionToken)
  }

  cookieStore.delete(CLIENT_COOKIE_NAME)
}

// ============================================================================
// Session Management (for admin use)
// ============================================================================

export async function getClientSessions(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_sessions')
    .select(
      'id, ip_address, user_agent, created_at, last_active_at, expires_at'
    )
    .eq('client_id', clientId)
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

export async function revokeAllClientSessions(clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_sessions')
    .delete()
    .eq('client_id', clientId)

  if (error) {
    console.error('[Auth] Failed to revoke all sessions:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// Admin "Login As" Feature
// ============================================================================

export async function loginAsClient(clientId: string) {
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

  // Verify the client exists
  const adminClient = createAdminClient()
  const { data: client, error: clientError } = await adminClient
    .from('leads')
    .select('id, name, email, status')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    console.error(
      '[Auth] Login as client failed: Client not found',
      clientError
    )
    return {
      success: false,
      error: 'Client not found.',
    }
  }

  // Create session for the client
  try {
    const { token, expiresAt } = await createSession(clientId)
    await setSessionCookie(token, expiresAt)

    console.log(
      `[Auth] Admin ${user.email} logged in as client ${client.email} (${clientId})`
    )

    return {
      success: true,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
    }
  } catch {
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getClientSession()
  return session !== null
}
