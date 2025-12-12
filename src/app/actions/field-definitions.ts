'use server'

/**
 * Server Actions for CRM Field Definitions
 *
 * These actions manage field metadata for CRM objects.
 * Standard fields on standard objects are read-only.
 * Custom fields can be added to any object (standard or custom).
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FieldDefinition,
  FieldDefinitionInsert,
  FieldDefinitionUpdate,
  FieldWithPicklistValues,
  PicklistValue,
  PicklistValueInsert,
  PicklistValueUpdate,
  FieldPermission,
  FieldPermissionInsert,
  FieldDataType,
} from '@/lib/crm/types'

// =====================================================
// FIELD DEFINITIONS - READ OPERATIONS
// =====================================================

/**
 * Get all field definitions for an object
 */
export async function getFieldDefinitions(objectDefinitionId: string): Promise<{
  data: FieldDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching field definitions:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getFieldDefinitions:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single field definition by ID
 */
export async function getFieldDefinitionById(id: string): Promise<{
  data: FieldDefinition | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching field definition:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getFieldDefinitionById:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a field definition with its picklist values
 */
export async function getFieldWithPicklistValues(id: string): Promise<{
  data: FieldWithPicklistValues | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_definitions')
      .select(
        `
        *,
        picklist_values!field_definition_id (*)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching field with picklist values:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getFieldWithPicklistValues:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all fields for an object by API name
 */
export async function getFieldsByObjectApiName(objectApiName: string): Promise<{
  data: FieldDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_definitions')
      .select(
        `
        *,
        object_definitions!inner (api_name)
      `
      )
      .eq('object_definitions.api_name', objectApiName)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching fields by object API name:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getFieldsByObjectApiName:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get custom fields only for an object
 */
export async function getCustomFields(objectDefinitionId: string): Promise<{
  data: FieldDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_custom_field', true)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getCustomFields:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// FIELD DEFINITIONS - WRITE OPERATIONS
// =====================================================

/**
 * Create a new custom field definition
 */
export async function createFieldDefinition(
  input: FieldDefinitionInsert
): Promise<{
  data: FieldDefinition | null
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

    // Validate API name format
    const apiName = input.api_name.endsWith('__c')
      ? input.api_name
      : `${input.api_name}__c`

    if (!/^[a-zA-Z][a-zA-Z0-9_]*__c$/.test(apiName)) {
      return {
        data: null,
        error:
          'API name must start with a letter, contain only letters, numbers, and underscores',
      }
    }

    // Validate field type
    const validTypes: FieldDataType[] = [
      'text',
      'textarea',
      'rich_text',
      'number',
      'currency',
      'percent',
      'date',
      'datetime',
      'checkbox',
      'picklist',
      'multipicklist',
      'lookup',
      'master_detail',
      'email',
      'phone',
      'url',
      'formula',
      'auto_number',
    ]

    if (!validTypes.includes(input.data_type)) {
      return { data: null, error: `Invalid field type: ${input.data_type}` }
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .insert({
        ...input,
        api_name: apiName,
        organization_id: user.organization_id,
        is_custom_field: true,
        is_standard: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating field definition:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in createFieldDefinition:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a custom field definition
 * Standard fields cannot be updated
 */
export async function updateFieldDefinition(
  id: string,
  input: FieldDefinitionUpdate
): Promise<{
  data: FieldDefinition | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard field
    const { data: existing } = await supabase
      .from('field_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { data: null, error: 'Standard fields cannot be modified' }
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating field definition:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in updateFieldDefinition:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update field display order (for reordering)
 */
export async function updateFieldOrder(
  fieldOrders: { id: string; display_order: number }[]
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Update each field's display_order
    for (const field of fieldOrders) {
      const { error } = await supabase
        .from('field_definitions')
        .update({ display_order: field.display_order })
        .eq('id', field.id)

      if (error) {
        console.error('Error updating field order:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in updateFieldOrder:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Deactivate a custom field definition
 */
export async function deactivateFieldDefinition(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard field
    const { data: existing } = await supabase
      .from('field_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { success: false, error: 'Standard fields cannot be deactivated' }
    }

    const { error } = await supabase
      .from('field_definitions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating field definition:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deactivateFieldDefinition:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a custom field definition
 * Standard fields cannot be deleted
 */
export async function deleteFieldDefinition(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard field
    const { data: existing } = await supabase
      .from('field_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { success: false, error: 'Standard fields cannot be deleted' }
    }

    const { error } = await supabase
      .from('field_definitions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting field definition:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deleteFieldDefinition:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// PICKLIST VALUES - OPERATIONS
// =====================================================

/**
 * Get picklist values for a field
 */
export async function getPicklistValues(fieldDefinitionId: string): Promise<{
  data: PicklistValue[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('picklist_values')
      .select('*')
      .eq('field_definition_id', fieldDefinitionId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPicklistValues:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new picklist value
 */
export async function createPicklistValue(input: PicklistValueInsert): Promise<{
  data: PicklistValue | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('picklist_values')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('Error creating picklist value:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in createPicklistValue:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a picklist value
 */
export async function updatePicklistValue(
  id: string,
  input: PicklistValueUpdate
): Promise<{
  data: PicklistValue | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('picklist_values')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating picklist value:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in updatePicklistValue:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a picklist value
 */
export async function deletePicklistValue(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('picklist_values')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting picklist value:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deletePicklistValue:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update picklist values (for reordering)
 */
export async function updatePicklistValueOrder(
  valueOrders: { id: string; display_order: number }[]
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    for (const value of valueOrders) {
      const { error } = await supabase
        .from('picklist_values')
        .update({ display_order: value.display_order })
        .eq('id', value.id)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in updatePicklistValueOrder:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// FIELD PERMISSIONS - OPERATIONS
// =====================================================

/**
 * Get field permissions for a role
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
    console.error('Unexpected error in getFieldPermissionsForRole:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Set field permission for a role
 * Creates or updates the permission
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

    revalidatePath('/admin/setup/roles')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in setFieldPermission:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk set field permissions for a role
 */
export async function bulkSetFieldPermissions(
  roleId: string,
  permissions: {
    fieldDefinitionId: string
    isVisible: boolean
    isEditable: boolean
  }[]
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

    revalidatePath('/admin/setup/roles')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in bulkSetFieldPermissions:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if user can access a field
 */
export async function checkFieldAccess(
  fieldDefinitionId: string,
  accessType: 'read' | 'write' = 'read'
): Promise<{
  canAccess: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return { canAccess: false, error: 'Not authenticated' }
    }

    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.role_id) {
      return { canAccess: false, error: 'User has no role' }
    }

    // Check field permission
    const { data: permission } = await supabase
      .from('field_permissions')
      .select('is_visible, is_editable')
      .eq('role_id', user.role_id)
      .eq('field_definition_id', fieldDefinitionId)
      .single()

    // If no explicit permission, default to true
    if (!permission) {
      return { canAccess: true, error: null }
    }

    const canAccess =
      accessType === 'read' ? permission.is_visible : permission.is_editable
    return { canAccess, error: null }
  } catch (err) {
    console.error('Unexpected error in checkFieldAccess:', err)
    return { canAccess: false, error: 'An unexpected error occurred' }
  }
}
