'use server'

/**
 * Field-Level Security Server Actions
 *
 * These actions handle field permission management and enforcement
 * for the CRM system. They integrate with the field_permissions table
 * and provide utilities for checking/filtering field access.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FieldDefinition,
  FieldPermission,
  FieldPermissionInsert,
  ObjectDefinition,
} from '@/lib/crm/types'
import {
  filterFieldsByPermissions,
  buildPermissionMatrix,
  type FieldPermissionMatrix,
  type FilteredFieldsResult,
} from '@/lib/crm/field-security'

// =====================================================
// GET USER CONTEXT
// =====================================================

interface UserSecurityContext {
  userId: string
  roleId: string | null
  organizationId: string | null
  isAdmin: boolean
}

/**
 * Get the current user's security context
 */
export async function getUserSecurityContext(): Promise<{
  data: UserSecurityContext | null
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
        role_details:roles(name, permissions)
      `
      )
      .eq('id', userData.user.id)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    // Check if user has admin permissions
    // role_details is an array from the join, we take the first element
    const roleDetailsArray = user.role_details as Array<{
      name: string
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
        isAdmin,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting user security context:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// FIELD PERMISSIONS - READ OPERATIONS
// =====================================================

/**
 * Get all field permissions for a role
 */
export async function getFieldPermissionsForRole(roleId: string): Promise<{
  data: FieldPermission[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_permissions')
      .select('*')
      .eq('role_id', roleId)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error fetching field permissions:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get field permissions for a specific object and role
 */
export async function getFieldPermissionsForObjectAndRole(
  objectDefinitionId: string,
  roleId: string
): Promise<{
  data: FieldPermission[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // First get field IDs for this object
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select('id')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_active', true)

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    const fieldIds = fields?.map(f => f.id) || []

    if (fieldIds.length === 0) {
      return { data: [], error: null }
    }

    // Get permissions for those fields
    const { data, error } = await supabase
      .from('field_permissions')
      .select('*')
      .eq('role_id', roleId)
      .in('field_definition_id', fieldIds)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error fetching field permissions for object:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get the permission matrix for an object (for admin UI)
 */
export async function getFieldPermissionMatrix(
  objectApiName: string,
  roleId: string
): Promise<{
  data: FieldPermissionMatrix | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get the object definition
    const { data: objectDef, error: objError } = await supabase
      .from('object_definitions')
      .select('id')
      .eq('api_name', objectApiName)
      .eq('is_active', true)
      .single()

    if (objError || !objectDef) {
      return { data: null, error: 'Object not found' }
    }

    // Get all fields for this object
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    // Get permissions for this role
    const { data: permissions, error: permError } = await supabase
      .from('field_permissions')
      .select('*')
      .eq('role_id', roleId)

    if (permError) {
      return { data: null, error: permError.message }
    }

    const matrix = buildPermissionMatrix(
      objectApiName,
      roleId,
      fields || [],
      permissions || []
    )

    return { data: matrix, error: null }
  } catch (err) {
    console.error('Error building permission matrix:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all CRM objects with their field counts (for admin UI)
 */
export async function getCrmObjectsWithFieldCounts(): Promise<{
  data: Array<ObjectDefinition & { fieldCount: number }> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get standard CRM objects
    const { data: objects, error } = await supabase
      .from('object_definitions')
      .select(
        `
        *,
        field_definitions(count)
      `
      )
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    const objectsWithCounts = (objects || []).map(obj => ({
      ...obj,
      fieldCount:
        (obj.field_definitions as unknown as { count: number }[])?.[0]?.count ||
        0,
    }))

    return { data: objectsWithCounts, error: null }
  } catch (err) {
    console.error('Error fetching CRM objects:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// FIELD PERMISSIONS - WRITE OPERATIONS
// =====================================================

/**
 * Set a single field permission
 */
export async function setFieldPermission(
  input: FieldPermissionInsert
): Promise<{
  data: FieldPermission | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Upsert - create or update
    const { data, error } = await supabase
      .from('field_permissions')
      .upsert(input, {
        onConflict: 'role_id,field_definition_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error setting field permission:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/field-permissions')
    revalidatePath('/admin/setup/roles')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in setFieldPermission:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk set field permissions for a role on an object
 */
export async function bulkSetFieldPermissions(
  roleId: string,
  _objectDefinitionId: string, // Reserved for future filtering by object
  permissions: Array<{
    fieldDefinitionId: string
    isVisible: boolean
    isEditable: boolean
  }>
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return {
        success: false,
        error: 'User not associated with an organization',
      }
    }

    // Prepare upsert data
    const upsertData = permissions.map(p => ({
      organization_id: user.organization_id,
      role_id: roleId,
      field_definition_id: p.fieldDefinitionId,
      is_visible: p.isVisible,
      is_editable: p.isEditable,
    }))

    const { error } = await supabase
      .from('field_permissions')
      .upsert(upsertData, {
        onConflict: 'role_id,field_definition_id',
      })

    if (error) {
      console.error('Error bulk setting field permissions:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/field-permissions')
    revalidatePath('/admin/setup/roles')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in bulkSetFieldPermissions:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reset field permissions for a role on an object (remove all explicit permissions)
 * This effectively grants full access since default is "allow"
 */
export async function resetFieldPermissions(
  roleId: string,
  objectDefinitionId: string
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get field IDs for this object
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select('id')
      .eq('object_definition_id', objectDefinitionId)

    if (fieldsError) {
      return { success: false, error: fieldsError.message }
    }

    const fieldIds = fields?.map(f => f.id) || []

    if (fieldIds.length === 0) {
      return { success: true, error: null }
    }

    // Delete all permissions for this role and these fields
    const { error } = await supabase
      .from('field_permissions')
      .delete()
      .eq('role_id', roleId)
      .in('field_definition_id', fieldIds)

    if (error) {
      console.error('Error resetting field permissions:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/field-permissions')
    revalidatePath('/admin/setup/roles')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in resetFieldPermissions:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// FIELD ACCESS CHECKING (FOR RUNTIME USE)
// =====================================================

/**
 * Get filtered fields for the current user on an object
 * Returns only fields they can see, with editability info
 */
export async function getAccessibleFieldsForObject(
  objectApiName: string
): Promise<{
  data: FilteredFieldsResult | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get user's role
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.role_id) {
      // No role = return all fields as accessible (backwards compatibility)
      const { data: fields } = await supabase
        .from('field_definitions')
        .select(
          `
          *,
          object_definitions!inner(api_name)
        `
        )
        .eq('object_definitions.api_name', objectApiName)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      return {
        data: {
          visibleFields: (fields || []) as FieldDefinition[],
          editableFieldIds: new Set((fields || []).map(f => f.id)),
          accessMap: new Map(
            (fields || []).map(f => [
              f.id,
              {
                fieldId: f.id,
                apiName: f.api_name,
                canRead: true,
                canEdit: true,
              },
            ])
          ),
        },
        error: null,
      }
    }

    // Get object definition
    const { data: objectDef } = await supabase
      .from('object_definitions')
      .select('id')
      .eq('api_name', objectApiName)
      .eq('is_active', true)
      .single()

    if (!objectDef) {
      return { data: null, error: 'Object not found' }
    }

    // Get all fields for the object
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    // Get permissions for user's role
    const { data: permissions } = await supabase
      .from('field_permissions')
      .select('*')
      .eq('role_id', user.role_id)

    // Filter fields based on permissions
    const result = filterFieldsByPermissions(
      (fields || []) as FieldDefinition[],
      (permissions || []) as FieldPermission[]
    )

    return { data: result, error: null }
  } catch (err) {
    console.error('Error getting accessible fields:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if current user can edit a specific field
 */
export async function canEditField(fieldDefinitionId: string): Promise<{
  canEdit: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get user's role
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { canEdit: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.role_id) {
      // No role = allow by default
      return { canEdit: true, error: null }
    }

    // Check for explicit permission
    const { data: permission } = await supabase
      .from('field_permissions')
      .select('is_editable')
      .eq('role_id', user.role_id)
      .eq('field_definition_id', fieldDefinitionId)
      .single()

    // Default to true if no permission exists
    return { canEdit: permission?.is_editable ?? true, error: null }
  } catch (err) {
    console.error('Error checking field edit permission:', err)
    return { canEdit: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// ADMIN OPERATIONS
// =====================================================

/**
 * Copy field permissions from one role to another
 */
export async function copyFieldPermissions(
  sourceRoleId: string,
  targetRoleId: string,
  objectDefinitionId?: string
): Promise<{
  success: boolean
  copiedCount: number
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { success: false, copiedCount: 0, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return {
        success: false,
        copiedCount: 0,
        error: 'User not associated with an organization',
      }
    }

    // Get source permissions
    let query = supabase
      .from('field_permissions')
      .select('*')
      .eq('role_id', sourceRoleId)

    // If objectDefinitionId provided, only copy for that object's fields
    if (objectDefinitionId) {
      const { data: fields } = await supabase
        .from('field_definitions')
        .select('id')
        .eq('object_definition_id', objectDefinitionId)

      const fieldIds = fields?.map(f => f.id) || []
      if (fieldIds.length > 0) {
        query = query.in('field_definition_id', fieldIds)
      }
    }

    const { data: sourcePermissions, error: fetchError } = await query

    if (fetchError) {
      return { success: false, copiedCount: 0, error: fetchError.message }
    }

    if (!sourcePermissions || sourcePermissions.length === 0) {
      return { success: true, copiedCount: 0, error: null }
    }

    // Create new permissions for target role
    const newPermissions = sourcePermissions.map(p => ({
      organization_id: user.organization_id,
      role_id: targetRoleId,
      field_definition_id: p.field_definition_id,
      is_visible: p.is_visible,
      is_editable: p.is_editable,
    }))

    const { error } = await supabase
      .from('field_permissions')
      .upsert(newPermissions, {
        onConflict: 'role_id,field_definition_id',
      })

    if (error) {
      return { success: false, copiedCount: 0, error: error.message }
    }

    revalidatePath('/admin/setup/field-permissions')
    revalidatePath('/admin/setup/roles')

    return { success: true, copiedCount: newPermissions.length, error: null }
  } catch (err) {
    console.error('Error copying field permissions:', err)
    return {
      success: false,
      copiedCount: 0,
      error: 'An unexpected error occurred',
    }
  }
}
