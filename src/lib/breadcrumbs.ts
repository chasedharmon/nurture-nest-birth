/**
 * Breadcrumb Configuration and Utilities
 *
 * This module provides breadcrumb configuration and utilities for building
 * dynamic breadcrumb trails in the admin portal.
 */

// =====================================================
// TYPES
// =====================================================

/**
 * Breadcrumb item for display
 */
export interface BreadcrumbItem {
  label: string
  href: string
  isLoading?: boolean
  isCurrent?: boolean
}

/**
 * Parameters extracted from a path
 */
export interface PathParams {
  id?: string
  apiName?: string
  [key: string]: string | undefined
}

/**
 * Breadcrumb definition
 */
export interface BreadcrumbDef {
  label: string | ((params: PathParams) => string | Promise<string>)
  parent?: string
}

// =====================================================
// BREADCRUMB CONFIGURATION
// =====================================================

/**
 * Static breadcrumb configuration
 * Maps path patterns to breadcrumb definitions
 */
export const breadcrumbConfig: Record<string, BreadcrumbDef> = {
  // Dashboard
  '/admin': { label: 'Dashboard' },

  // Standard Objects - List Views
  '/admin/accounts': { label: 'Accounts', parent: '/admin' },
  '/admin/contacts': { label: 'Contacts', parent: '/admin' },
  '/admin/crm-leads': { label: 'Leads', parent: '/admin' },
  '/admin/leads': { label: 'Leads', parent: '/admin' }, // Legacy path
  '/admin/opportunities': { label: 'Opportunities', parent: '/admin' },
  '/admin/activities': { label: 'Activities', parent: '/admin' },

  // Standard Objects - New Record
  '/admin/accounts/new': { label: 'New Account', parent: '/admin/accounts' },
  '/admin/contacts/new': { label: 'New Contact', parent: '/admin/contacts' },
  '/admin/crm-leads/new': { label: 'New Lead', parent: '/admin/crm-leads' },
  '/admin/opportunities/new': {
    label: 'New Opportunity',
    parent: '/admin/opportunities',
  },
  '/admin/activities/new': {
    label: 'New Activity',
    parent: '/admin/activities',
  },

  // Tools
  '/admin/messages': { label: 'Messages', parent: '/admin' },
  '/admin/reports': { label: 'Reports', parent: '/admin' },
  '/admin/reports/new': { label: 'New Report', parent: '/admin/reports' },
  '/admin/dashboards': { label: 'Dashboards', parent: '/admin' },
  '/admin/dashboards/new': {
    label: 'New Dashboard',
    parent: '/admin/dashboards',
  },
  '/admin/workflows': { label: 'Workflows', parent: '/admin' },
  '/admin/workflows/new': { label: 'New Workflow', parent: '/admin/workflows' },
  '/admin/workflows/templates': {
    label: 'Templates',
    parent: '/admin/workflows',
  },

  // Admin
  '/admin/team': { label: 'Team', parent: '/admin' },
  '/admin/setup': { label: 'Setup', parent: '/admin' },

  // Setup Sub-pages
  '/admin/setup/users': { label: 'Users', parent: '/admin/setup' },
  '/admin/setup/roles': { label: 'Roles', parent: '/admin/setup' },
  '/admin/setup/permissions': { label: 'Permissions', parent: '/admin/setup' },
  '/admin/setup/company': { label: 'Company Profile', parent: '/admin/setup' },
  '/admin/setup/contracts': { label: 'Contracts', parent: '/admin/setup' },
  '/admin/setup/services': { label: 'Services', parent: '/admin/setup' },
  '/admin/setup/intake-forms': {
    label: 'Intake Forms',
    parent: '/admin/setup',
  },
  '/admin/setup/email-templates': {
    label: 'Email Templates',
    parent: '/admin/setup',
  },
  '/admin/setup/sms-templates': {
    label: 'SMS Templates',
    parent: '/admin/setup',
  },
  '/admin/setup/welcome-packets': {
    label: 'Welcome Packets',
    parent: '/admin/setup',
  },
  '/admin/setup/integrations': {
    label: 'Integrations',
    parent: '/admin/setup',
  },
  '/admin/setup/api-keys': { label: 'API Keys', parent: '/admin/setup' },
  '/admin/setup/webhooks': { label: 'Webhooks', parent: '/admin/setup' },
  '/admin/setup/objects': { label: 'Objects', parent: '/admin/setup' },
  '/admin/setup/navigation': { label: 'Navigation', parent: '/admin/setup' },
  '/admin/setup/migration': { label: 'Data Migration', parent: '/admin/setup' },
  '/admin/setup/audit-logs': { label: 'Audit Logs', parent: '/admin/setup' },
  '/admin/setup/organization': {
    label: 'Organization',
    parent: '/admin/setup',
  },
  '/admin/setup/billing': { label: 'Billing', parent: '/admin/setup' },
}

