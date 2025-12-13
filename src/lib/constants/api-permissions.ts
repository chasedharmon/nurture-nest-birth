/**
 * API Permission definitions
 *
 * These constants define the available permissions for API keys.
 */

export const API_PERMISSIONS = {
  leads: ['read', 'create', 'update', 'delete'],
  clients: ['read', 'create', 'update', 'delete'],
  appointments: ['read', 'create', 'update', 'delete'],
  documents: ['read', 'create', 'delete'],
  invoices: ['read', 'create', 'update'],
  messages: ['read', 'send'],
  reports: ['read'],
} as const

export type ApiPermissionResource = keyof typeof API_PERMISSIONS
export type ApiPermissionAction<T extends ApiPermissionResource> =
  (typeof API_PERMISSIONS)[T][number]
