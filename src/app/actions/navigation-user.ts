'use server'

/**
 * User Navigation Personalization Server Actions
 *
 * These actions allow users to personalize their navigation:
 * - Add "available" items to their nav
 * - Remove items (if allowed)
 * - Reorder their personal navigation
 *
 * All users can personalize their own navigation.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export interface UserNavItem {
  navConfigId: string
  sortOrder: number
  isAdded: boolean
}

export interface UserNavPreferences {
  id: string
  userId: string
  organizationId: string | null
  appId: string
  navItems: UserNavItem[]
  showIcons: boolean
  compactMode: boolean
}

export interface AvailableNavItem {
  id: string
  objectDefinitionId: string | null
  objectApiName: string | null
  displayName: string
  iconName: string
  navType: string
  isCustomObject: boolean
}

// =====================================================
// USER AUTH HELPER
// =====================================================

async function getUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authenticated: false,
      error: 'Not authenticated',
      userId: null,
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
    authenticated: true,
    error: null,
    userId: user.id,
    orgId: profile?.organization_id || null,
  }
}

// =====================================================
// GET USER NAV PREFERENCES
// =====================================================

/**
 * Get the current user's navigation preferences
 */
export async function getUserNavPreferences(
  appId: string = 'default'
): Promise<{
  success: boolean
  data: UserNavPreferences | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId, orgId } =
      await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, data: null, error: error || 'Not authenticated' }
    }

    const { data, error: fetchError } = await supabase
      .from('user_navigation_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user nav preferences:', fetchError)
      return {
        success: false,
        data: null,
        error: 'Failed to fetch preferences',
      }
    }

    if (!data) {
      // Return empty preferences if none exist
      return {
        success: true,
        data: {
          id: '',
          userId,
          organizationId: orgId,
          appId,
          navItems: [],
          showIcons: true,
          compactMode: false,
        },
        error: null,
      }
    }

    // Transform to frontend format
    const preferences: UserNavPreferences = {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      appId: data.app_id,
      navItems: (
        (data.nav_items as Array<{
          nav_config_id: string
          sort_order: number
          is_added: boolean
        }>) || []
      ).map(item => ({
        navConfigId: item.nav_config_id,
        sortOrder: item.sort_order,
        isAdded: item.is_added,
      })),
      showIcons: data.show_icons ?? true,
      compactMode: data.compact_mode ?? false,
    }

    return { success: true, data: preferences, error: null }
  } catch (err) {
    console.error('Error in getUserNavPreferences:', err)
    return { success: false, data: null, error: 'Failed to fetch preferences' }
  }
}

// =====================================================
// GET AVAILABLE NAV ITEMS
// =====================================================

/**
 * Get items the user can add to their navigation
 * These are items with "available" visibility for the user's role
 * that they haven't already added
 */
export async function getAvailableNavItems(appId: string = 'default'): Promise<{
  success: boolean
  data: AvailableNavItem[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId } = await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, data: null, error: error || 'Not authenticated' }
    }

    // Call the RPC function
    const { data, error: rpcError } = await supabase.rpc(
      'get_available_nav_items',
      {
        p_user_id: userId,
        p_app_id: appId,
      }
    )

    if (rpcError) {
      console.error('Error fetching available nav items:', rpcError)
      return {
        success: false,
        data: null,
        error: 'Failed to fetch available items',
      }
    }

    // Transform to frontend format
    const items: AvailableNavItem[] = (data || []).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        objectDefinitionId: item.object_definition_id as string | null,
        objectApiName: item.object_api_name as string | null,
        displayName: item.display_name as string,
        iconName: item.icon_name as string,
        navType: item.nav_type as string,
        isCustomObject: item.is_custom_object as boolean,
      })
    )

    return { success: true, data: items, error: null }
  } catch (err) {
    console.error('Error in getAvailableNavItems:', err)
    return {
      success: false,
      data: null,
      error: 'Failed to fetch available items',
    }
  }
}

// =====================================================
// ADD NAV ITEM TO PERSONAL NAV
// =====================================================

/**
 * Add an "available" item to the user's personal navigation
 */
export async function addNavItemToPersonalNav(
  navConfigId: string,
  appId: string = 'default'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId, orgId } =
      await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, error: error || 'Not authenticated' }
    }

    // Get existing preferences
    const { data: existing } = await supabase
      .from('user_navigation_preferences')
      .select('id, nav_items')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .maybeSingle()

    const currentItems =
      (existing?.nav_items as Array<{
        nav_config_id: string
        sort_order: number
        is_added: boolean
      }>) || []

    // Check if already added
    if (currentItems.some(item => item.nav_config_id === navConfigId)) {
      return { success: true, error: null } // Already added, no-op
    }

    // Calculate new sort order (add to end)
    const maxSortOrder = currentItems.reduce(
      (max, item) => Math.max(max, item.sort_order || 0),
      0
    )

    // Add the new item
    const newItems = [
      ...currentItems,
      {
        nav_config_id: navConfigId,
        sort_order: maxSortOrder + 10,
        is_added: true,
      },
    ]

    if (existing) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('user_navigation_preferences')
        .update({ nav_items: newItems })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating nav preferences:', updateError)
        return { success: false, error: 'Failed to add item' }
      }
    } else {
      // Create new preferences
      const { error: insertError } = await supabase
        .from('user_navigation_preferences')
        .insert({
          user_id: userId,
          organization_id: orgId,
          app_id: appId,
          nav_items: newItems,
        })

      if (insertError) {
        console.error('Error creating nav preferences:', insertError)
        return { success: false, error: 'Failed to add item' }
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in addNavItemToPersonalNav:', err)
    return { success: false, error: 'Failed to add item' }
  }
}

