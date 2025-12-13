'use server'

/**
 * Server Actions for Custom Object Creation
 *
 * This module provides the comprehensive action for creating custom CRM objects
 * including their fields, default page layout, and navigation registration.
 *
 * Architecture Notes:
 * - Custom objects are registered in object_definitions with is_custom = true
 * - Custom object data is stored in the custom_fields JSONB column of a generic table
 *   or in dynamically created tables (if using Postgres dynamic tables)
 * - Fields are registered in field_definitions for metadata-driven rendering
 * - Navigation is automatically updated via the get_navigation_config database function
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ObjectDefinition,
  FieldDefinition,
  SharingModel,
  FieldDataType,
  PageLayout,
} from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

interface CreateFieldInput {
  label: string
  apiName: string
  dataType: FieldDataType
  isRequired: boolean
  description: string | null
  picklistValues?: string[]
}

interface CreateCustomObjectInput {
  label: string
  pluralLabel: string
  apiName: string
  description: string | null
  hasActivities: boolean
  hasNotes: boolean
  hasAttachments: boolean
  sharingModel: SharingModel
  iconName: string
  color: string
  fields: CreateFieldInput[]
}

interface CreateCustomObjectResult {
  data: {
    id: string
    apiName: string
    objectDefinition: ObjectDefinition
    fieldDefinitions: FieldDefinition[]
    pageLayout: PageLayout | null
  } | null
  error: string | null
}

// =====================================================
// MAIN ACTION
// =====================================================

/**
 * Create a new custom object with fields, page layout, and navigation
 *
 * This action:
 * 1. Creates the object definition in object_definitions
 * 2. Creates a default "Name" field (required for all objects)
 * 3. Creates any additional custom fields provided
 * 4. Creates picklist values for picklist fields
 * 5. Creates a default page layout
 * 6. Registers the object in navigation_config for automatic nav appearance
 */
