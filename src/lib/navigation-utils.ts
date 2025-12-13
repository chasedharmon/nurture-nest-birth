/**
 * Navigation Utilities
 *
 * This module provides utilities for navigation state management,
 * including query parameter preservation for list views.
 */

// =====================================================
// CONSTANTS
// =====================================================

const LIST_VIEW_STATE_KEY = 'admin_list_view_state'
const STATE_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

// =====================================================
// TYPES
// =====================================================

interface ListViewState {
  params: string // URLSearchParams as string
  timestamp: number
}

interface StoredStates {
  [path: string]: ListViewState
}

// =====================================================
// LIST VIEW PARAMS
// =====================================================

/**
 * List view paths that should have their params preserved
 */
const LIST_VIEW_PATHS = [
  '/admin/accounts',
  '/admin/contacts',
  '/admin/crm-leads',
  '/admin/leads',
  '/admin/opportunities',
  '/admin/activities',
  '/admin/messages',
  '/admin/reports',
  '/admin/dashboards',
  '/admin/workflows',
  '/admin/team',
]

/**
 * Check if a path is a list view path
 */
export function isListViewPath(path: string): boolean {
  // Exact match for base list paths
  if (LIST_VIEW_PATHS.includes(path)) {
    return true
  }

  // Custom objects: /admin/objects/{apiName}
  if (/^\/admin\/objects\/[^/]+$/.test(path)) {
    return true
  }

  return false
}

/**
 * Get the list view path for a given path
 * Returns the base list path if the current path is a detail/child page
 */
export function getListViewPath(path: string): string | null {
  // Check if already a list view path
  if (isListViewPath(path)) {
    return path
  }

  // Check standard object patterns: /admin/{object}/{id}
  for (const listPath of LIST_VIEW_PATHS) {
    if (path.startsWith(`${listPath}/`)) {
      return listPath
    }
  }

  // Check custom object pattern: /admin/objects/{apiName}/{id}
  const customMatch = path.match(/^(\/admin\/objects\/[^/]+)\//)
  if (customMatch && customMatch[1]) {
    return customMatch[1]
  }

  return null
}

// =====================================================
// SESSION STORAGE HELPERS
// =====================================================

/**
 * Get stored list view states from sessionStorage
 */
function getStoredStates(): StoredStates {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = sessionStorage.getItem(LIST_VIEW_STATE_KEY)
    if (!stored) return {}
    return JSON.parse(stored) as StoredStates
  } catch {
    return {}
  }
}

/**
 * Save list view states to sessionStorage
 */
function saveStoredStates(states: StoredStates): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.setItem(LIST_VIEW_STATE_KEY, JSON.stringify(states))
  } catch {
    // sessionStorage might be full or disabled
    console.warn('Failed to save list view state to sessionStorage')
  }
}

/**
 * Clean up expired states
 */
function cleanExpiredStates(states: StoredStates): StoredStates {
  const now = Date.now()
  const cleaned: StoredStates = {}

  for (const [path, state] of Object.entries(states)) {
    if (now - state.timestamp < STATE_EXPIRY_MS) {
      cleaned[path] = state
    }
  }

  return cleaned
}

// =====================================================
// PUBLIC API
// =====================================================

/**
 * Save list view params for a path
 * Call this when search/filter/sort changes on a list view
 */
export function saveListViewParams(
  path: string,
  params: URLSearchParams
): void {
  if (!isListViewPath(path)) {
    return
  }

  const states = cleanExpiredStates(getStoredStates())

  // Don't save empty params
  const paramsString = params.toString()
  if (!paramsString) {
    // Remove existing state if params are cleared
    delete states[path]
  } else {
    states[path] = {
      params: paramsString,
      timestamp: Date.now(),
    }
  }

  saveStoredStates(states)
}

/**
 * Get preserved params for a list view path
 * Returns null if no params are stored or they've expired
 */
