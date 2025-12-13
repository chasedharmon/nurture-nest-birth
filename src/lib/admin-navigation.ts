/**
 * Admin Portal Navigation Configuration
 *
 * This module provides types and functions for the dynamic navigation system.
 * Navigation items are loaded from the database and can be customized per organization.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Users,
  UserPlus,
  Target,
  Activity,
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  Workflow,
  Users2,
  Settings,
  File,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

/**
 * Navigation item type
 */
export type NavItemType = 'object' | 'tool' | 'external_link'

/**
 * Navigation section type
 */
export type NavType = 'primary_tab' | 'tools_menu' | 'admin_menu'

/**
 * Raw navigation item from database
 */
export interface DbNavItem {
  id: string
  object_definition_id: string | null
  object_api_name: string | null
  object_label: string | null
  object_plural_label: string | null
  item_type: NavItemType
  item_key: string | null
  item_href: string | null
  nav_type: NavType
  sort_order: number
  display_name: string
  icon_name: string
  is_custom_object: boolean
  visible_to_roles: string[] | null
}

/**
 * Serializable navigation item (safe to pass server → client)
 * Does NOT include iconComponent as React components can't be serialized
 */
export interface SerializableNavItem {
  id: string
  type: NavItemType
  key: string // object api_name or item_key
  label: string
  pluralLabel: string
  href: string
  icon: string // Icon name - use getIconComponent() on client to get component
  badge?: number
  isCustomObject: boolean
  visibleToRoles: string[] | null
}

/**
 * Processed navigation item for UI (client-side use only)
 * Includes iconComponent which is looked up client-side
 */
export interface NavItem extends SerializableNavItem {
  iconComponent?: LucideIcon
}

/**
 * Serializable navigation configuration (safe to pass server → client)
 */
export interface SerializableNavigationConfig {
  primaryTabs: SerializableNavItem[]
  toolsMenu: SerializableNavItem[]
  adminMenu: SerializableNavItem[]
  brandName: string
  brandLogoUrl: string | null
  unreadMessages: number
}

/**
 * Complete navigation configuration (client-side use only)
 */
export interface NavigationConfig {
  primaryTabs: NavItem[]
  toolsMenu: NavItem[]
  adminMenu: NavItem[]
  brandName: string
  brandLogoUrl: string | null
  unreadMessages: number
}

/**
 * User context for navigation
 */
export interface NavUserContext {
  userId: string
  organizationId: string | null
  role: string | null
}

// =====================================================
// ICON MAPPING
// =====================================================

/**
 * Map icon names to Lucide components
 */
const iconMap: Record<string, LucideIcon> = {
  'building-2': Building2,
  building2: Building2,
  users: Users,
  'user-plus': UserPlus,
  userplus: UserPlus,
  target: Target,
  activity: Activity,
  'message-square': MessageSquare,
  messagesquare: MessageSquare,
  'bar-chart-3': BarChart3,
  barchart3: BarChart3,
  'layout-dashboard': LayoutDashboard,
  layoutdashboard: LayoutDashboard,
  workflow: Workflow,
  'users-2': Users2,
  users2: Users2,
  settings: Settings,
  file: File,
}

/**
 * Get Lucide icon component from icon name
 */
export function getIconComponent(iconName: string): LucideIcon {
  const normalized = iconName.toLowerCase().replace(/[-_]/g, '')
  return iconMap[normalized] || iconMap[iconName] || File
}

// =====================================================
// PATH UTILITIES
// =====================================================

/**
 * Standard object API names that have dedicated pages
 */
const STANDARD_OBJECT_PATHS: Record<string, string> = {
  Account: '/admin/accounts',
  Contact: '/admin/contacts',
  Lead: '/admin/crm-leads', // Note: leads page is at crm-leads
  Opportunity: '/admin/opportunities',
  Activity: '/admin/activities',
}

/**
 * Get the href for an object-based nav item
 */
export function getObjectHref(
  apiName: string,
  isCustomObject: boolean
): string {
  // Standard objects have dedicated pages
  if (!isCustomObject && STANDARD_OBJECT_PATHS[apiName]) {
    return STANDARD_OBJECT_PATHS[apiName]
  }

  // Custom objects use dynamic route
  return `/admin/objects/${apiName}`
}

