'use server'

/**
 * Admin Navigation Management Server Actions
 *
 * These actions provide administrative control over navigation configuration:
 * - Role-based visibility (visible/available/hidden)
 * - Navigation item ordering
 * - Display customization (name, icon, required flags)
 *
 * All actions require owner or admin role.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export type VisibilityState = 'visible' | 'available' | 'hidden'

export interface RoleVisibility {
  owner: VisibilityState
  admin: VisibilityState
  provider: VisibilityState
  assistant: VisibilityState
  staff: VisibilityState
}

export interface AdminNavItem {
  id: string
  objectDefinitionId: string | null
  objectApiName: string | null
  objectLabel: string | null
  objectPluralLabel: string | null
  itemType: string
  itemKey: string | null
  itemHref: string | null
  navType: string
  sortOrder: number
  displayName: string
  iconName: string
  isCustomObject: boolean
  isRequired: boolean
  canBeRemoved: boolean
  defaultVisibility: VisibilityState
  roleVisibility: Partial<RoleVisibility>
}

export interface BulkVisibilityUpdate {
  navConfigId: string
  roleName: string
  visibilityState: VisibilityState
}

// =====================================================
// ADMIN CHECK HELPER
// =====================================================

async function checkAdminAccess(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      error: 'Not authenticated',
      userId: null,
      orgId: null,
    }
  }

  // Get user's role and org
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
    return {
      authorized: false,
      error: 'Permission denied',
      userId: user.id,
      orgId: null,
    }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return {
    authorized: true,
    error: null,
    userId: user.id,
    orgId: profile?.organization_id || null,
  }
}

// =====================================================
// GET ALL NAV ITEMS FOR ADMIN
// =====================================================

/**
 * Get all navigation items with their role visibility matrix
 * Used for the admin navigation management UI
 */
export async function getNavigationItemsForAdmin(): Promise<{
  success: boolean
  data: AdminNavItem[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, data: null, error: error || 'Not authorized' }
    }

    // Call the RPC function
    const { data, error: rpcError } = await supabase.rpc(
      'get_navigation_items_for_admin',
      {
        p_organization_id: orgId,
        p_app_id: 'default',
      }
    )

    if (rpcError) {
      console.error('Error fetching nav items for admin:', rpcError)
      return {
        success: false,
        data: null,
        error: 'Failed to fetch navigation items',
      }
    }

    // Transform to frontend format
    const items: AdminNavItem[] = (data || []).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        objectDefinitionId: item.object_definition_id as string | null,
        objectApiName: item.object_api_name as string | null,
        objectLabel: item.object_label as string | null,
        objectPluralLabel: item.object_plural_label as string | null,
        itemType: item.item_type as string,
        itemKey: item.item_key as string | null,
        itemHref: item.item_href as string | null,
        navType: item.nav_type as string,
        sortOrder: item.sort_order as number,
        displayName: item.display_name as string,
        iconName: item.icon_name as string,
        isCustomObject: item.is_custom_object as boolean,
        isRequired: item.is_required as boolean,
        canBeRemoved: item.can_be_removed as boolean,
        defaultVisibility: (item.default_visibility ||
          'visible') as VisibilityState,
        roleVisibility: (item.role_visibility || {}) as Partial<RoleVisibility>,
      })
    )

    return { success: true, data: items, error: null }
  } catch (err) {
    console.error('Error in getNavigationItemsForAdmin:', err)
    return {
      success: false,
      data: null,
      error: 'Failed to fetch navigation items',
    }
  }
}

// =====================================================
// UPDATE ROLE VISIBILITY
// =====================================================

/**
 * Update visibility for a specific nav item + role combination
 */
