'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const CLIENT_COOKIE_NAME = 'client_session'
const SESSION_EXPIRY_DAYS = 30

// Generate a secure random token
function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Sign in a client with email and password
 */
export async function signInClient(email: string, password: string) {
  console.log('Sign in attempt for:', email)

  const supabase = await createClient()

  // Hardcoded password check first
  if (password !== 'password123') {
    console.log('Invalid password')
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  // Find the client by email
  const { data: client, error: clientError } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', email.toLowerCase())
    .single()

  if (clientError || !client) {
    console.error('Client lookup error:', clientError)
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  console.log('Client found:', client.id)

  // Create session cookie
  const cookieStore = await cookies()
  const sessionToken = generateSecureToken()

  cookieStore.set(CLIENT_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 30 days
    path: '/',
  })

  cookieStore.set('client_id', client.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })

  // Update last login
  await supabase
    .from('leads')
    .update({
      last_login_at: new Date().toISOString(),
      email_verified: true,
    })
    .eq('id', client.id)

  console.log('Login successful')

  return {
    success: true,
    clientId: client.id,
  }
}

/**
 * Verify a magic link token and create a session
 */
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

  // Create session cookie
  const cookieStore = await cookies()
  const sessionToken = generateSecureToken()

  cookieStore.set(CLIENT_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 30 days
    path: '/',
  })

  // Store session mapping (in production, use Redis or similar)
  // For now, we'll store client_id in a separate cookie for simplicity
  cookieStore.set('client_id', authToken.client_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })

  return {
    success: true,
    clientId: authToken.client_id,
  }
}

/**
 * Get the current client session
 */
export async function getClientSession() {
  const cookieStore = await cookies()
  const clientId = cookieStore.get('client_id')?.value

  if (!clientId) {
    return null
  }

  const supabase = await createClient()

  // Fetch client data
  const { data: client, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, expected_due_date, actual_birth_date')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    return null
  }

  return {
    clientId: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    expectedDueDate: client.expected_due_date,
    actualBirthDate: client.actual_birth_date,
  }
}

/**
 * Sign out the client
 */
export async function signOutClient() {
  const cookieStore = await cookies()

  cookieStore.delete(CLIENT_COOKIE_NAME)
  cookieStore.delete('client_id')
}

/**
 * Check if user is authenticated as a client
 */
export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getClientSession()
  return session !== null
}