export function getPreservedParams(path: string): URLSearchParams | null {
  if (!isListViewPath(path)) {
    return null
  }

  const states = getStoredStates()
  const state = states[path]

  if (!state) {
    return null
  }

  // Check expiry
  if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
    // Clean up expired state
    const cleaned = cleanExpiredStates(states)
    saveStoredStates(cleaned)
    return null
  }

  return new URLSearchParams(state.params)
}

/**
 * Clear preserved params for a path
 */
export function clearPreservedParams(path: string): void {
  const states = getStoredStates()
  delete states[path]
  saveStoredStates(states)
}

/**
 * Clear all preserved params
 */
export function clearAllPreservedParams(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(LIST_VIEW_STATE_KEY)
  }
}

/**
 * Build a URL with preserved params
 * Used when navigating back to a list view
 */
export function buildUrlWithPreservedParams(path: string): string {
  const preserved = getPreservedParams(path)

  if (preserved && preserved.toString()) {
    return `${path}?${preserved.toString()}`
  }

  return path
}

/**
 * Merge current params with preserved params
 * Current params take precedence
 */
export function mergeWithPreservedParams(
  path: string,
  currentParams: URLSearchParams
): URLSearchParams {
  const preserved = getPreservedParams(path)

  if (!preserved) {
    return currentParams
  }

  // Start with preserved params
  const merged = new URLSearchParams(preserved)

  // Override with current params
  for (const [key, value] of currentParams.entries()) {
    merged.set(key, value)
  }

  return merged
}

// =====================================================
// NAVIGATION HISTORY
// =====================================================

const NAV_HISTORY_KEY = 'admin_nav_history'
const MAX_HISTORY_LENGTH = 10

interface NavHistoryEntry {
  path: string
  label: string
  timestamp: number
}

/**
 * Get navigation history
 */
export function getNavHistory(): NavHistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = sessionStorage.getItem(NAV_HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored) as NavHistoryEntry[]
  } catch {
    return []
  }
}

/**
 * Add entry to navigation history
 */
export function addToNavHistory(path: string, label: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const history = getNavHistory()

  // Remove existing entry for this path
  const filtered = history.filter(entry => entry.path !== path)

  // Add new entry at the beginning
  filtered.unshift({
    path,
    label,
    timestamp: Date.now(),
  })

  // Trim to max length
  const trimmed = filtered.slice(0, MAX_HISTORY_LENGTH)

  try {
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore errors
  }
}

/**
 * Clear navigation history
 */
export function clearNavHistory(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(NAV_HISTORY_KEY)
  }
}

// =====================================================
// URL UTILITIES
// =====================================================

/**
 * Remove specific params from a URLSearchParams
 */
export function removeParams(
  params: URLSearchParams,
  keysToRemove: string[]
): URLSearchParams {
  const result = new URLSearchParams(params)
  for (const key of keysToRemove) {
    result.delete(key)
  }
  return result
}

/**
 * Get only specific params from a URLSearchParams
 */
export function pickParams(
  params: URLSearchParams,
  keysToPick: string[]
): URLSearchParams {
  const result = new URLSearchParams()
  for (const key of keysToPick) {
    const value = params.get(key)
    if (value !== null) {
      result.set(key, value)
    }
  }
  return result
}

/**
 * Common list view param keys
 */
export const LIST_VIEW_PARAM_KEYS = [
  'q', // Search query
  'page', // Pagination
  'pageSize', // Page size
  'sort', // Sort field
  'dir', // Sort direction
  'status', // Status filter
  'type', // Type filter
  'stage', // Stage filter (opportunities)
  'owner', // Owner filter
  'dateFrom', // Date range start
  'dateTo', // Date range end
]

/**
 * Get list view params only from URLSearchParams
 */
export function getListViewParams(params: URLSearchParams): URLSearchParams {
  return pickParams(params, LIST_VIEW_PARAM_KEYS)
}
