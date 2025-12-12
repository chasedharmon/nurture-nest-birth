'use server'

/**
 * Record-Level Security Server Actions
 *
 * These actions handle sharing rule management and record access checking
 * for the CRM system. They integrate with the sharing_rules and manual_shares
 * tables and provide utilities for managing record-level access.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  SharingRule,
  SharingRuleInsert,
  SharingRuleUpdate,
  ManualShare,
  ManualShareInsert,
  RecordSharingInfo,
  ObjectDefinition,
  SharingModel,
} from '@/lib/crm/types'

// =====================================================
// USER CONTEXT
// =====================================================

interface UserSharingContext {
  userId: string
  roleId: string | null
  organizationId: string | null
  hierarchyLevel: number | null
  isAdmin: boolean
}

/**
 * Get the current user's sharing context
 */
export async function getUserSharingContext(): Promise<{
  data: UserSharingContext | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(
        `
        id,
        role_id,
        organization_id,
        role_details:roles(name, hierarchy_level, permissions)
      `
      )
      .eq('id', userData.user.id)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    const roleDetailsArray = user.role_details as Array<{
      name: string
      hierarchy_level: number | null
      permissions: Record<string, string[]>
    }> | null
    const roleDetails = roleDetailsArray?.[0] ?? null

    const isAdmin =
      roleDetails?.name === 'admin' ||
      roleDetails?.permissions?.['*']?.includes('*') ||
      false

    return {
      data: {
        userId: user.id,
        roleId: user.role_id,
        organizationId: user.organization_id,
        hierarchyLevel: roleDetails?.hierarchy_level ?? null,
        isAdmin,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting user sharing context:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// SHARING RULES - READ OPERATIONS
// =====================================================

/**
 * Get all sharing rules for the organization
 */
export async function getSharingRules(objectApiName?: string): Promise<{
  data: SharingRule[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('sharing_rules')
      .select(
        `
        *,
        object_definitions(api_name, label)
      `
      )
      .order('created_at', { ascending: false })

    if (objectApiName) {
      const { data: objectDef } = await supabase
        .from('object_definitions')
        .select('id')
        .eq('api_name', objectApiName)
        .single()

      if (objectDef) {
        query = query.eq('object_definition_id', objectDef.id)
      }
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as SharingRule[], error: null }
  } catch (err) {
    console.error('Error fetching sharing rules:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single sharing rule by ID
 */
export async function getSharingRule(ruleId: string): Promise<{
  data: SharingRule | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sharing_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as SharingRule, error: null }
  } catch (err) {
    console.error('Error fetching sharing rule:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get sharing rules that apply to a specific user
 */
export async function getSharingRulesForUser(
  objectApiName: string,
  userId?: string
): Promise<{
  data: SharingRule[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get user context if not provided
    let targetUserId = userId
    let userRoleId: string | null = null

    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        return { data: null, error: 'Not authenticated' }
      }
      targetUserId = userData.user.id
    }

    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', targetUserId)
      .single()

    userRoleId = user?.role_id ?? null

    // Get object definition ID
    const { data: objectDef } = await supabase
      .from('object_definitions')
      .select('id')
      .eq('api_name', objectApiName)
      .single()

    if (!objectDef) {
      return { data: null, error: 'Object not found' }
    }

    // Get rules that apply to this user
    const { data, error } = await supabase
      .from('sharing_rules')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .or(
        `share_with_type.eq.user,share_with_id.eq.${targetUserId},` +
          `share_with_type.eq.role,share_with_id.eq.${userRoleId}`
      )

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as SharingRule[], error: null }
  } catch (err) {
    console.error('Error fetching sharing rules for user:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// SHARING RULES - WRITE OPERATIONS
// =====================================================

/**
 * Create a new sharing rule
 */
export async function createSharingRule(
  input: Omit<SharingRuleInsert, 'organization_id' | 'created_by'>
): Promise<{
  data: SharingRule | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return { data: null, error: 'User not associated with an organization' }
    }

    const { data, error } = await supabase
      .from('sharing_rules')
      .insert({
        ...input,
        organization_id: user.organization_id,
        created_by: userData.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sharing rule:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/sharing-rules')
    return { data: data as SharingRule, error: null }
  } catch (err) {
    console.error('Unexpected error in createSharingRule:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a sharing rule
 */
export async function updateSharingRule(
  ruleId: string,
  updates: SharingRuleUpdate
): Promise<{
  data: SharingRule | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sharing_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating sharing rule:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/sharing-rules')
    return { data: data as SharingRule, error: null }
  } catch (err) {
    console.error('Unexpected error in updateSharingRule:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a sharing rule
 */
export async function deleteSharingRule(ruleId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('sharing_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Error deleting sharing rule:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/sharing-rules')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deleteSharingRule:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle sharing rule active status
 */
export async function toggleSharingRuleActive(
  ruleId: string,
  isActive: boolean
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('sharing_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/sharing-rules')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error toggling sharing rule:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MANUAL SHARES
// =====================================================

/**
 * Get manual shares for a record
 */
export async function getManualShares(
  objectApiName: string,
  recordId: string
): Promise<{
  data: ManualShare[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('manual_shares')
      .select(
        `
        *,
        shared_by_user:users!shared_by(full_name, email)
      `
      )
      .eq('object_api_name', objectApiName)
      .eq('record_id', recordId)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as ManualShare[], error: null }
  } catch (err) {
    console.error('Error fetching manual shares:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a manual share (share record with user/role)
 */
export async function createManualShare(input: ManualShareInsert): Promise<{
  data: ManualShare | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return { data: null, error: 'User not associated with an organization' }
    }

    const { data, error } = await supabase
      .from('manual_shares')
      .insert({
        ...input,
        organization_id: user.organization_id,
        shared_by: userData.user.id,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return {
          data: null,
          error: 'This record is already shared with this user/role',
        }
      }
      console.error('Error creating manual share:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ManualShare, error: null }
  } catch (err) {
    console.error('Unexpected error in createManualShare:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a manual share
 */
export async function updateManualShare(
  shareId: string,
  updates: Partial<Pick<ManualShare, 'access_level' | 'reason' | 'expires_at'>>
): Promise<{
  data: ManualShare | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('manual_shares')
      .update(updates)
      .eq('id', shareId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as ManualShare, error: null }
  } catch (err) {
    console.error('Error updating manual share:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a manual share
 */
export async function deleteManualShare(shareId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('manual_shares')
      .delete()
      .eq('id', shareId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Error deleting manual share:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// RECORD ACCESS CHECKING
// =====================================================

/**
 * Get sharing info for a record (who has access)
 */
export async function getRecordSharingInfo(
  objectApiName: string,
  recordId: string,
  ownerId: string
): Promise<{
  data: RecordSharingInfo[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return { data: null, error: 'User not associated with an organization' }
    }

    // Call the database function
    const { data, error } = await supabase.rpc('get_record_sharing_info', {
      p_object_api_name: objectApiName,
      p_record_id: recordId,
      p_record_owner_id: ownerId,
      p_record_org_id: user.organization_id,
    })

    if (error) {
      console.error('Error getting record sharing info:', error)
      return { data: null, error: error.message }
    }

    return { data: data as RecordSharingInfo[], error: null }
  } catch (err) {
    console.error('Unexpected error in getRecordSharingInfo:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if current user has access to a record
 */
export async function checkRecordAccess(
  objectApiName: string,
  recordId: string,
  ownerId: string,
  accessType: 'read' | 'write' = 'read'
): Promise<{
  hasAccess: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { hasAccess: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return {
        hasAccess: false,
        error: 'User not associated with an organization',
      }
    }

    // Call the database function
    const { data, error } = await supabase.rpc('check_record_access', {
      p_object_api_name: objectApiName,
      p_record_id: recordId,
      p_record_owner_id: ownerId,
      p_record_org_id: user.organization_id,
      p_user_id: userData.user.id,
      p_access_type: accessType,
    })

    if (error) {
      console.error('Error checking record access:', error)
      return { hasAccess: false, error: error.message }
    }

    return { hasAccess: data === true, error: null }
  } catch (err) {
    console.error('Unexpected error in checkRecordAccess:', err)
    return { hasAccess: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// OBJECT SHARING SETTINGS
// =====================================================

/**
 * Get sharing settings for an object
 */
export async function getObjectSharingSettings(objectApiName: string): Promise<{
  data: {
    object: ObjectDefinition
    sharingModel: SharingModel
    sharingRules: SharingRule[]
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get object definition
    const { data: objectDef, error: objError } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('api_name', objectApiName)
      .single()

    if (objError || !objectDef) {
      return { data: null, error: 'Object not found' }
    }

    // Get sharing rules for this object
    const { data: rules } = await supabase
      .from('sharing_rules')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)

    return {
      data: {
        object: objectDef as ObjectDefinition,
        sharingModel: objectDef.sharing_model as SharingModel,
        sharingRules: (rules || []) as SharingRule[],
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting object sharing settings:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update object sharing model (organization-wide default)
 */
export async function updateObjectSharingModel(
  objectApiName: string,
  sharingModel: SharingModel
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('object_definitions')
      .update({ sharing_model: sharingModel })
      .eq('api_name', objectApiName)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/sharing-rules')
    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error updating object sharing model:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Get all users and roles for sharing target selection
 */
export async function getShareTargets(): Promise<{
  data: {
    users: Array<{ id: string; full_name: string | null; email: string }>
    roles: Array<{ id: string; name: string }>
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const [usersResult, rolesResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name'),
      supabase.from('roles').select('id, name').order('name'),
    ])

    if (usersResult.error) {
      return { data: null, error: usersResult.error.message }
    }

    if (rolesResult.error) {
      return { data: null, error: rolesResult.error.message }
    }

    return {
      data: {
        users: usersResult.data || [],
        roles: rolesResult.data || [],
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting share targets:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
