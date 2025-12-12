'use server'

/**
 * Server Actions for CRM Page Layouts
 *
 * These actions manage page layout configurations for CRM objects.
 * Page layouts control how fields are arranged on record forms.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  PageLayout,
  PageLayoutInsert,
  PageLayoutUpdate,
  PageLayoutConfig,
} from '@/lib/crm/types'

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get all page layouts for an object
 */
export async function getPageLayouts(objectDefinitionId: string): Promise<{
  data: PageLayout[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching page layouts:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPageLayouts:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get the default page layout for an object
 */
export async function getDefaultPageLayout(
  objectDefinitionId: string
): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching default page layout:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getDefaultPageLayout:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a page layout by ID
 */
export async function getPageLayoutById(id: string): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching page layout:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPageLayoutById:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// WRITE OPERATIONS
// =====================================================

/**
 * Create a new page layout
 */
export async function createPageLayout(input: PageLayoutInsert): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('page_layouts')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('Error creating page layout:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in createPageLayout:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a page layout
 */
export async function updatePageLayout(
  id: string,
  input: PageLayoutUpdate
): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('page_layouts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating page layout:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in updatePageLayout:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update just the layout configuration of a page layout
 */
export async function updatePageLayoutConfig(
  id: string,
  layoutConfig: PageLayoutConfig
): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  return updatePageLayout(id, { layout_config: layoutConfig })
}

/**
 * Create or update the default page layout for an object
 * If a default layout exists, update it; otherwise create a new one
 */
export async function upsertDefaultPageLayout(
  objectDefinitionId: string,
  organizationId: string,
  layoutConfig: PageLayoutConfig
): Promise<{
  data: PageLayout | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Check if default layout exists
    const { data: existing } = await supabase
      .from('page_layouts')
      .select('id')
      .eq('object_definition_id', objectDefinitionId)
      .eq('is_default', true)
      .single()

    if (existing) {
      // Update existing
      return updatePageLayoutConfig(existing.id, layoutConfig)
    } else {
      // Create new default layout
      return createPageLayout({
        organization_id: organizationId,
        object_definition_id: objectDefinitionId,
        name: 'Default Layout',
        description: 'Default page layout',
        layout_config: layoutConfig,
        is_default: true,
        is_active: true,
      })
    }
  } catch (err) {
    console.error('Unexpected error in upsertDefaultPageLayout:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a page layout
 * Cannot delete the default layout unless it's the only one
 */
export async function deletePageLayout(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Check if this is the default layout
    const { data: layout } = await supabase
      .from('page_layouts')
      .select('object_definition_id, is_default')
      .eq('id', id)
      .single()

    if (layout?.is_default) {
      // Check if there are other layouts
      const { count } = await supabase
        .from('page_layouts')
        .select('id', { count: 'exact', head: true })
        .eq('object_definition_id', layout.object_definition_id)
        .eq('is_active', true)

      if (count && count > 1) {
        return {
          success: false,
          error:
            'Cannot delete the default layout. Set another layout as default first.',
        }
      }
    }

    const { error } = await supabase.from('page_layouts').delete().eq('id', id)

    if (error) {
      console.error('Error deleting page layout:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deletePageLayout:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set a page layout as the default for an object
 */
export async function setDefaultPageLayout(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get the object_definition_id for this layout
    const { data: layout } = await supabase
      .from('page_layouts')
      .select('object_definition_id')
      .eq('id', id)
      .single()

    if (!layout) {
      return { success: false, error: 'Layout not found' }
    }

    // Unset all other defaults for this object
    const { error: unsetError } = await supabase
      .from('page_layouts')
      .update({ is_default: false })
      .eq('object_definition_id', layout.object_definition_id)
      .neq('id', id)

    if (unsetError) {
      return { success: false, error: unsetError.message }
    }

    // Set this layout as default
    const { error: setError } = await supabase
      .from('page_layouts')
      .update({ is_default: true })
      .eq('id', id)

    if (setError) {
      return { success: false, error: setError.message }
    }

    revalidatePath('/admin/setup/objects')
    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in setDefaultPageLayout:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
