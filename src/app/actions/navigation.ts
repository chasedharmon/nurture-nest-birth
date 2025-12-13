'use server'

/**
 * Server Actions for Admin Navigation
 *
 * These actions fetch navigation configuration from the database
 * and combine it with organization settings.
 *
 * IMPORTANT: Returns SerializableNavigationConfig (no React components)
 * because React components cannot be serialized and passed from server to client.
 * Client components should use getIconComponent() to get icon components.
 */

import { createClient } from '@/lib/supabase/server'
import {
  type DbUserNavItem,
  type SerializableNavigationConfig,
  type SerializableNavItem,
  filterByRole,
  FALLBACK_NAV_DATA,
  getObjectHref,
} from '@/lib/admin-navigation'
import { getUnreadCount } from './messaging'

/**
 * Get the complete navigation configuration for the current user
 * Returns SerializableNavigationConfig (without iconComponent - cannot serialize React components)
 */
export async function getNavigationConfig(): Promise<{
  success: boolean
  data: SerializableNavigationConfig | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, data: null, error: 'Not authenticated' }
    }

    // Get user profile with organization (optional - may not exist for new users)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Continue with fallback - profile is optional for navigation
    }

    // Get user's role from team_members
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const userRole = teamMember?.role || null

    // Try to fetch navigation using the new user-aware RPC function first
    let navItems: DbUserNavItem[] | null = null
    let usedLegacyRpc = false

    // First try the new get_user_navigation RPC (includes personalization)
    const { data: userNavResult, error: userNavError } = await supabase.rpc(
      'get_user_navigation',
      {
        p_user_id: user.id,
        p_app_id: 'default',
      }
    )

    if (userNavError) {
      console.warn(
        'get_user_navigation RPC unavailable, trying legacy:',
        userNavError.message
      )

      // Fallback to legacy get_navigation_config RPC
      const { data: legacyResult, error: legacyError } = await supabase.rpc(
        'get_navigation_config',
        {
          p_user_id: user.id,
          p_app_id: 'default',
        }
      )

      if (legacyError) {
        console.error(
          'Error fetching navigation config from legacy RPC:',
          legacyError
        )
        // Both RPCs unavailable - we'll build navigation from object_definitions
      } else {
        navItems = legacyResult as DbUserNavItem[] | null
        usedLegacyRpc = true
      }
    } else {
      navItems = userNavResult as DbUserNavItem[] | null
    }

    let primaryTabs: SerializableNavItem[]
    let toolsMenu: SerializableNavItem[]
    let adminMenu: SerializableNavItem[]

    if (navItems && navItems.length > 0) {
      // Transform database items with personalization support
      const transformed = transformNavItemsWithPersonalization(
        navItems,
        usedLegacyRpc
      )
      primaryTabs = transformed.primaryTabs
      toolsMenu = transformed.toolsMenu
      adminMenu = transformed.adminMenu
    } else {
      // Fallback: Build navigation from object_definitions + default tools
      const customObjectTabs = await getCustomObjectNavItems(
        supabase,
        profile?.organization_id
      )
      primaryTabs = [...FALLBACK_NAV_DATA.primaryTabs, ...customObjectTabs]
      toolsMenu = FALLBACK_NAV_DATA.toolsMenu
      adminMenu = FALLBACK_NAV_DATA.adminMenu
    }

    // Filter by role (works with SerializableNavItem) - only needed for legacy RPC
    // The new RPC already filters based on role visibility
    const filteredToolsMenu = usedLegacyRpc
      ? filterByRole(toolsMenu, userRole)
      : toolsMenu

    // Get organization name for branding
    let brandName = 'Admin Portal'
    let brandLogoUrl: string | null = null

    if (profile?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', profile.organization_id)
        .single()

      if (org) {
        brandName = org.name
        brandLogoUrl = org.logo_url
      }
    }

    // Get unread message count
    const unreadResult = await getUnreadCount()
    const unreadMessages = unreadResult.count || 0

    // Add badge to messages item
    const toolsWithBadges: SerializableNavItem[] = filteredToolsMenu.map(
      item => {
        if (item.key === 'messages' && unreadMessages > 0) {
          return { ...item, badge: unreadMessages }
        }
        return item
      }
    )

    return {
      success: true,
      data: {
        primaryTabs,
        toolsMenu: toolsWithBadges,
        adminMenu,
        brandName,
        brandLogoUrl,
        unreadMessages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in getNavigationConfig:', error)
    // Return null so layout uses its own serializable fallback
    return {
      success: true,
      data: null,
      error: 'Failed to fetch navigation config (using fallback)',
    }
  }
}

/**
 * Get navigation config for a specific app (for future app launcher)
 */
export async function getNavigationConfigForApp(appId: string): Promise<{
  success: boolean
  data: SerializableNavigationConfig | null
  error: string | null
}> {
  // For now, just use the default app
  // In the future, this will filter by app_id
  if (appId !== 'default') {
    console.warn(`App "${appId}" not found, using default`)
  }

  return getNavigationConfig()
}

