// Permission system constants and types
// These are used for the roles & permissions UI in the Admin Setup Hub

export const PERMISSION_OBJECTS = [
  'leads',
  'clients',
  'invoices',
  'meetings',
  'documents',
  'reports',
  'dashboards',
  'settings',
  'team',
  'services',
  'contracts',
] as const

export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
] as const

export type PermissionObject = (typeof PERMISSION_OBJECTS)[number]
export type PermissionActionType = (typeof PERMISSION_ACTIONS)[number]

// Labels for display
export const PERMISSION_OBJECT_LABELS: Record<PermissionObject, string> = {
  leads: 'Leads',
  clients: 'Clients',
  invoices: 'Invoices',
  meetings: 'Meetings',
  documents: 'Documents',
  reports: 'Reports',
  dashboards: 'Dashboards',
  settings: 'Settings',
  team: 'Team',
  services: 'Services',
  contracts: 'Contracts',
}

export const PERMISSION_ACTION_LABELS: Record<PermissionActionType, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
}