export async function updateRoleVisibility(
  navConfigId: string,
  roleName: string,
  visibilityState: VisibilityState
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    // Validate role name
    const validRoles = ['owner', 'admin', 'provider', 'assistant', 'staff']
    if (!validRoles.includes(roleName)) {
      return { success: false, error: 'Invalid role name' }
    }

    // Validate visibility state
    const validStates = ['visible', 'available', 'hidden']
    if (!validStates.includes(visibilityState)) {
      return { success: false, error: 'Invalid visibility state' }
    }

    // Upsert the visibility setting
    const { error: upsertError } = await supabase
      .from('navigation_role_visibility')
      .upsert(
        {
          organization_id: orgId,
          navigation_config_id: navConfigId,
          role_name: roleName,
          visibility_state: visibilityState,
        },
        {
          onConflict: 'organization_id,navigation_config_id,role_name',
        }
      )

    if (upsertError) {
      console.error('Error updating role visibility:', upsertError)
      return { success: false, error: 'Failed to update visibility' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in updateRoleVisibility:', err)
    return { success: false, error: 'Failed to update visibility' }
  }
}

// =====================================================
// BULK UPDATE ROLE VISIBILITY
// =====================================================

/**
 * Batch update role visibility for multiple items/roles
 * Used by the visibility matrix UI
 */
export async function bulkUpdateRoleVisibility(
  updates: BulkVisibilityUpdate[]
): Promise<{ success: boolean; error: string | null; updated: number }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized', updated: 0 }
    }

    // Validate all updates
    const validRoles = ['owner', 'admin', 'provider', 'assistant', 'staff']
    const validStates = ['visible', 'available', 'hidden']

    for (const update of updates) {
      if (!validRoles.includes(update.roleName)) {
        return {
          success: false,
          error: `Invalid role: ${update.roleName}`,
          updated: 0,
        }
      }
      if (!validStates.includes(update.visibilityState)) {
        return {
          success: false,
          error: `Invalid state: ${update.visibilityState}`,
          updated: 0,
        }
      }
    }

    // Prepare upsert data
    const upsertData = updates.map(update => ({
      organization_id: orgId,
      navigation_config_id: update.navConfigId,
      role_name: update.roleName,
      visibility_state: update.visibilityState,
    }))

    // Bulk upsert
    const { error: upsertError } = await supabase
      .from('navigation_role_visibility')
      .upsert(upsertData, {
        onConflict: 'organization_id,navigation_config_id,role_name',
      })

    if (upsertError) {
      console.error('Error bulk updating role visibility:', upsertError)
      return {
        success: false,
        error: 'Failed to update visibility',
        updated: 0,
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null, updated: updates.length }
  } catch (err) {
    console.error('Error in bulkUpdateRoleVisibility:', err)
    return { success: false, error: 'Failed to update visibility', updated: 0 }
  }
}

// =====================================================
// UPDATE NAV ITEM DISPLAY
// =====================================================

/**
 * Update display properties of a navigation item
 */