/**
 * Get just the organization branding info
 * Useful for lighter-weight fetches when full nav isn't needed
 */
export async function getOrganizationBranding(): Promise<{
  success: boolean
  data: { name: string; logoUrl: string | null } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, data: null, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return {
        success: true,
        data: { name: 'Admin Portal', logoUrl: null },
        error: null,
      }
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', profile.organization_id)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return {
        success: false,
        data: null,
        error: 'Failed to fetch organization',
      }
    }

    return {
      success: true,
      data: {
        name: org.name,
        logoUrl: org.logo_url,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in getOrganizationBranding:', error)
    return { success: false, data: null, error: 'Failed to fetch branding' }
  }
}

/**
 * Update navigation item visibility (admin only)
 */
export async function updateNavItemVisibility(
  itemId: string,
  isVisible: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is admin/owner
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return { success: false, error: 'Permission denied' }
    }

    // Update the nav item
    const { error } = await supabase
      .from('navigation_config')
      .update({ is_visible: isVisible })
      .eq('id', itemId)

    if (error) {
      console.error('Error updating nav item:', error)
      return { success: false, error: 'Failed to update navigation item' }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateNavItemVisibility:', error)
    return { success: false, error: 'Failed to update navigation item' }
  }
}

/**
 * Reorder navigation items (admin only)
 */
export async function reorderNavItems(
  itemIds: string[],
  navType: 'primary_tab' | 'tools_menu' | 'admin_menu'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is admin/owner
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return { success: false, error: 'Permission denied' }
    }

    // Update sort_order for each item
    const updates = itemIds.map((id, index) =>
      supabase
        .from('navigation_config')
        .update({ sort_order: (index + 1) * 10 })
        .eq('id', id)
        .eq('nav_type', navType)
    )

    await Promise.all(updates)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in reorderNavItems:', error)
    return { success: false, error: 'Failed to reorder navigation items' }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Transform nav items with personalization support
 * Works with both new get_user_navigation and legacy get_navigation_config RPCs
 */
function transformNavItemsWithPersonalization(
  dbItems: DbUserNavItem[],
  isLegacy: boolean
): {
  primaryTabs: SerializableNavItem[]
  toolsMenu: SerializableNavItem[]
  adminMenu: SerializableNavItem[]
} {
  const primaryTabs: SerializableNavItem[] = []
  const toolsMenu: SerializableNavItem[] = []
  const adminMenu: SerializableNavItem[] = []

  for (const item of dbItems) {
    const key = item.object_api_name || item.item_key || item.id
    const label = item.display_name || item.object_label || key
    const pluralLabel = item.object_plural_label || label

    // Determine href
    let href: string
    if (item.item_type === 'object' && item.object_api_name) {
      href = getObjectHref(item.object_api_name, item.is_custom_object)
    } else if (item.item_href) {
      href = item.item_href
    } else if (item.item_key) {
      href = `/admin/${item.item_key}`
    } else {
      href = '/admin'
    }

    const navItem: SerializableNavItem = {
      id: item.id,
      type: item.item_type,
      key,
      label,
      pluralLabel,
      href,
      icon: item.icon_name,
      isCustomObject: item.is_custom_object,
      visibleToRoles: item.visible_to_roles,
      // Add personalization fields if using new RPC
      ...(isLegacy
        ? {}
        : {
            visibilityState: item.visibility_state,
            isUserAdded: item.is_user_added,
            isRequired: item.is_required,
            canBeRemoved: item.can_be_removed,
          }),
    }

    switch (item.nav_type) {
      case 'primary_tab':
        primaryTabs.push(navItem)
        break
      case 'tools_menu':
        toolsMenu.push(navItem)
        break
      case 'admin_menu':
        adminMenu.push(navItem)
        break
    }
  }

  return { primaryTabs, toolsMenu, adminMenu }
}

/**
 * Get custom object navigation items from object_definitions
 * This is used as a fallback when navigation_config table or RPC is unavailable
 */
async function getCustomObjectNavItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string | null | undefined
): Promise<SerializableNavItem[]> {
  if (!organizationId) {
    return []
  }

  try {
    // Fetch custom objects for this organization
    const { data: customObjects, error } = await supabase
      .from('object_definitions')
      .select('id, api_name, label, plural_label, icon_name, color')
      .eq('organization_id', organizationId)
      .eq('is_custom', true)
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      console.error('Error fetching custom objects for navigation:', error)
      return []
    }

    if (!customObjects || customObjects.length === 0) {
      return []
    }

    // Transform custom objects into navigation items
    return customObjects.map(obj => ({
      id: obj.id,
      type: 'object' as const,
      key: obj.api_name,
      label: obj.plural_label || obj.label,
      pluralLabel: obj.plural_label || obj.label,
      href: getObjectHref(obj.api_name, true), // true = isCustomObject
      icon: obj.icon_name || 'database',
      isCustomObject: true,
      visibleToRoles: null, // Visible to all roles by default
    }))
  } catch (err) {
    console.error('Error in getCustomObjectNavItems:', err)
    return []
  }
}
