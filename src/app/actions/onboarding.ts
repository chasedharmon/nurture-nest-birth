'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface OnboardingStatus {
  hasCompanyProfile: boolean
  hasService: boolean
  hasEmailTemplate: boolean
  hasWorkflow: boolean
  hasTeamMember: boolean
  isDismissed: boolean
  completedAt: string | null
}

/**
 * Get the current onboarding status for the user's organization
 */
export async function getOnboardingStatus(): Promise<{
  success: boolean
  status?: OnboardingStatus
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    const orgId = userData.organization_id

    // Get organization settings to check if onboarding was dismissed
    const { data: org } = await adminClient
      .from('organizations')
      .select('settings, name, logo_url')
      .eq('id', orgId)
      .single()

    const settings = (org?.settings as Record<string, unknown>) || {}
    const isDismissed = settings.onboarding_dismissed === true
    const completedAt = (settings.onboarding_completed_at as string) || null

    // Check completion status for each step in parallel
    const [servicesResult, templatesResult, workflowsResult, teamResult] =
      await Promise.all([
        // Check for service packages
        adminClient
          .from('service_packages')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Check for customized email templates (modified from default)
        adminClient
          .from('email_templates')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Check for workflows
        adminClient
          .from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Check for team members (excluding the current user)
        adminClient
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
      ])

    // Company profile is complete if org has a name (which it should) and optionally a logo
    const hasCompanyProfile = Boolean(org?.name && org?.name.length > 0)
    const hasService = (servicesResult.count ?? 0) > 0
    const hasEmailTemplate = (templatesResult.count ?? 0) > 0
    const hasWorkflow = (workflowsResult.count ?? 0) > 0
    const hasTeamMember = (teamResult.count ?? 0) > 1 // More than just the owner

    return {
      success: true,
      status: {
        hasCompanyProfile,
        hasService,
        hasEmailTemplate,
        hasWorkflow,
        hasTeamMember,
        isDismissed,
        completedAt,
      },
    }
  } catch (error) {
    console.error('[Onboarding] Failed to get status:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get onboarding status',
    }
  }
}

/**
 * Dismiss the onboarding checklist
 */
export async function dismissOnboarding(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Get current settings
    const { data: org } = await adminClient
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    // Update organization settings to mark onboarding as dismissed
    const { error } = await adminClient
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          onboarding_dismissed: true,
          onboarding_dismissed_at: new Date().toISOString(),
        },
      })
      .eq('id', userData.organization_id)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('[Onboarding] Failed to dismiss:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to dismiss onboarding',
    }
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Get current settings
    const { data: org } = await adminClient
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    // Update organization settings
    const { error } = await adminClient
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          onboarding_completed_at: new Date().toISOString(),
        },
      })
      .eq('id', userData.organization_id)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('[Onboarding] Failed to complete:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding',
    }
  }
}

/**
 * Mark a specific onboarding step as complete
 */
export async function completeOnboardingStep(stepId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Get current settings
    const { data: org } = await adminClient
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}
    const completedSteps =
      (currentSettings.onboarding_completed_steps as string[]) || []

    // Add step if not already completed
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId)
    }

    // Update organization settings
    const { error } = await adminClient
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          onboarding_completed_steps: completedSteps,
          [`onboarding_step_${stepId}_completed_at`]: new Date().toISOString(),
        },
      })
      .eq('id', userData.organization_id)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('[Onboarding] Failed to complete step:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding step',
    }
  }
}

/**
 * Reset onboarding (for testing/development)
 */
export async function resetOnboarding(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Get current settings
    const { data: org } = await adminClient
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    // Remove all onboarding-related settings
    const newSettings = { ...currentSettings }
    delete newSettings.onboarding_dismissed
    delete newSettings.onboarding_dismissed_at
    delete newSettings.onboarding_completed_at
    delete newSettings.onboarding_completed_steps

    // Remove step-specific timestamps
    Object.keys(newSettings).forEach(key => {
      if (key.startsWith('onboarding_step_')) {
        delete newSettings[key]
      }
    })

    // Update organization settings
    const { error } = await adminClient
      .from('organizations')
      .update({ settings: newSettings })
      .eq('id', userData.organization_id)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('[Onboarding] Failed to reset:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reset onboarding',
    }
  }
}