/**
 * Check if a path is for a standard object
 */
export function isStandardObjectPath(pathname: string): boolean {
  return Object.values(STANDARD_OBJECT_PATHS).some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * Get object API name from pathname
 */
export function getObjectFromPath(pathname: string): string | null {
  // Check standard objects
  for (const [apiName, path] of Object.entries(STANDARD_OBJECT_PATHS)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return apiName
    }
  }

  // Check custom object dynamic route
  const customMatch = pathname.match(/^\/admin\/objects\/([^/]+)/)
  if (customMatch && customMatch[1]) {
    return customMatch[1]
  }

  return null
}

// =====================================================
// TRANSFORM FUNCTIONS
// =====================================================

/**
 * Transform database nav item to serializable nav item
 * Does NOT include iconComponent - client components should use getIconComponent()
 */
export function transformNavItem(dbItem: DbNavItem): SerializableNavItem {
  const key = dbItem.object_api_name || dbItem.item_key || dbItem.id
  const label = dbItem.display_name || dbItem.object_label || key
  const pluralLabel = dbItem.object_plural_label || label

  // Determine href
  let href: string
  if (dbItem.item_type === 'object' && dbItem.object_api_name) {
    href = getObjectHref(dbItem.object_api_name, dbItem.is_custom_object)
  } else if (dbItem.item_href) {
    href = dbItem.item_href
  } else if (dbItem.item_key) {
    href = `/admin/${dbItem.item_key}`
  } else {
    href = '/admin'
  }

  return {
    id: dbItem.id,
    type: dbItem.item_type,
    key,
    label,
    pluralLabel,
    href,
    icon: dbItem.icon_name,
    isCustomObject: dbItem.is_custom_object,
    visibleToRoles: dbItem.visible_to_roles,
  }
}

/**
 * Transform array of database items to categorized navigation config
 * Returns SerializableNavItem arrays (safe for server → client)
 */