// =====================================================
// REMOVE NAV ITEM FROM PERSONAL NAV
// =====================================================

/**
 * Remove an item from the user's personal navigation
 * Only works if the item's can_be_removed flag is true
 */
export async function removeNavItemFromPersonalNav(
  navConfigId: string,
  appId: string = 'default'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId } = await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, error: error || 'Not authenticated' }
    }

    // Check if the item can be removed
    const { data: navItem } = await supabase
      .from('navigation_config')
      .select('can_be_removed, is_required')
      .eq('id', navConfigId)
      .single()

    if (navItem?.is_required || navItem?.can_be_removed === false) {
      return { success: false, error: 'This item cannot be removed' }
    }

    // Get existing preferences
    const { data: existing } = await supabase
      .from('user_navigation_preferences')
      .select('id, nav_items')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .maybeSingle()

    if (!existing) {
      // No preferences exist, create with the item marked as removed
      // (We track removed items so they don't reappear)
      return { success: true, error: null }
    }

    const currentItems =
      (existing.nav_items as Array<{
        nav_config_id: string
        sort_order: number
        is_added: boolean
      }>) || []

    // Remove the item or mark it as not added
    const newItems = currentItems
      .map(item => {
        if (item.nav_config_id === navConfigId) {
          // Mark as not added (keeps sort order for if they re-add)
          return { ...item, is_added: false }
        }
        return item
      })
      .filter(item => item.is_added || item.nav_config_id === navConfigId)

    const { error: updateError } = await supabase
      .from('user_navigation_preferences')
      .update({ nav_items: newItems })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Error updating nav preferences:', updateError)
      return { success: false, error: 'Failed to remove item' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in removeNavItemFromPersonalNav:', err)
    return { success: false, error: 'Failed to remove item' }
  }
}

// =====================================================
// REORDER PERSONAL NAV
// =====================================================

/**
 * Reorder the user's personal navigation
 */
export async function reorderPersonalNav(
  orderedIds: string[],
  appId: string = 'default'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId, orgId } =
      await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, error: error || 'Not authenticated' }
    }

    // Get existing preferences
    const { data: existing } = await supabase
      .from('user_navigation_preferences')
      .select('id, nav_items')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .maybeSingle()

    const currentItems =
      (existing?.nav_items as Array<{
        nav_config_id: string
        sort_order: number
        is_added: boolean
      }>) || []

    // Create a map of existing items for quick lookup
    const existingMap = new Map(
      currentItems.map(item => [item.nav_config_id, item])
    )

    // Build new nav_items array with updated sort orders
    const newItems = orderedIds.map((id, index) => {
      const existing = existingMap.get(id)
      return {
        nav_config_id: id,
        sort_order: (index + 1) * 10,
        is_added: existing?.is_added ?? false,
      }
    })

    // Also keep any items that weren't in the ordered list (shouldn't happen, but safety)
    for (const [id, item] of existingMap) {
      if (!orderedIds.includes(id)) {
        newItems.push(item)
      }
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('user_navigation_preferences')
        .update({ nav_items: newItems })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating nav order:', updateError)
        return { success: false, error: 'Failed to reorder navigation' }
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_navigation_preferences')
        .insert({
          user_id: userId,
          organization_id: orgId,
          app_id: appId,
          nav_items: newItems,
        })

      if (insertError) {
        console.error('Error creating nav preferences:', insertError)
        return { success: false, error: 'Failed to save order' }
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in reorderPersonalNav:', err)
    return { success: false, error: 'Failed to reorder navigation' }
  }
}

// =====================================================
// UPDATE UI PREFERENCES
// =====================================================

/**
 * Update user's navigation UI preferences
 */
export async function updateNavUIPreferences(
  preferences: {
    showIcons?: boolean
    compactMode?: boolean
  },
  appId: string = 'default'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId, orgId } =
      await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, error: error || 'Not authenticated' }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (preferences.showIcons !== undefined)
      updateData.show_icons = preferences.showIcons
    if (preferences.compactMode !== undefined)
      updateData.compact_mode = preferences.compactMode

    if (Object.keys(updateData).length === 0) {
      return { success: true, error: null }
    }

    // Upsert preferences
    const { error: upsertError } = await supabase
      .from('user_navigation_preferences')
      .upsert(
        {
          user_id: userId,
          organization_id: orgId,
          app_id: appId,
          nav_items: [],
          ...updateData,
        },
        {
          onConflict: 'user_id,organization_id,app_id',
        }
      )

    if (upsertError) {
      console.error('Error updating UI preferences:', upsertError)
      return { success: false, error: 'Failed to update preferences' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in updateNavUIPreferences:', err)
    return { success: false, error: 'Failed to update preferences' }
  }
}

// =====================================================
// RESET USER PREFERENCES
// =====================================================

/**
 * Reset user's navigation preferences to defaults
 */
export async function resetUserNavPreferences(
  appId: string = 'default'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { authenticated, error, userId } = await getUserContext(supabase)

    if (!authenticated || !userId) {
      return { success: false, error: error || 'Not authenticated' }
    }

    const { error: deleteError } = await supabase
      .from('user_navigation_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('app_id', appId)

    if (deleteError) {
      console.error('Error resetting nav preferences:', deleteError)
      return { success: false, error: 'Failed to reset preferences' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in resetUserNavPreferences:', err)
    return { success: false, error: 'Failed to reset preferences' }
  }
}
