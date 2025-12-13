'use server'

/**
 * Self-Service Signup Server Actions
 *
 * Handles public signup flow for new tenants.
 * Creates: Supabase Auth user -> Organization (trialing) -> Membership (owner)
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { tenantDefaults } from '@/config/platform'

// =====================================================
// Types
// =====================================================

export interface SignupInput {
  email: string
  password: string
  businessName: string
  firstName?: string
}

export interface SignupResult {
  success: boolean
  data?: {
    organizationId: string
    userId: string
  }
  error?: string
}

// =====================================================
// Helpers
// =====================================================

/**
 * Generate a URL-safe slug from a business name
 */
function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .substring(0, 63) // Max length
}

/**
 * Tier-based resource limits
 */
const TIER_LIMITS = {
  starter: {
    max_team_members: 1,
    max_clients: 50,
    max_workflows: 3,
    max_storage_mb: 500,
  },
  professional: {
    max_team_members: 5,
    max_clients: 200,
    max_workflows: 10,
    max_storage_mb: 2000,
  },
  business: {
    max_team_members: 15,
    max_clients: 500,
    max_workflows: 25,
    max_storage_mb: 5000,
  },
  enterprise: {
    max_team_members: -1,
    max_clients: -1,
    max_workflows: -1,
    max_storage_mb: -1,
  },
}

// =====================================================
// Signup Action
// =====================================================

/**
 * Create a new tenant via self-service signup
 *
 * Flow:
 * 1. Validate input
 * 2. Create Supabase Auth user
 * 3. Create organization with 'trialing' status
 * 4. Create membership with 'owner' role
 * 5. Return success (client redirects to /admin)
 */
export async function signupTenant(input: SignupInput): Promise<SignupResult> {
  try {
    // =====================================================
    // 1. Validate input
    // =====================================================

    const email = input.email.toLowerCase().trim()
    const password = input.password
    const businessName = input.businessName.trim()
    const firstName = input.firstName?.trim() || null

    if (!email || !password || !businessName) {
      return {
        success: false,
        error: 'Email, password, and business name are required',
      }
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      }
    }

    // Generate and validate slug
    let slug = generateSlug(businessName)
    if (!slug || slug.length < 2) {
      return {
        success: false,
        error: 'Business name is too short or contains only special characters',
      }
    }

    // Admin client bypasses RLS for database operations
    const adminClient = createAdminClient()

    // Check if email already has an auth user
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users.find(
      u => u.email?.toLowerCase() === email
    )
    if (existingAuthUser) {
      return {
        success: false,
        error:
          'An account with this email already exists. Please sign in instead.',
      }
    }

    // Check if slug is taken (and make unique if needed)
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      // Append random suffix to make unique
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    // =====================================================
    // 2. Create Supabase Auth user
    // =====================================================

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for now (could add email verification later)
        user_metadata: {
          full_name: firstName,
        },
      })

    if (authError || !authData.user) {
      console.error('Auth user creation failed:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create account',
      }
    }

    const authUserId = authData.user.id

    // =====================================================
    // 3. Create or update users table record
    // =====================================================

    const { error: userError } = await adminClient.from('users').upsert(
      {
        id: authUserId,
        email,
        full_name: firstName,
      },
      { onConflict: 'id' }
    )

    if (userError) {
      console.error('Users table insert failed:', userError)
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authUserId)
      return {
        success: false,
        error: 'Failed to create user profile',
      }
    }

    // =====================================================
    // 4. Create organization with trialing status
    // =====================================================

    const tier = tenantDefaults.subscriptionTier
    const limits = TIER_LIMITS[tier]
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: businessName,
        slug,
        owner_user_id: authUserId,
        subscription_status: 'trialing',
        subscription_tier: tier,
        trial_ends_at: trialEndsAt.toISOString(),
        ...limits,
        primary_color: tenantDefaults.branding.primaryColor,
        secondary_color: tenantDefaults.branding.secondaryColor,
        settings: {
          ...tenantDefaults.settings,
          onboarding_completed: false,
        },
      })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('Organization creation failed:', orgError)
      // Rollback: delete auth user and users record
      await adminClient.from('users').delete().eq('id', authUserId)
      await adminClient.auth.admin.deleteUser(authUserId)
      return {
        success: false,
        error: 'Failed to create organization',
      }
    }

    // =====================================================
    // 5. Create owner membership
    // =====================================================

    const { error: membershipError } = await adminClient
      .from('organization_memberships')
      .insert({
        organization_id: org.id,
        user_id: authUserId,
        role: 'owner',
        is_active: true,
        accepted_at: new Date().toISOString(),
      })

    if (membershipError) {
      console.error('Membership creation failed:', membershipError)
      // Rollback: delete org, users record, and auth user
      await adminClient.from('organizations').delete().eq('id', org.id)
      await adminClient.from('users').delete().eq('id', authUserId)
      await adminClient.auth.admin.deleteUser(authUserId)
      return {
        success: false,
        error: 'Failed to create membership',
      }
    }

    // =====================================================
    // 6. Sign in the user (so they're authenticated after redirect)
    // =====================================================

    const supabase = await createClient()
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return {
      success: true,
      data: {
        organizationId: org.id,
        userId: authUserId,
      },
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
