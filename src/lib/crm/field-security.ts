/**
 * Field-Level Security Utilities
 *
 * This module provides utilities for checking and enforcing field-level
 * permissions in the CRM system. Field-level security controls which
 * fields users can see and edit based on their role.
 *
 * Key concepts:
 * - is_visible: Can the user see this field in forms/views?
 * - is_editable: Can the user modify this field's value?
 * - Default behavior: If no explicit permission exists, access is ALLOWED
 */

import type { FieldDefinition, FieldPermission } from './types'

// =====================================================
// TYPES
// =====================================================

export interface FieldAccessResult {
  fieldId: string
  apiName: string
  canRead: boolean
  canEdit: boolean
}

export interface FieldSecurityContext {
  userId: string
  roleId: string
  organizationId: string
}

export interface FilteredFieldsResult {
  /** Fields the user can read */
  visibleFields: FieldDefinition[]
  /** Field IDs mapped to their editability */
  editableFieldIds: Set<string>
  /** All field access results for reference */
  accessMap: Map<string, FieldAccessResult>
}

// =====================================================
// FIELD ACCESS CHECKING
// =====================================================

/**
 * Check if a user can access a specific field
 * Returns true if no explicit permission exists (default allow)
 */
export function checkFieldAccess(
  fieldId: string,
  _apiName: string, // Reserved for logging/debugging
  permissions: FieldPermission[],
  accessType: 'read' | 'write'
): boolean {
  const permission = permissions.find(p => p.field_definition_id === fieldId)

  // Default: allow access if no explicit permission exists
  if (!permission) {
    return true
  }

  return accessType === 'read' ? permission.is_visible : permission.is_editable
}

/**
 * Filter fields based on user's permissions
 * Returns only fields the user can read, with editability info
 */
export function filterFieldsByPermissions(
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): FilteredFieldsResult {
  const accessMap = new Map<string, FieldAccessResult>()
  const visibleFields: FieldDefinition[] = []
  const editableFieldIds = new Set<string>()

  // Create a quick lookup map for permissions
  const permissionMap = new Map(
    permissions.map(p => [p.field_definition_id, p])
  )

  for (const field of fields) {
    const permission = permissionMap.get(field.id)

    // Default: allow if no permission record exists
    const canRead = permission ? permission.is_visible : true
    const canEdit = permission ? permission.is_editable : true

    const accessResult: FieldAccessResult = {
      fieldId: field.id,
      apiName: field.api_name,
      canRead,
      canEdit,
    }

    accessMap.set(field.id, accessResult)

    if (canRead) {
      visibleFields.push(field)
      if (canEdit) {
        editableFieldIds.add(field.id)
      }
    }
  }

  return {
    visibleFields,
    editableFieldIds,
    accessMap,
  }
}

/**
 * Get all field access results for a set of fields
 */
export function getFieldAccessMap(
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): Map<string, FieldAccessResult> {
  const { accessMap } = filterFieldsByPermissions(fields, permissions)
  return accessMap
}

// =====================================================
// SENSITIVE FIELD HANDLING
// =====================================================

/**
 * Sensitive fields that should be restricted by default for non-admin roles
 * These fields contain PII or sensitive medical information
 */
export const SENSITIVE_FIELD_API_NAMES = [
  'medical_info',
  'birth_preferences',
  'emergency_contact',
  'ssn',
  'insurance_info',
  'payment_info',
] as const

/**
 * Check if a field is marked as sensitive
 */
export function isSensitiveField(field: FieldDefinition): boolean {
  return (
    field.is_sensitive ||
    SENSITIVE_FIELD_API_NAMES.includes(
      field.api_name as (typeof SENSITIVE_FIELD_API_NAMES)[number]
    )
  )
}

/**
 * Filter out sensitive fields for non-privileged roles
 * Use this as an additional security layer
 */
export function filterSensitiveFields(
  fields: FieldDefinition[],
  hasPrivilegedAccess: boolean
): FieldDefinition[] {
  if (hasPrivilegedAccess) {
    return fields
  }
  return fields.filter(f => !isSensitiveField(f))
}

// =====================================================
// PERMISSION MATRIX HELPERS
// =====================================================

export interface FieldPermissionMatrix {
  objectApiName: string
  roleId: string
  fields: {
    fieldId: string
    apiName: string
    label: string
    isVisible: boolean
    isEditable: boolean
    isStandard: boolean
    isSensitive: boolean
  }[]
}

/**
 * Build a permission matrix for UI display
 * Combines field definitions with current permissions
 */