// =====================================================
// PATH MATCHING
// =====================================================

/**
 * Match a pathname against the breadcrumb config
 * Returns the config entry and extracted params
 */
export function matchPath(pathname: string): {
  config: BreadcrumbDef | null
  params: PathParams
  pattern: string | null
} {
  // First, check for exact match
  if (breadcrumbConfig[pathname]) {
    return {
      config: breadcrumbConfig[pathname],
      params: {},
      pattern: pathname,
    }
  }

  // Check for dynamic patterns
  const parts = pathname.split('/').filter(Boolean)
  const params: PathParams = {}

  // Pattern: /admin/{object}/[id]
  if (parts.length === 3 && parts[0] === 'admin') {
    const objectPath = `/${parts[0]}/${parts[1]}`
    if (breadcrumbConfig[objectPath]) {
      params.id = parts[2]
      return {
        config: {
          label: 'Loading...', // Will be resolved async
          parent: objectPath,
        },
        params,
        pattern: `${objectPath}/[id]`,
      }
    }
  }

  // Pattern: /admin/{object}/[id]/edit
  if (parts.length === 4 && parts[0] === 'admin' && parts[3] === 'edit') {
    const objectPath = `/${parts[0]}/${parts[1]}`
    if (breadcrumbConfig[objectPath]) {
      params.id = parts[2]
      return {
        config: {
          label: 'Edit',
          parent: `${objectPath}/${parts[2]}`,
        },
        params,
        pattern: `${objectPath}/[id]/edit`,
      }
    }
  }

  // Pattern: /admin/{object}/[id]/convert (for leads)
  if (parts.length === 4 && parts[0] === 'admin' && parts[3] === 'convert') {
    const objectPath = `/${parts[0]}/${parts[1]}`
    if (breadcrumbConfig[objectPath]) {
      params.id = parts[2]
      return {
        config: {
          label: 'Convert',
          parent: `${objectPath}/${parts[2]}`,
        },
        params,
        pattern: `${objectPath}/[id]/convert`,
      }
    }
  }

  // Pattern: /admin/objects/[apiName] (custom objects)
  if (
    parts.length === 3 &&
    parts[0] === 'admin' &&
    parts[1] === 'objects' &&
    parts[2]
  ) {
    params.apiName = parts[2]
    return {
      config: {
        label: parts[2], // Will be resolved to object label
        parent: '/admin',
      },
      params,
      pattern: '/admin/objects/[apiName]',
    }
  }

  // Pattern: /admin/objects/[apiName]/new
  if (
    parts.length === 4 &&
    parts[0] === 'admin' &&
    parts[1] === 'objects' &&
    parts[2] &&
    parts[3] === 'new'
  ) {
    params.apiName = parts[2]
    return {
      config: {
        label: 'New Record',
        parent: `/admin/objects/${parts[2]}`,
      },
      params,
      pattern: '/admin/objects/[apiName]/new',
    }
  }

  // Pattern: /admin/objects/[apiName]/[id]
  if (
    parts.length === 4 &&
    parts[0] === 'admin' &&
    parts[1] === 'objects' &&
    parts[2] &&
    parts[3]
  ) {
    params.apiName = parts[2]
    params.id = parts[3]
    return {
      config: {
        label: 'Loading...',
        parent: `/admin/objects/${parts[2]}`,
      },
      params,
      pattern: '/admin/objects/[apiName]/[id]',
    }
  }

  // Pattern: /admin/messages/[id]
  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'messages') {
    params.id = parts[2]
    return {
      config: {
        label: 'Conversation',
        parent: '/admin/messages',
      },
      params,
      pattern: '/admin/messages/[id]',
    }
  }

  // Pattern: /admin/reports/[id]
  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'reports') {
    params.id = parts[2]
    return {
      config: {
        label: 'Report',
        parent: '/admin/reports',
      },
      params,
      pattern: '/admin/reports/[id]',
    }
  }

  // Pattern: /admin/reports/[id]/edit
  if (
    parts.length === 4 &&
    parts[0] === 'admin' &&
    parts[1] === 'reports' &&
    parts[3] === 'edit'
  ) {
    params.id = parts[2]
    return {
      config: {
        label: 'Edit',
        parent: `/admin/reports/${parts[2]}`,
      },
      params,
      pattern: '/admin/reports/[id]/edit',
    }
  }

  // Pattern: /admin/dashboards/[id]
  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'dashboards') {
    params.id = parts[2]
    return {
      config: {
        label: 'Dashboard',
        parent: '/admin/dashboards',
      },
      params,
      pattern: '/admin/dashboards/[id]',
    }
  }

  // Pattern: /admin/dashboards/[id]/edit
  if (
    parts.length === 4 &&
    parts[0] === 'admin' &&
    parts[1] === 'dashboards' &&
    parts[3] === 'edit'
  ) {
    params.id = parts[2]
    return {
      config: {
        label: 'Edit',
        parent: `/admin/dashboards/${parts[2]}`,
      },
      params,
      pattern: '/admin/dashboards/[id]/edit',
    }
  }

  // Pattern: /admin/workflows/[id]
  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'workflows') {
    params.id = parts[2]
    return {
      config: {
        label: 'Workflow',
        parent: '/admin/workflows',
      },
      params,
      pattern: '/admin/workflows/[id]',
    }
  }

  // Pattern: /admin/workflows/[id]/{history,analytics,settings}
  if (
    parts.length === 4 &&
    parts[0] === 'admin' &&
    parts[1] === 'workflows' &&
    parts[2] &&
    parts[3]
  ) {
    params.id = parts[2]
    const subPage = parts[3]
    const labels: Record<string, string> = {
      history: 'History',
      analytics: 'Analytics',
      settings: 'Settings',
    }
    return {
      config: {
        label: labels[subPage] || subPage,
        parent: `/admin/workflows/${parts[2]}`,
      },
      params,
      pattern: `/admin/workflows/[id]/${subPage}`,
    }
  }

  // Pattern: /admin/team/[id]
  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'team') {
    params.id = parts[2]
    return {
      config: {
        label: 'Team Member',
        parent: '/admin/team',
      },
      params,
      pattern: '/admin/team/[id]',
    }
  }

  // Pattern: /admin/setup/{section}/[id]
  if (parts.length === 4 && parts[0] === 'admin' && parts[1] === 'setup') {
    const setupPath = `/admin/setup/${parts[2]}`
    if (breadcrumbConfig[setupPath]) {
      params.id = parts[3]
      return {
        config: {
          label: 'Details',
          parent: setupPath,
        },
        params,
        pattern: `${setupPath}/[id]`,
      }
    }
  }

  // No match found
  return {
    config: null,
    params: {},
    pattern: null,
  }
}

