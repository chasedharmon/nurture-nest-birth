'use server'

/**
 * Server Actions for fetching CRM Object Metadata
 *
 * These actions provide a convenient way to fetch all metadata
 * needed to render dynamic CRM forms (object definitions, fields,
 * picklist values, and page layouts).
 */

import { createClient } from '@/lib/supabase/server'
import type {
  ObjectDefinition,
  FieldWithPicklistValues,
  PageLayout,
  ObjectMetadata,
} from '@/lib/crm/types'

// =====================================================
// MAIN METADATA FETCHER
// =====================================================

/**
 * Get complete object metadata for rendering forms
 *
 * This is the main function used by DynamicRecordForm to fetch
 * all required metadata in a single call.
 */
export async function getObjectMetadata(objectApiName: string): Promise<{
  data: ObjectMetadata | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // 1. Get object definition
    const { data: objectDef, error: objError } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('api_name', objectApiName)
      .eq('is_active', true)
      .single()

    if (objError || !objectDef) {
      return {
        data: null,
        error: objError?.message || `Object not found: ${objectApiName}`,
      }
    }

    // 2. Get field definitions with picklist values
    // Note: We use !field_definition_id to specify which FK to use since
    // picklist_values has two FKs to field_definitions (field_definition_id and controlling_field_id)
    const { data: fields, error: fieldsError } = await supabase
      .from('field_definitions')
      .select(
        `
        *,
        picklist_values!field_definition_id (
          id,
          field_definition_id,
          value,
          label,
          description,
          display_order,
          is_default,
          is_active,
          color,
          created_at
        )
      `
      )
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (fieldsError) {
      return { data: null, error: fieldsError.message }
    }

    // Filter active picklist values and sort them
    const fieldsWithActivePicklists = (fields || []).map(field => ({
      ...field,
      picklist_values: (field.picklist_values || [])
        .filter((pv: { is_active: boolean }) => pv.is_active)
        .sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
    }))

    // 3. Get default page layout
    const { data: pageLayout, error: layoutError } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Layout is optional - might not have one yet
    if (layoutError && layoutError.code !== 'PGRST116') {
      console.error('Error fetching page layout:', layoutError)
    }

    // 4. Get record types (for future use)
    const { data: recordTypes } = await supabase
      .from('record_types')
      .select('*')
      .eq('object_definition_id', objectDef.id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    return {
      data: {
        object: objectDef as ObjectDefinition,
        fields: fieldsWithActivePicklists as FieldWithPicklistValues[],
        page_layout: (pageLayout as PageLayout) || null,
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
 * Get object metadata by ID instead of API name
 */
export async function getObjectMetadataById(
  objectDefinitionId: string
): Promise<{
  data: ObjectMetadata | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get object definition
    const { data: objectDef, error: objError } = await supabase
      .from('object_definitions')
      .select('*')
      .eq('id', objectDefinitionId)
      .single()

    if (objError || !objectDef) {
      return {
        data: null,
        error: objError?.message || 'Object not found',
      }
    }

    // Delegate to main function
    return getObjectMetadata(objectDef.api_name)
  } catch (err) {
    console.error('Unexpected error in getObjectMetadataById:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// LOOKUP SEARCH
// =====================================================

/**
 * Search records for lookup field
 *
 * This is used by the LookupField component to search for related records.
 */
export async function searchLookupRecords(
  objectApiName: string,
  searchTerm: string,
  limit: number = 10
): Promise<{
  data: Array<{
    id: string
    display_value: string
    secondary_value?: string
  }> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get the table name for this object
    const { data: objectDef } = await supabase
      .from('object_definitions')
      .select('table_name')
      .eq('api_name', objectApiName)
      .single()

    if (!objectDef?.table_name) {
      return { data: [], error: null }
    }

    // Determine display field based on object type
    const { displayField, secondaryField } = getDisplayFields(objectApiName)

    // Search the table - select all columns to avoid dynamic select type issues
    let query = supabase.from(objectDef.table_name).select('*').limit(limit)

    // Add search filter if term provided
    if (searchTerm && searchTerm.trim()) {
      query = query.ilike(displayField, `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Lookup search error:', error)
      return { data: null, error: error.message }
    }

    // Transform to lookup record format
    const records = (data || []).map((record: Record<string, unknown>) => ({
      id: String(record.id),
      display_value: getDisplayValue(record, displayField, objectApiName),
      secondary_value: secondaryField
        ? (record[secondaryField] as string | undefined)
        : undefined,
    }))

    return { data: records, error: null }
  } catch (err) {
    console.error('Unexpected error in searchLookupRecords:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single record for lookup field display
 */
export async function getLookupRecord(
  objectApiName: string,
  recordId: string
): Promise<{
  data: {
    id: string
    display_value: string
    secondary_value?: string
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get the table name for this object
    const { data: objectDef } = await supabase
      .from('object_definitions')
      .select('table_name')
      .eq('api_name', objectApiName)
      .single()

    if (!objectDef?.table_name) {
      return { data: null, error: 'Object not found' }
    }

    const { displayField, secondaryField } = getDisplayFields(objectApiName)

    const { data, error } = await supabase
      .from(objectDef.table_name)
      .select('*')
      .eq('id', recordId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    const record = data as Record<string, unknown>

    return {
      data: {
        id: String(record.id),
        display_value: getDisplayValue(record, displayField, objectApiName),
        secondary_value: secondaryField
          ? (record[secondaryField] as string | undefined)
          : undefined,
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in getLookupRecord:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get the display field name for an object type
 */
function getDisplayFields(objectApiName: string): {
  displayField: string
  secondaryField?: string
} {
  switch (objectApiName) {
    case 'Contact':
      return { displayField: 'first_name', secondaryField: 'email' }
    case 'Account':
      return { displayField: 'name', secondaryField: 'account_type' }
    case 'Lead':
      return { displayField: 'first_name', secondaryField: 'email' }
    case 'Opportunity':
      return { displayField: 'name', secondaryField: 'stage' }
    case 'Activity':
      return { displayField: 'subject', secondaryField: 'activity_type' }
    default:
      return { displayField: 'name' }
  }
}

/**
 * Format the display value for a record
 */
function getDisplayValue(
  record: Record<string, unknown>,
  displayField: string,
  objectApiName: string
): string {
  // For Contact and Lead, combine first and last name
  if (objectApiName === 'Contact' || objectApiName === 'Lead') {
    const firstName = record.first_name || ''
    const lastName = record.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Unknown'
  }

  return String(record[displayField] || 'Unknown')
}