export async function updateNavItemDisplay(
  navConfigId: string,
  updates: {
    displayName?: string
    iconName?: string
    isRequired?: boolean
    canBeRemoved?: boolean
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    // Check if this is a global item (org_id = null) that needs to be overridden
    const { data: existingItem } = await supabase
      .from('navigation_config')
      .select(
        'id, organization_id, object_definition_id, item_key, item_type, nav_type, sort_order, item_href'
      )
      .eq('id', navConfigId)
      .single()

    if (!existingItem) {
      return { success: false, error: 'Navigation item not found' }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (updates.displayName !== undefined)
      updateData.display_name = updates.displayName
    if (updates.iconName !== undefined) updateData.icon_name = updates.iconName
    if (updates.isRequired !== undefined)
      updateData.is_required = updates.isRequired
    if (updates.canBeRemoved !== undefined)
      updateData.can_be_removed = updates.canBeRemoved

    if (Object.keys(updateData).length === 0) {
      return { success: true, error: null } // Nothing to update
    }

    if (existingItem.organization_id === null) {
      // This is a global item - create an org-specific override
      const { error: insertError } = await supabase
        .from('navigation_config')
        .upsert(
          {
            organization_id: orgId,
            object_definition_id: existingItem.object_definition_id,
            item_type: existingItem.item_type,
            item_key: existingItem.item_key,
            item_href: existingItem.item_href,
            nav_type: existingItem.nav_type,
            sort_order: existingItem.sort_order,
            app_id: 'default',
            is_visible: true,
            ...updateData,
          },
          {
            onConflict: existingItem.object_definition_id
              ? 'organization_id,app_id,object_definition_id'
              : 'organization_id,app_id,item_key',
          }
        )

      if (insertError) {
        console.error('Error creating nav item override:', insertError)
        return { success: false, error: 'Failed to update navigation item' }
      }
    } else {
      // This is an org-specific item - update directly
      const { error: updateError } = await supabase
        .from('navigation_config')
        .update(updateData)
        .eq('id', navConfigId)

      if (updateError) {
        console.error('Error updating nav item:', updateError)
        return { success: false, error: 'Failed to update navigation item' }
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in updateNavItemDisplay:', err)
    return { success: false, error: 'Failed to update navigation item' }
  }
}

// =====================================================
// REORDER NAV ITEMS (ADMIN)
// =====================================================

/**
 * Reorder navigation items for the organization
 * This updates the sort_order for all items in a nav type
 */
export async function reorderAdminNavItems(
  itemIds: string[],
  _navType: 'primary_tab' | 'tools_menu' | 'admin_menu'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    // Fetch all items at once to minimize queries
    const { data: allItems } = await supabase
      .from('navigation_config')
      .select('*')
      .in('id', itemIds)

    if (!allItems || allItems.length === 0) {
      return { success: false, error: 'No items found' }
    }

    // Build a map for quick lookup
    const itemMap = new Map(allItems.map(item => [item.id, item]))

    // Process all items - create org-specific overrides for global items
    // and update sort_order for all items in the new order
    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i]
      const existingItem = itemMap.get(itemId)
      const newSortOrder = (i + 1) * 10

      if (!existingItem) continue

      if (existingItem.organization_id === null) {
        // This is a global item - need to create/update org-specific override
        // First, check if an org-specific override already exists
        let existingOverride = null

        if (existingItem.object_definition_id) {
          const { data } = await supabase
            .from('navigation_config')
            .select('id')
            .eq('organization_id', orgId)
            .eq('app_id', 'default')
            .eq('object_definition_id', existingItem.object_definition_id)
            .maybeSingle()
          existingOverride = data
        } else if (existingItem.item_key) {
          const { data } = await supabase
            .from('navigation_config')
            .select('id')
            .eq('organization_id', orgId)
            .eq('app_id', 'default')
            .eq('item_key', existingItem.item_key)
            .maybeSingle()
          existingOverride = data
        }

        if (existingOverride) {
          // Update existing org-specific override
          await supabase
            .from('navigation_config')
            .update({ sort_order: newSortOrder })
            .eq('id', existingOverride.id)
        } else {
          // Insert new org-specific override
          await supabase.from('navigation_config').insert({
            organization_id: orgId,
            object_definition_id: existingItem.object_definition_id,
            item_type: existingItem.item_type,
            item_key: existingItem.item_key,
            item_href: existingItem.item_href,
            nav_type: existingItem.nav_type,
            display_name: existingItem.display_name,
            icon_name: existingItem.icon_name,
            app_id: 'default',
            is_visible: true,
            sort_order: newSortOrder,
          })
        }
      } else {
        // Update existing org-specific item
        await supabase
          .from('navigation_config')
          .update({ sort_order: newSortOrder })
          .eq('id', itemId)
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in reorderAdminNavItems:', err)
    return { success: false, error: 'Failed to reorder navigation items' }
  }
}

// =====================================================
// GET AVAILABLE ROLES
// =====================================================

/**
 * Get the list of roles that can be configured for navigation visibility
 */
export async function getConfigurableRoles(): Promise<{
  success: boolean
  data: Array<{ name: string; label: string }> | null
  error: string | null
}> {
  // These are hardcoded for now but could come from a roles table
  const roles = [
    { name: 'owner', label: 'Owner' },
    { name: 'admin', label: 'Admin' },
    { name: 'provider', label: 'Provider' },
    { name: 'assistant', label: 'Assistant' },
    { name: 'staff', label: 'Staff' },
  ]

  return { success: true, data: roles, error: null }
}

// =====================================================
// ADD NAVIGATION ITEM
// =====================================================

export type NavItemType = 'object' | 'tool' | 'external_link'
export type NavType = 'primary_tab' | 'tools_menu' | 'admin_menu'

export interface NewNavItemData {
  itemType: NavItemType
  navType: NavType
  displayName: string
  iconName: string
  // For object type - reference existing object
  objectDefinitionId?: string
  // For tool type
  itemKey?: string
  // For external_link type
  itemHref?: string
  // Optional settings
  isRequired?: boolean
  canBeRemoved?: boolean
  defaultVisibility?: VisibilityState
}

/**
 * Add a new navigation item to the organization's navigation config.
 * This can be:
 * - A custom object not yet in navigation
 * - A custom link (external URL)
 * - Moving an existing item from another group (handled by moveNavigationItem)
 */
export async function addNavigationItem(data: NewNavItemData): Promise<{
  success: boolean
  data: AdminNavItem | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, data: null, error: error || 'Not authorized' }
    }

    if (!orgId) {
      return { success: false, data: null, error: 'No organization found' }
    }

    // Validate required fields based on item type
    if (data.itemType === 'object' && !data.objectDefinitionId) {
      return {
        success: false,
        data: null,
        error: 'Object definition ID is required for object items',
      }
    }
    if (data.itemType === 'tool' && !data.itemKey) {
      return {
        success: false,
        data: null,
        error: 'Item key is required for tool items',
      }
    }
    if (data.itemType === 'external_link' && !data.itemHref) {
      return {
        success: false,
        data: null,
        error: 'URL is required for external link items',
      }
    }

    // Get the max sort order for this nav type to place new item at the end
    const { data: existingItems } = await supabase
      .from('navigation_config')
      .select('sort_order')
      .eq('nav_type', data.navType)
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSortOrder = existingItems?.[0]?.sort_order || 0
    const newSortOrder = maxSortOrder + 10

    // Insert the new navigation item
    const insertData: Record<string, unknown> = {
      organization_id: orgId,
      app_id: 'default',
      item_type: data.itemType,
      nav_type: data.navType,
      display_name: data.displayName,
      icon_name: data.iconName,
      sort_order: newSortOrder,
      is_visible: true,
      is_required: data.isRequired ?? false,
      can_be_removed: data.canBeRemoved ?? true,
      default_visibility: data.defaultVisibility ?? 'visible',
    }

    // Add type-specific fields
    if (data.itemType === 'object' && data.objectDefinitionId) {
      insertData.object_definition_id = data.objectDefinitionId
    }
    if (data.itemType === 'tool' && data.itemKey) {
      insertData.item_key = data.itemKey
    }
    if (data.itemType === 'external_link' && data.itemHref) {
      insertData.item_href = data.itemHref
      // Generate a unique key for external links
      insertData.item_key = `link_${Date.now()}`
    }

    const { data: newItem, error: insertError } = await supabase
      .from('navigation_config')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error adding navigation item:', insertError)
      return {
        success: false,
        data: null,
        error: 'Failed to add navigation item',
      }
    }

    // Fetch the full item data with object info if applicable
    const { data: items } = await supabase.rpc(
      'get_navigation_items_for_admin',
      {
        p_organization_id: orgId,
        p_app_id: 'default',
      }
    )

    const fullItem = (items || []).find(
      (item: Record<string, unknown>) => item.id === newItem.id
    )

    if (!fullItem) {
      return {
        success: false,
        data: null,
        error: 'Failed to retrieve new item',
      }
    }

    const adminNavItem: AdminNavItem = {
      id: fullItem.id as string,
      objectDefinitionId: fullItem.object_definition_id as string | null,
      objectApiName: fullItem.object_api_name as string | null,
      objectLabel: fullItem.object_label as string | null,
      objectPluralLabel: fullItem.object_plural_label as string | null,
      itemType: fullItem.item_type as string,
      itemKey: fullItem.item_key as string | null,
      itemHref: fullItem.item_href as string | null,
      navType: fullItem.nav_type as string,
      sortOrder: fullItem.sort_order as number,
      displayName: fullItem.display_name as string,
      iconName: fullItem.icon_name as string,
      isCustomObject: fullItem.is_custom_object as boolean,
      isRequired: fullItem.is_required as boolean,
      canBeRemoved: fullItem.can_be_removed as boolean,
      defaultVisibility: (fullItem.default_visibility ||
        'visible') as VisibilityState,
      roleVisibility: (fullItem.role_visibility ||
        {}) as Partial<RoleVisibility>,
    }

    revalidatePath('/admin', 'layout')
    return { success: true, data: adminNavItem, error: null }
  } catch (err) {
    console.error('Error in addNavigationItem:', err)
    return {
      success: false,
      data: null,
      error: 'Failed to add navigation item',
    }
  }
}