export async function createCustomObjectWithFields(
  input: CreateCustomObjectInput
): Promise<CreateCustomObjectResult> {
  try {
    const supabase = await createClient()

    // Get current user and organization
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

    // Validate API name format
    const apiName = input.apiName.endsWith('__c')
      ? input.apiName
      : `${input.apiName}__c`

    if (!/^[a-zA-Z][a-zA-Z0-9_]*__c$/.test(apiName)) {
      return {
        data: null,
        error:
          'API name must start with a letter and contain only letters, numbers, and underscores',
      }
    }

    // Check for duplicate API name
    const { data: existingObject } = await supabase
      .from('object_definitions')
      .select('id')
      .eq('api_name', apiName)
      .maybeSingle()

    if (existingObject) {
      return {
        data: null,
        error: `An object with API name "${apiName}" already exists`,
      }
    }

    // =========================================
    // Step 1: Create Object Definition
    // =========================================
    const { data: objectDef, error: objectError } = await supabase
      .from('object_definitions')
      .insert({
        organization_id: user.organization_id,
        api_name: apiName,
        label: input.label.trim(),
        plural_label: input.pluralLabel.trim(),
        description: input.description,
        is_standard: false,
        is_custom: true,
        table_name: null, // Custom objects use custom_object_data table with object_api_name filter
        has_record_types: false,
        has_activities: input.hasActivities,
        has_notes: input.hasNotes,
        has_attachments: input.hasAttachments,
        sharing_model: input.sharingModel,
        icon_name: input.iconName,
        color: input.color,
        is_active: true,
      })
      .select()
      .single()

    if (objectError) {
      console.error('Error creating object definition:', objectError)
      return { data: null, error: objectError.message }
    }

    // =========================================
    // Step 2: Create Default "Name" Field
    // =========================================
    const { data: nameField, error: nameFieldError } = await supabase
      .from('field_definitions')
      .insert({
        organization_id: user.organization_id,
        object_definition_id: objectDef.id,
        api_name: 'Name',
        label: 'Name',
        description: 'The primary identifier for this record',
        help_text: null,
        data_type: 'text',
        type_config: { maxLength: 255 },
        column_name: 'name',
        is_custom_field: false,
        is_required: true,
        is_unique: false,
        default_value: null,
        is_visible: true,
        is_read_only: false,
        display_order: 0,
        is_audited: false,
        is_standard: false,
        is_name_field: true,
        is_sensitive: false,
        is_active: true,
      })
      .select()
      .single()

    if (nameFieldError) {
      console.error('Error creating name field:', nameFieldError)
      // Rollback: delete the object definition
      await supabase.from('object_definitions').delete().eq('id', objectDef.id)
      return { data: null, error: 'Failed to create required Name field' }
    }

    const fieldDefinitions: FieldDefinition[] = [nameField]

    // =========================================
    // Step 3: Create Custom Fields
    // =========================================
    for (let i = 0; i < input.fields.length; i++) {
      const fieldInput = input.fields[i]
      if (!fieldInput) continue

      // Validate field API name
      const fieldApiName = fieldInput.apiName.endsWith('__c')
        ? fieldInput.apiName
        : `${fieldInput.apiName}__c`

      if (!/^[a-zA-Z][a-zA-Z0-9_]*__c$/.test(fieldApiName)) {
        // Skip invalid field names with warning
        console.warn(
          `Skipping field with invalid API name: ${fieldInput.apiName}`
        )
        continue
      }

      // Build type config based on field type
      const typeConfig = buildTypeConfig(fieldInput.dataType)

      const { data: fieldDef, error: fieldError } = await supabase
        .from('field_definitions')
        .insert({
          organization_id: user.organization_id,
          object_definition_id: objectDef.id,
          api_name: fieldApiName,
          label: fieldInput.label.trim(),
          description: fieldInput.description,
          help_text: null,
          data_type: fieldInput.dataType,
          type_config: typeConfig,
          column_name: null, // Custom fields stored in custom_fields JSONB
          is_custom_field: true,
          is_required: fieldInput.isRequired,
          is_unique: false,
          default_value: null,
          is_visible: true,
          is_read_only: false,
          display_order: i + 1, // After the Name field
          is_audited: false,
          is_standard: false,
          is_name_field: false,
          is_sensitive: false,
          is_active: true,
        })
        .select()
        .single()

      if (fieldError) {
        console.error(`Error creating field ${fieldInput.label}:`, fieldError)
        // Continue with other fields, don't rollback entirely
        continue
      }

      fieldDefinitions.push(fieldDef)

      // =========================================
      // Step 3b: Create Picklist Values
      // =========================================
      if (
        fieldInput.dataType === 'picklist' &&
        fieldInput.picklistValues &&
        fieldInput.picklistValues.length > 0
      ) {
        const picklistInserts = fieldInput.picklistValues.map(
          (value, order) => ({
            field_definition_id: fieldDef.id,
            value: value,
            label: value,
            description: null,
            display_order: order,
            is_default: order === 0,
            is_active: true,
            controlling_field_id: null,
            controlling_values: null,
            color: null,
          })
        )

        const { error: picklistError } = await supabase
          .from('picklist_values')
          .insert(picklistInserts)

        if (picklistError) {
          console.error(
            `Error creating picklist values for ${fieldInput.label}:`,
            picklistError
          )
          // Continue without failing the entire operation
        }
      }
    }

    // =========================================
    // Step 4: Create Default Page Layout
    // =========================================
    const layoutConfig = {
      sections: [
        {
          id: `section_${Date.now()}`,
          name: 'Information',
          columns: 2,
          collapsed: false,
          fields: fieldDefinitions.map(f => f.api_name),
        },
      ],
      related_lists: input.hasActivities ? ['Activities'] : [],
      sidebar_components: [],
    }

    const { data: pageLayout, error: layoutError } = await supabase
      .from('page_layouts')
      .insert({
        organization_id: user.organization_id,
        object_definition_id: objectDef.id,
        name: 'Default Layout',
        description: `Default page layout for ${input.label}`,
        layout_config: layoutConfig,
        is_default: true,
        is_active: true,
      })
      .select()
      .single()

    if (layoutError) {
      console.error('Error creating page layout:', layoutError)
      // Non-critical, continue without layout
    }

    // =========================================
    // Step 5: Register in Navigation
    // =========================================
    try {
      await registerObjectInNavigation(
        supabase,
        objectDef.id,
        apiName,
        input.label,
        input.pluralLabel,
        input.iconName,
        user.organization_id
      )
    } catch (navError) {
      console.error('Error registering object in navigation:', navError)
      // Non-critical, object still works without nav entry
    }

    // =========================================
    // Revalidate paths
    // =========================================
    revalidatePath('/admin/setup/objects')
    revalidatePath('/admin/objects')
    revalidatePath('/admin') // Revalidate nav

    return {
      data: {
        id: objectDef.id,
        apiName: objectDef.api_name,
        objectDefinition: objectDef,
        fieldDefinitions,
        pageLayout: pageLayout || null,
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in createCustomObjectWithFields:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Build type_config based on field data type
 */
function buildTypeConfig(dataType: FieldDataType): Record<string, unknown> {
  switch (dataType) {
    case 'text':
      return { maxLength: 255 }
    case 'textarea':
      return { maxLength: 32000 }
    case 'number':
      return { precision: 18, scale: 2 }
    case 'currency':
      return { precision: 18, scale: 2, currencyCode: 'USD' }
    case 'percent':
      return { precision: 5, scale: 2 }
    case 'picklist':
      return { allowBlank: true }
    case 'multipicklist':
      return { allowBlank: true }
    default:
      return {}
  }
}

/**
 * Register the custom object in navigation_config
 * This makes it appear in the admin navigation automatically
 *
 * Note: The navigation_config table might not exist in all environments.
 * Custom objects are also discoverable via the get_navigation_config database
 * function which queries object_definitions directly.
 */
async function registerObjectInNavigation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectDefinitionId: string,
  _apiName: string, // Reserved for future use
  _label: string, // Reserved for future use
  pluralLabel: string,
  iconName: string,
  organizationId: string
) {
  try {
    // First check if the navigation_config table exists by attempting a query
    // This will fail gracefully if the table doesn't exist
    const { error: checkError } = await supabase
      .from('navigation_config')
      .select('id')
      .limit(1)

    if (checkError) {
      // Table likely doesn't exist - this is okay, navigation will work
      // via the get_navigation_config database function that queries object_definitions
      console.info(
        'navigation_config table not found - custom objects will appear via object_definitions'
      )
      return
    }

    // Check if there's already a nav item for this object
    const { data: existingNav } = await supabase
      .from('navigation_config')
      .select('id')
      .eq('object_definition_id', objectDefinitionId)
      .maybeSingle()

    if (existingNav) {
      // Already registered
      return
    }

    // Get the max sort_order for primary_tabs to add at the end
    const { data: maxOrderResult } = await supabase
      .from('navigation_config')
      .select('sort_order')
      .eq('nav_type', 'primary_tab')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (maxOrderResult?.sort_order || 0) + 10

    // Insert the navigation item
    const { error: insertError } = await supabase
      .from('navigation_config')
      .insert({
        organization_id: organizationId,
        app_id: 'default',
        object_definition_id: objectDefinitionId,
        item_type: 'object',
        nav_type: 'primary_tab',
        display_name: pluralLabel,
        icon_name: iconName,
        sort_order: nextSortOrder,
        is_visible: true,
        is_pinned: false,
        visible_to_roles: null, // Visible to all roles by default
      })

    if (insertError) {
      // Log but don't fail - navigation is not critical
      console.error('Failed to register object in navigation:', insertError)
    }
  } catch (err) {
    // Navigation registration is not critical - log and continue
    console.warn('Could not register object in navigation:', err)
  }
}

// =====================================================
// ADDITIONAL ACTIONS
// =====================================================

/**
 * Update navigation visibility for a custom object
 */
export async function updateObjectNavigationVisibility(
  objectDefinitionId: string,
  isVisible: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('navigation_config')
      .update({ is_visible: isVisible })
      .eq('object_definition_id', objectDefinitionId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error updating navigation visibility:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a custom object and all associated data
 */
export async function deleteCustomObject(
  objectDefinitionId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    // Verify this is a custom object
    const { data: objectDef } = await supabase
      .from('object_definitions')
      .select('is_standard, is_custom, api_name')
      .eq('id', objectDefinitionId)
      .single()

    if (!objectDef) {
      return { success: false, error: 'Object not found' }
    }

    if (objectDef.is_standard) {
      return { success: false, error: 'Standard objects cannot be deleted' }
    }

    // Delete navigation entry first (won't cascade)
    await supabase
      .from('navigation_config')
      .delete()
      .eq('object_definition_id', objectDefinitionId)

    // Delete the object definition (will cascade to fields, layouts, etc.)
    const { error } = await supabase
      .from('object_definitions')
      .delete()
      .eq('id', objectDefinitionId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    revalidatePath('/admin/objects')
    revalidatePath('/admin')

    return { success: true, error: null }
  } catch (err) {
    console.error('Error deleting custom object:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