export function transformNavItems(dbItems: DbNavItem[]): {
  primaryTabs: SerializableNavItem[]
  toolsMenu: SerializableNavItem[]
  adminMenu: SerializableNavItem[]
} {
  const primaryTabs: SerializableNavItem[] = []
  const toolsMenu: SerializableNavItem[] = []
  const adminMenu: SerializableNavItem[] = []

  for (const item of dbItems) {
    const navItem = transformNavItem(item)

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

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================

/**
 * Default keyboard shortcuts for navigation
 * Format: 'g' then letter (like Gmail/GitHub)
 */
export const NAV_SHORTCUTS: Record<string, string[]> = {
  Account: ['g', 'a'],
  Contact: ['g', 'c'],
  Lead: ['g', 'l'],
  Opportunity: ['g', 'o'],
  Activity: ['g', 'v'], // 'v' for activities (a is taken)
  messages: ['g', 'm'],
  reports: ['g', 'r'],
  dashboards: ['g', 'd'],
  workflows: ['g', 'w'],
  setup: ['g', 's'],
  team: ['g', 't'],
}

/**
 * Get keyboard shortcut for a nav item
 */
export function getShortcut(key: string): string[] | undefined {
  return NAV_SHORTCUTS[key]
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string[]): string {
  return shortcut.map(k => k.toUpperCase()).join(' then ')
}

// =====================================================
// ROLE-BASED VISIBILITY
// =====================================================

/**
 * Items that require specific roles
 */
export const ROLE_RESTRICTED_ITEMS: Record<string, string[]> = {
  workflows: ['owner', 'admin'],
}

/**
 * Check if user can see a nav item based on role
 * Works with both SerializableNavItem and NavItem
 */
export function canSeeNavItem(
  item: SerializableNavItem,
  userRole: string | null
): boolean {
  // If no role restrictions, everyone can see
  if (!item.visibleToRoles || item.visibleToRoles.length === 0) {
    // Check hardcoded restrictions for known items
    const restriction = ROLE_RESTRICTED_ITEMS[item.key]
    if (restriction && userRole) {
      return restriction.includes(userRole)
    }
    return true
  }

  // Check if user's role is in the allowed list
  return userRole !== null && item.visibleToRoles.includes(userRole)
}

/**
 * Filter nav items by user role
 * Generic to work with both SerializableNavItem and NavItem
 */
export function filterByRole<T extends SerializableNavItem>(
  items: T[],
  userRole: string | null
): T[] {
  return items.filter(item => canSeeNavItem(item, userRole))
}

// =====================================================
// FALLBACK CONFIGURATION
// =====================================================

/**
 * Serializable fallback navigation config data (without React components)
 * Used for server-side fallback when database is unavailable
 * Icon components are added client-side using getIconComponent()
 */
export const FALLBACK_NAV_DATA = {
  primaryTabs: [
    {
      id: 'accounts',
      type: 'object' as const,
      key: 'Account',
      label: 'Accounts',
      pluralLabel: 'Accounts',
      href: '/admin/accounts',
      icon: 'building-2',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'contacts',
      type: 'object' as const,
      key: 'Contact',
      label: 'Contacts',
      pluralLabel: 'Contacts',
      href: '/admin/contacts',
      icon: 'users',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'leads',
      type: 'object' as const,
      key: 'Lead',
      label: 'Leads',
      pluralLabel: 'Leads',
      href: '/admin/crm-leads',
      icon: 'user-plus',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'opportunities',
      type: 'object' as const,
      key: 'Opportunity',
      label: 'Opportunities',
      pluralLabel: 'Opportunities',
      href: '/admin/opportunities',
      icon: 'target',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'activities',
      type: 'object' as const,
      key: 'Activity',
      label: 'Activities',
      pluralLabel: 'Activities',
      href: '/admin/activities',
      icon: 'activity',
      isCustomObject: false,
      visibleToRoles: null,
    },
  ],
  toolsMenu: [
    {
      id: 'messages',
      type: 'tool' as const,
      key: 'messages',
      label: 'Messages',
      pluralLabel: 'Messages',
      href: '/admin/messages',
      icon: 'message-square',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'reports',
      type: 'tool' as const,
      key: 'reports',
      label: 'Reports',
      pluralLabel: 'Reports',
      href: '/admin/reports',
      icon: 'bar-chart-3',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'dashboards',
      type: 'tool' as const,
      key: 'dashboards',
      label: 'Dashboards',
      pluralLabel: 'Dashboards',
      href: '/admin/dashboards',
      icon: 'layout-dashboard',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'workflows',
      type: 'tool' as const,
      key: 'workflows',
      label: 'Workflows',
      pluralLabel: 'Workflows',
      href: '/admin/workflows',
      icon: 'workflow',
      isCustomObject: false,
      visibleToRoles: ['owner', 'admin'] as string[],
    },
  ],
  adminMenu: [
    {
      id: 'team',
      type: 'tool' as const,
      key: 'team',
      label: 'Team',
      pluralLabel: 'Team',
      href: '/admin/team',
      icon: 'users-2',
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'setup',
      type: 'tool' as const,
      key: 'setup',
      label: 'Setup',
      pluralLabel: 'Setup',
      href: '/admin/setup',
      icon: 'settings',
      isCustomObject: false,
      visibleToRoles: null,
    },
  ],
  brandName: 'Admin Portal',
  brandLogoUrl: null,
  unreadMessages: 0,
}

/**
 * Helper to add icon components to serializable nav data
 * Call this on the client side after receiving data from server
 */
export function addIconComponents(
  items: Array<Omit<NavItem, 'iconComponent'>>
): NavItem[] {
  return items.map(item => ({
    ...item,
    iconComponent: getIconComponent(item.icon),
  }))
}

/**
 * Complete fallback config with icon components (for client-side use only)
 * DO NOT pass this through server actions - it contains non-serializable React components
 */
export const FALLBACK_NAV_CONFIG: NavigationConfig = {
  primaryTabs: addIconComponents(FALLBACK_NAV_DATA.primaryTabs),
  toolsMenu: addIconComponents(FALLBACK_NAV_DATA.toolsMenu),
  adminMenu: addIconComponents(FALLBACK_NAV_DATA.adminMenu),
  brandName: FALLBACK_NAV_DATA.brandName,
  brandLogoUrl: FALLBACK_NAV_DATA.brandLogoUrl,
  unreadMessages: FALLBACK_NAV_DATA.unreadMessages,
}
