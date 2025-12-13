'use server'

/**
 * CRM List View Server Actions
 *
 * These actions manage saved views for the CRM metadata-driven list views.
 * They work with the crm_list_views table which stores view configurations
 * including filters, columns, and visibility settings.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FilterCondition } from '@/lib/crm/types'
import type {
  ColumnConfig,
  SavedView,
  ViewVisibility,
} from '@/components/admin/crm/list-view'

// ============================================================================
// TYPES
// ============================================================================

interface CrmListView {
  id: string
  organization_id: string | null
  created_by: string
  object_api_name: string
  name: string
  description: string | null
  visibility: ViewVisibility
  is_default: boolean
  is_pinned: boolean
  filters: FilterCondition[]
  columns: ColumnConfig[]
  sort_field: string | null
  sort_direction: 'asc' | 'desc'
  created_at: string
  updated_at: string
}

// ============================================================================
// GET LIST VIEWS
// ============================================================================

/**
 * Get all list views for a CRM object that the current user can see
 */
export async function getCrmListViews(objectApiName: string): Promise<{
  success: boolean
  error?: string
  data: SavedView[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', data: [] }
  }

  // Get views that are either:
  // 1. Created by this user (private)
  // 2. Shared or org-wide
  const { data, error } = await supabase
    .from('crm_list_views')
    .select('*')
    .eq('object_api_name', objectApiName)
    .or(`created_by.eq.${user.id},visibility.in.(shared,org)`)
    .order('is_pinned', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching CRM list views:', error)
    return { success: false, error: error.message, data: [] }
  }

  // Transform to SavedView format for the UI
  const savedViews: SavedView[] = (data as CrmListView[]).map(view => ({
    id: view.id,
    name: view.name,
    visibility: view.visibility,
    is_pinned: view.is_pinned,
    is_default: view.is_default,
    created_by: view.created_by,
    filter_count: view.filters?.length || 0,
  }))

  return { success: true, data: savedViews }
}

/**
 * Get a single list view by ID with full details
 */
export async function getCrmListViewById(id: string): Promise<{
  success: boolean
  error?: string
  data: CrmListView | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_list_views')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data: data as CrmListView }
}

// ============================================================================
// CREATE LIST VIEW
// ============================================================================

export async function createCrmListView(params: {
  objectApiName: string
  name: string
  visibility: ViewVisibility
  isDefault: boolean
  filters: FilterCondition[]
  columns: ColumnConfig[]
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<{
  success: boolean
  error?: string
  data: SavedView | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', data: null }
  }

  // If setting as default, unset any existing defaults for this user and object
  if (params.isDefault) {
    await supabase
      .from('crm_list_views')
      .update({ is_default: false })
      .eq('object_api_name', params.objectApiName)
      .eq('created_by', user.id)
  }

  const { data, error } = await supabase
    .from('crm_list_views')
    .insert({
      created_by: user.id,
      object_api_name: params.objectApiName,
      name: params.name,
      visibility: params.visibility,
      is_default: params.isDefault,
      is_pinned: false,
      filters: params.filters,
      columns: params.columns,
      sort_field: params.sortField || null,
      sort_direction: params.sortDirection || 'desc',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating CRM list view:', error)
    return { success: false, error: error.message, data: null }
  }

  const view = data as CrmListView
  const savedView: SavedView = {
    id: view.id,
    name: view.name,
    visibility: view.visibility,
    is_pinned: view.is_pinned,
    is_default: view.is_default,
    created_by: view.created_by,
    filter_count: view.filters?.length || 0,
  }

  revalidatePath('/admin')
  return { success: true, data: savedView }
}

// ============================================================================
// UPDATE LIST VIEW
// ============================================================================

export async function updateCrmListView(
  id: string,
  updates: Partial<{
    name: string
    visibility: ViewVisibility
    is_default: boolean
    is_pinned: boolean
    filters: FilterCondition[]
    columns: ColumnConfig[]
    sort_field: string
    sort_direction: 'asc' | 'desc'
  }>
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('crm_list_views')
    .select('created_by, object_api_name')
    .eq('id', id)
    .single()

  if (!existing || existing.created_by !== user.id) {
    return { success: false, error: 'Not authorized to update this view' }
  }

  // If setting as default, unset any existing defaults
  if (updates.is_default) {
    await supabase
      .from('crm_list_views')
      .update({ is_default: false })
      .eq('object_api_name', existing.object_api_name)
      .eq('created_by', user.id)
  }

  const { error } = await supabase
    .from('crm_list_views')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ============================================================================
// DELETE LIST VIEW
// ============================================================================

export async function deleteCrmListView(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('crm_list_views')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!existing || existing.created_by !== user.id) {
    return { success: false, error: 'Not authorized to delete this view' }
  }

  const { error } = await supabase.from('crm_list_views').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ============================================================================
// PIN/UNPIN LIST VIEW
// ============================================================================

export async function pinCrmListView(
  id: string,
  isPinned: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  return updateCrmListView(id, { is_pinned: isPinned })
}

// ============================================================================
// GET DEFAULT VIEW
// ============================================================================

export async function getDefaultCrmListView(objectApiName: string): Promise<{
  success: boolean
  error?: string
  data: CrmListView | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('crm_list_views')
    .select('*')
    .eq('object_api_name', objectApiName)
    .eq('created_by', user.id)
    .eq('is_default', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data: (data as CrmListView) || null }
}
