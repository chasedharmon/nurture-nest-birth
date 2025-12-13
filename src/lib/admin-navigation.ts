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
 * Processed navigation item for UI
 */
export interface NavItem {
  id: string
  type: NavItemType
  key: string // object api_name or item_key
  label: string
  pluralLabel: string
  href: string
  icon: string
  iconComponent?: LucideIcon
  badge?: number
  isCustomObject: boolean
  visibleToRoles: string[] | null
}

/**
 * Complete navigation configuration
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
 * Transform database nav item to UI nav item
 */
export function transformNavItem(dbItem: DbNavItem): NavItem {
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
    iconComponent: getIconComponent(dbItem.icon_name),
    isCustomObject: dbItem.is_custom_object,
    visibleToRoles: dbItem.visible_to_roles,
  }
}

/**
 * Transform array of database items to categorized navigation config
 */
export function transformNavItems(dbItems: DbNavItem[]): {
  primaryTabs: NavItem[]
  toolsMenu: NavItem[]
  adminMenu: NavItem[]
} {
  const primaryTabs: NavItem[] = []
  const toolsMenu: NavItem[] = []
  const adminMenu: NavItem[] = []

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
 */
export function canSeeNavItem(item: NavItem, userRole: string | null): boolean {
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
 */
export function filterByRole(
  items: NavItem[],
  userRole: string | null
): NavItem[] {
  return items.filter(item => canSeeNavItem(item, userRole))
}

// =====================================================
// FALLBACK CONFIGURATION
// =====================================================

/**
 * Fallback navigation config if database query fails
 * This ensures the app remains usable even without DB connection
 */
export const FALLBACK_NAV_CONFIG: NavigationConfig = {
  primaryTabs: [
    {
      id: 'accounts',
      type: 'object',
      key: 'Account',
      label: 'Accounts',
      pluralLabel: 'Accounts',
      href: '/admin/accounts',
      icon: 'building-2',
      iconComponent: Building2,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'contacts',
      type: 'object',
      key: 'Contact',
      label: 'Contacts',
      pluralLabel: 'Contacts',
      href: '/admin/contacts',
      icon: 'users',
      iconComponent: Users,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'leads',
      type: 'object',
      key: 'Lead',
      label: 'Leads',
      pluralLabel: 'Leads',
      href: '/admin/crm-leads',
      icon: 'user-plus',
      iconComponent: UserPlus,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'opportunities',
      type: 'object',
      key: 'Opportunity',
      label: 'Opportunities',
      pluralLabel: 'Opportunities',
      href: '/admin/opportunities',
      icon: 'target',
      iconComponent: Target,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'activities',
      type: 'object',
      key: 'Activity',
      label: 'Activities',
      pluralLabel: 'Activities',
      href: '/admin/activities',
      icon: 'activity',
      iconComponent: Activity,
      isCustomObject: false,
      visibleToRoles: null,
    },
  ],
  toolsMenu: [
    {
      id: 'messages',
      type: 'tool',
      key: 'messages',
      label: 'Messages',
      pluralLabel: 'Messages',
      href: '/admin/messages',
      icon: 'message-square',
      iconComponent: MessageSquare,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'reports',
      type: 'tool',
      key: 'reports',
      label: 'Reports',
      pluralLabel: 'Reports',
      href: '/admin/reports',
      icon: 'bar-chart-3',
      iconComponent: BarChart3,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'dashboards',
      type: 'tool',
      key: 'dashboards',
      label: 'Dashboards',
      pluralLabel: 'Dashboards',
      href: '/admin/dashboards',
      icon: 'layout-dashboard',
      iconComponent: LayoutDashboard,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'workflows',
      type: 'tool',
      key: 'workflows',
      label: 'Workflows',
      pluralLabel: 'Workflows',
      href: '/admin/workflows',
      icon: 'workflow',
      iconComponent: Workflow,
      isCustomObject: false,
      visibleToRoles: ['owner', 'admin'],
    },
  ],
  adminMenu: [
    {
      id: 'team',
      type: 'tool',
      key: 'team',
      label: 'Team',
      pluralLabel: 'Team',
      href: '/admin/team',
      icon: 'users-2',
      iconComponent: Users2,
      isCustomObject: false,
      visibleToRoles: null,
    },
    {
      id: 'setup',
      type: 'tool',
      key: 'setup',
      label: 'Setup',
      pluralLabel: 'Setup',
      href: '/admin/setup',
      icon: 'settings',
      iconComponent: Settings,
      isCustomObject: false,
      visibleToRoles: null,
    },
  ],
  brandName: 'Admin Portal',
  brandLogoUrl: null,
  unreadMessages: 0,
}
