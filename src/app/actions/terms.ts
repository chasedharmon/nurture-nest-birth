'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/config/terms'

/**
 * Accept Terms of Service and Privacy Policy for the current user
 */
export async function acceptTerms(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminSupabase = createAdminClient()

    // Update user's terms acceptance
    const { error } = await adminSupabase
      .from('users')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: CURRENT_PRIVACY_VERSION,
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('[Terms] Failed to accept terms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept terms',
    }
  }
}

/**
 * Check if the current user has accepted the current version of terms
 */
export async function hasAcceptedCurrentTerms(): Promise<{
  accepted: boolean
  needsTermsAcceptance: boolean
  needsPrivacyAcceptance: boolean
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        accepted: false,
        needsTermsAcceptance: true,
        needsPrivacyAcceptance: true,
      }
    }

    const adminSupabase = createAdminClient()

    const { data: userData, error } = await adminSupabase
      .from('users')
      .select(
        'terms_accepted_at, terms_version, privacy_accepted_at, privacy_version'
      )
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return {
        accepted: false,
        needsTermsAcceptance: true,
        needsPrivacyAcceptance: true,
      }
    }

    const needsTermsAcceptance =
      !userData.terms_accepted_at ||
      userData.terms_version !== CURRENT_TERMS_VERSION

    const needsPrivacyAcceptance =
      !userData.privacy_accepted_at ||
      userData.privacy_version !== CURRENT_PRIVACY_VERSION

    return {
      accepted: !needsTermsAcceptance && !needsPrivacyAcceptance,
      needsTermsAcceptance,
      needsPrivacyAcceptance,
    }
  } catch (error) {
    console.error('[Terms] Failed to check terms acceptance:', error)
    return {
      accepted: false,
      needsTermsAcceptance: true,
      needsPrivacyAcceptance: true,
    }
  }
}

/**
 * Accept terms during invitation acceptance flow
 * Called from the acceptInvitation action
 */
export async function acceptTermsForNewUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('users')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: CURRENT_PRIVACY_VERSION,
      })
      .eq('id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('[Terms] Failed to accept terms for new user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept terms',
    }
  }
}
