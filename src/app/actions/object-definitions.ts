'use server'

/**
 * Server Actions for CRM Object Definitions
 *
 * These actions manage the metadata that defines CRM objects.
 * Standard objects (Contact, Account, Lead, Opportunity) are read-only.
 * Custom objects can be created, updated, and deleted by admins.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ObjectDefinition,
  ObjectDefinitionInsert,
  ObjectDefinitionUpdate,
  ObjectWithFields,
  ObjectMetadata,
} from '@/lib/crm/types'

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get all object definitions for the current organization
 * Includes both standard objects and custom objects
 */
export async function getObjectDefinitions(): Promise<{
  data: ObjectDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('is_active', true)
      .order('is_standard', { ascending: false })
      .order('label', { ascending: true })

    if (error) {
      console.error('Error fetching object definitions:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getObjectDefinitions:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single object definition by ID
 */
export async function getObjectDefinitionById(id: string): Promise<{
  data: ObjectDefinition | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching object definition:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getObjectDefinitionById:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get an object definition by API name
 */
export async function getObjectDefinitionByApiName(apiName: string): Promise<{
  data: ObjectDefinition | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('api_name', apiName)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching object definition by API name:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getObjectDefinitionByApiName:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get an object definition with all its fields
 */
export async function getObjectWithFields(objectId: string): Promise<{
  data: ObjectWithFields | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get object definition
    const { data: objectDef, error: objectError } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('id', objectId)
      .single()

    if (objectError) {
      return { data: null, error: objectError.message }
    }

    // Get fields for this object
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('object_definition_id', objectId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    return {
      data: {
        ...objectDef,
        fields: fields || [],
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in getObjectWithFields:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get complete object metadata for rendering forms
 * Includes object definition, fields with picklist values, page layout, and record types
 */
export async function getObjectMetadata(
  objectApiName: string,
  recordTypeId?: string
): Promise<{
  data: ObjectMetadata | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get object definition
    const { data: objectDef, error: objectError } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('api_name', objectApiName)
      .eq('is_active', true)
      .single()

    if (objectError) {
      return { data: null, error: objectError.message }
    }

    // Get fields with picklist values
    // Note: We use !field_definition_id to specify which FK to use since
    // picklist_values has two FKs to field_definitions
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select(
        `
        *,
        picklist_values!field_definition_id (*)
      `
      )
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    // Get page layout (default or for specific record type)
    let pageLayoutQuery = supabase
      .from('page_layouts')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)

    if (recordTypeId) {
      // Get layout for specific record type
      const { data: recordType } = await supabase
        .from('record_types')
        .select('page_layout_id')
        .eq('id', recordTypeId)
        .single()

      if (recordType?.page_layout_id) {
        pageLayoutQuery = pageLayoutQuery.eq('id', recordType.page_layout_id)
      } else {
        pageLayoutQuery = pageLayoutQuery.eq('is_default', true)
      }
    } else {
      pageLayoutQuery = pageLayoutQuery.eq('is_default', true)
    }

    const { data: pageLayout } = await pageLayoutQuery.single()

    // Get record types
    const { data: recordTypes } = await supabase
      .from('record_types')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    return {
      data: {
        object: objectDef,
        fields: fields || [],
        page_layout: pageLayout || null,
        record_types: recordTypes || [],
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in getObjectMetadata:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get standard objects only
 */
export async function getStandardObjects(): Promise<{
  data: ObjectDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('is_standard', true)
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getStandardObjects:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get custom objects only
 */
export async function getCustomObjects(): Promise<{
  data: ObjectDefinition[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('is_custom', true)
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getCustomObjects:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// WRITE OPERATIONS (Custom Objects Only)
// =====================================================

/**
 * Create a new custom object definition
 * Note: This does NOT create a physical table - custom objects use the custom_object_data table
 */
export async function createObjectDefinition(
  input: ObjectDefinitionInsert
): Promise<{
  data: ObjectDefinition | null
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
      .select('organization_id, role_id')
      .eq('id', userData.user.id)
      .single()

    if (!user?.organization_id) {
      return { data: null, error: 'User not associated with an organization' }
    }

    // Validate API name format (must be alphanumeric with underscores, ending in __c for custom)
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

    const { data, error } = await supabase
      .from('object_definitions')
      .insert({
        ...input,
        api_name: apiName,
        organization_id: user.organization_id,
        is_custom: true,
        is_standard: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating object definition:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in createObjectDefinition:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a custom object definition
 * Standard objects cannot be updated
 */
export async function updateObjectDefinition(
  id: string,
  input: ObjectDefinitionUpdate
): Promise<{
  data: ObjectDefinition | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard object
    const { data: existing } = await supabase
      .from('object_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { data: null, error: 'Standard objects cannot be modified' }
    }

    const { data, error } = await supabase
      .from('object_definitions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating object definition:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    revalidatePath(`/admin/setup/objects/${id}`)
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in updateObjectDefinition:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Deactivate a custom object definition
 * Standard objects cannot be deactivated
 */
export async function deactivateObjectDefinition(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard object
    const { data: existing } = await supabase
      .from('object_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { success: false, error: 'Standard objects cannot be deactivated' }
    }

    const { error } = await supabase
      .from('object_definitions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating object definition:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deactivateObjectDefinition:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all objects as options for lookup fields
 * Returns id, api_name, and label for each active object
 */
export async function getObjectsForLookup(): Promise<{
  data: { id: string; api_name: string; label: string }[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('object_definitions')
      .select('id, api_name, label')
      .eq('is_active', true)
      .order('is_standard', { ascending: false })
      .order('label', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getObjectsForLookup:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a custom object definition
 * Standard objects cannot be deleted
 * This will also delete all associated field definitions, page layouts, and record types
 */
export async function deleteObjectDefinition(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Verify this is not a standard object
    const { data: existing } = await supabase
      .from('object_definitions')
      .select('is_standard')
      .eq('id', id)
      .single()

    if (existing?.is_standard) {
      return { success: false, error: 'Standard objects cannot be deleted' }
    }

    // Delete will cascade to field_definitions, page_layouts, record_types
    const { error } = await supabase
      .from('object_definitions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting object definition:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deleteObjectDefinition:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