export function buildPermissionMatrix(
  objectApiName: string,
  roleId: string,
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): FieldPermissionMatrix {
  const permissionMap = new Map(
    permissions.map(p => [p.field_definition_id, p])
  )

  return {
    objectApiName,
    roleId,
    fields: fields.map(field => {
      const permission = permissionMap.get(field.id)
      return {
        fieldId: field.id,
        apiName: field.api_name,
        label: field.label,
        // Default to true if no permission exists
        isVisible: permission?.is_visible ?? true,
        isEditable: permission?.is_editable ?? true,
        isStandard: field.is_standard,
        isSensitive: isSensitiveField(field),
      }
    }),
  }
}

// =====================================================
// DATA FILTERING (SERVER-SIDE)
// =====================================================

/**
 * Filter record data to remove fields the user cannot read
 * Use this on the server when returning record data
 */
export function filterRecordData<T extends Record<string, unknown>>(
  record: T,
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): Partial<T> {
  const { visibleFields } = filterFieldsByPermissions(fields, permissions)
  const visibleApiNames = new Set(visibleFields.map(f => f.api_name))
  const visibleColumnNames = new Set(
    visibleFields.map(f => f.column_name || f.api_name)
  )

  const filtered: Partial<T> = {}

  // Always include system fields
  const systemFields = [
    'id',
    'organization_id',
    'created_at',
    'updated_at',
    'owner_id',
  ]

  for (const [key, value] of Object.entries(record)) {
    if (
      systemFields.includes(key) ||
      visibleApiNames.has(key) ||
      visibleColumnNames.has(key)
    ) {
      ;(filtered as Record<string, unknown>)[key] = value
    }
  }

  // Handle custom_fields separately
  if (record.custom_fields && typeof record.custom_fields === 'object') {
    const customFields = record.custom_fields as Record<string, unknown>
    const filteredCustom: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(customFields)) {
      if (visibleApiNames.has(key)) {
        filteredCustom[key] = value
      }
    }

    ;(filtered as Record<string, unknown>).custom_fields = filteredCustom
  }

  return filtered
}

/**
 * Filter update data to remove fields the user cannot edit
 * Use this on the server before applying updates
 */
export function filterUpdateData<T extends Record<string, unknown>>(
  updates: T,
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): Partial<T> {
  const { editableFieldIds } = filterFieldsByPermissions(fields, permissions)

  // Build a map of column names to field IDs for lookup
  const columnToFieldId = new Map<string, string>()
  const apiNameToFieldId = new Map<string, string>()

  for (const field of fields) {
    apiNameToFieldId.set(field.api_name, field.id)
    if (field.column_name) {
      columnToFieldId.set(field.column_name, field.id)
    }
  }

  const filtered: Partial<T> = {}

  // Fields that should always be allowed (system updates)
  const alwaysAllowed = ['updated_at']

  for (const [key, value] of Object.entries(updates)) {
    const fieldId = columnToFieldId.get(key) || apiNameToFieldId.get(key)

    if (alwaysAllowed.includes(key)) {
      ;(filtered as Record<string, unknown>)[key] = value
    } else if (fieldId && editableFieldIds.has(fieldId)) {
      ;(filtered as Record<string, unknown>)[key] = value
    }
  }

  // Handle custom_fields separately
  if (updates.custom_fields && typeof updates.custom_fields === 'object') {
    const customFields = updates.custom_fields as Record<string, unknown>
    const filteredCustom: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(customFields)) {
      const fieldId = apiNameToFieldId.get(key)
      if (fieldId && editableFieldIds.has(fieldId)) {
        filteredCustom[key] = value
      }
    }

    ;(filtered as Record<string, unknown>).custom_fields = filteredCustom
  }

  return filtered
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate that a user has permission to edit specific fields
 * Returns list of fields they tried to edit but don't have permission for
 */
export function validateFieldEditPermissions(
  attemptedFields: string[],
  fields: FieldDefinition[],
  permissions: FieldPermission[]
): { valid: boolean; deniedFields: string[] } {
  const { editableFieldIds } = filterFieldsByPermissions(fields, permissions)

  // Build lookup maps
  const apiNameToFieldId = new Map<string, string>()
  const columnToFieldId = new Map<string, string>()

  for (const field of fields) {
    apiNameToFieldId.set(field.api_name, field.id)
    if (field.column_name) {
      columnToFieldId.set(field.column_name, field.id)
    }
  }

  const deniedFields: string[] = []

  for (const fieldKey of attemptedFields) {
    const fieldId =
      columnToFieldId.get(fieldKey) || apiNameToFieldId.get(fieldKey)
    if (fieldId && !editableFieldIds.has(fieldId)) {
      deniedFields.push(fieldKey)
    }
  }

  return {
    valid: deniedFields.length === 0,
    deniedFields,
  }
}