// =====================================================
// MOVE NAVIGATION ITEM BETWEEN GROUPS
// =====================================================

/**
 * Move an existing navigation item from one group to another.
 * For example, move "Reports" from Tools Menu to Primary Navigation.
 */
export async function moveNavigationItem(
  navConfigId: string,
  targetNavType: NavType
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    if (!orgId) {
      return { success: false, error: 'No organization found' }
    }

    // Get the existing item
    const { data: existingItem } = await supabase
      .from('navigation_config')
      .select('*')
      .eq('id', navConfigId)
      .single()

    if (!existingItem) {
      return { success: false, error: 'Navigation item not found' }
    }

    // Don't move if already in target group
    if (existingItem.nav_type === targetNavType) {
      return { success: true, error: null }
    }

    // Get max sort order in target group
    const { data: targetItems } = await supabase
      .from('navigation_config')
      .select('sort_order')
      .eq('nav_type', targetNavType)
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSortOrder = targetItems?.[0]?.sort_order || 0
    const newSortOrder = maxSortOrder + 10

    if (existingItem.organization_id === null) {
      // This is a global item - create an org-specific override with new nav_type
      const { error: insertError } = await supabase
        .from('navigation_config')
        .upsert(
          {
            organization_id: orgId,
            object_definition_id: existingItem.object_definition_id,
            item_type: existingItem.item_type,
            item_key: existingItem.item_key,
            item_href: existingItem.item_href,
            display_name: existingItem.display_name,
            icon_name: existingItem.icon_name,
            app_id: 'default',
            is_visible: true,
            nav_type: targetNavType,
            sort_order: newSortOrder,
            is_required: existingItem.is_required,
            can_be_removed: existingItem.can_be_removed,
            default_visibility: existingItem.default_visibility,
          },
          {
            onConflict: existingItem.object_definition_id
              ? 'organization_id,app_id,object_definition_id'
              : 'organization_id,app_id,item_key',
          }
        )

      if (insertError) {
        console.error('Error creating nav item override for move:', insertError)
        return { success: false, error: 'Failed to move navigation item' }
      }
    } else {
      // This is an org-specific item - update directly
      const { error: updateError } = await supabase
        .from('navigation_config')
        .update({
          nav_type: targetNavType,
          sort_order: newSortOrder,
        })
        .eq('id', navConfigId)

      if (updateError) {
        console.error('Error updating nav item for move:', updateError)
        return { success: false, error: 'Failed to move navigation item' }
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in moveNavigationItem:', err)
    return { success: false, error: 'Failed to move navigation item' }
  }
}

// =====================================================
// DELETE NAVIGATION ITEM
// =====================================================

/**
 * Delete a navigation item (only org-specific items can be deleted).
 * Global items cannot be deleted, but they can be hidden via visibility settings.
 */
export async function deleteNavigationItem(
  navConfigId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    // Get the item to check if it's deletable
    const { data: existingItem } = await supabase
      .from('navigation_config')
      .select('organization_id, is_required')
      .eq('id', navConfigId)
      .single()

    if (!existingItem) {
      return { success: false, error: 'Navigation item not found' }
    }

    // Cannot delete global items
    if (existingItem.organization_id === null) {
      return {
        success: false,
        error:
          'Cannot delete system default items. Use visibility settings instead.',
      }
    }

    // Cannot delete required items
    if (existingItem.is_required) {
      return { success: false, error: 'Cannot delete required items' }
    }

    // Verify the item belongs to this org
    if (existingItem.organization_id !== orgId) {
      return { success: false, error: 'Permission denied' }
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('navigation_config')
      .delete()
      .eq('id', navConfigId)

    if (deleteError) {
      console.error('Error deleting navigation item:', deleteError)
      return { success: false, error: 'Failed to delete navigation item' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in deleteNavigationItem:', err)
    return { success: false, error: 'Failed to delete navigation item' }
  }
}

// =====================================================
// GET AVAILABLE OBJECTS FOR NAVIGATION
// =====================================================

/**
 * Get custom objects that are not yet in navigation.
 * Used by the "Add Item" dialog to show available objects.
 */
export async function getAvailableObjectsForNav(): Promise<{
  success: boolean
  data: Array<{
    id: string
    apiName: string
    label: string
    pluralLabel: string
    isCustom: boolean
  }> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, data: null, error: error || 'Not authorized' }
    }

    // Get all object definitions
    const { data: objects, error: objectsError } = await supabase
      .from('object_definitions')
      .select('id, api_name, label, plural_label, is_custom')
      .eq('organization_id', orgId)
      .order('label')

    if (objectsError) {
      console.error('Error fetching objects:', objectsError)
      return { success: false, data: null, error: 'Failed to fetch objects' }
    }

    // Get objects already in navigation
    const { data: navItems } = await supabase
      .from('navigation_config')
      .select('object_definition_id')
      .not('object_definition_id', 'is', null)
      .or(`organization_id.is.null,organization_id.eq.${orgId}`)

    const objectsInNav = new Set(
      (navItems || []).map(
        (item: { object_definition_id: string }) => item.object_definition_id
      )
    )

    // Filter to objects not yet in nav
    const availableObjects = (objects || [])
      .filter((obj: { id: string }) => !objectsInNav.has(obj.id))
      .map(
        (obj: {
          id: string
          api_name: string
          label: string
          plural_label: string
          is_custom: boolean
        }) => ({
          id: obj.id,
          apiName: obj.api_name,
          label: obj.label,
          pluralLabel: obj.plural_label,
          isCustom: obj.is_custom,
        })
      )

    return { success: true, data: availableObjects, error: null }
  } catch (err) {
    console.error('Error in getAvailableObjectsForNav:', err)
    return {
      success: false,
      data: null,
      error: 'Failed to fetch available objects',
    }
  }
}

// =====================================================
// RESET TO DEFAULTS
// =====================================================

/**
 * Reset navigation configuration to global defaults
 * Removes all org-specific overrides
 */
export async function resetNavigationToDefaults(): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authorized, error, orgId } = await checkAdminAccess(supabase)

    if (!authorized) {
      return { success: false, error: error || 'Not authorized' }
    }

    if (!orgId) {
      return { success: false, error: 'No organization found' }
    }

    // Delete org-specific navigation configs
    const { error: deleteNavError } = await supabase
      .from('navigation_config')
      .delete()
      .eq('organization_id', orgId)

    if (deleteNavError) {
      console.error('Error deleting nav configs:', deleteNavError)
      return { success: false, error: 'Failed to reset navigation' }
    }

    // Delete org-specific role visibility
    const { error: deleteVisError } = await supabase
      .from('navigation_role_visibility')
      .delete()
      .eq('organization_id', orgId)

    if (deleteVisError) {
      console.error('Error deleting role visibility:', deleteVisError)
      return { success: false, error: 'Failed to reset visibility' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in resetNavigationToDefaults:', err)
    return { success: false, error: 'Failed to reset navigation' }
  }
}