// =====================================================
// BREADCRUMB TRAIL BUILDING
// =====================================================

/**
 * Build a breadcrumb trail for a pathname
 * Returns an array of breadcrumb items from root to current
 */
export function buildBreadcrumbTrail(pathname: string): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = []
  let currentPath: string | null = pathname

  while (currentPath) {
    const match = matchPath(currentPath)

    if (!match.config) {
      // No config for this path, stop
      break
    }

    // Get label (might be a function)
    let label: string
    if (typeof match.config.label === 'function') {
      // For async labels, we'll set a placeholder
      // The component should resolve these
      label = 'Loading...'
    } else {
      label = match.config.label
    }

    trail.unshift({
      label,
      href: currentPath,
      isCurrent: currentPath === pathname,
    })

    // Move to parent
    currentPath = match.config.parent || null
  }

  return trail
}

/**
 * Get the parent path for a given pathname
 */
export function getParentPath(pathname: string): string | null {
  const match = matchPath(pathname)
  return match.config?.parent || null
}

/**
 * Check if a path has a parent (not the root)
 */
export function hasParent(pathname: string): boolean {
  return getParentPath(pathname) !== null
}

// =====================================================
// LABEL RESOLUTION
// =====================================================

/**
 * Object label mapping for standard objects
 */
const OBJECT_LABELS: Record<string, { singular: string; plural: string }> = {
  Account: { singular: 'Account', plural: 'Accounts' },
  Contact: { singular: 'Contact', plural: 'Contacts' },
  Lead: { singular: 'Lead', plural: 'Leads' },
  Opportunity: { singular: 'Opportunity', plural: 'Opportunities' },
  Activity: { singular: 'Activity', plural: 'Activities' },
}

/**
 * Get object label (sync version for known objects)
 */
export function getObjectLabelSync(
  apiName: string,
  type: 'singular' | 'plural' = 'singular'
): string {
  const labels = OBJECT_LABELS[apiName]
  if (labels) {
    return type === 'plural' ? labels.plural : labels.singular
  }
  // Fallback: use API name
  return apiName
}

/**
 * Build href with preserved query params
 * Used for breadcrumb links to restore list filters
 */
export function buildHrefWithParams(
  href: string,
  preservedParams?: URLSearchParams
): string {
  if (!preservedParams || preservedParams.toString() === '') {
    return href
  }
  return `${href}?${preservedParams.toString()}`
}
