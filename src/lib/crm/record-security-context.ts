/**
 * Record Security Context Utilities
 *
 * Server-side utilities for computing the security context of a CRM record.
 * This determines what the current user can see and do with a record.
 */

import { createClient } from '@/lib/supabase/server'
import {
  getUserSecurityContext,
  getAccessibleFieldsForObject,
} from '@/app/actions/field-security'
import { checkRecordAccess } from '@/app/actions/sharing-rules'
import type { FieldDefinition } from './types'

// =====================================================
// TYPES
// =====================================================

export interface RecordSecurityContext {
  /** Current user's ID */
  userId: string
  /** Whether user is the record owner */
  isOwner: boolean
  /** Whether user can edit this record (from record-level security) */
  canEdit: boolean
  /** Whether user can delete this record */
  canDelete: boolean
  /** Whether user can manage sharing for this record */
  canManageSharing: boolean
  /** Set of field IDs the user can see (from field-level security) */
  visibleFieldIds: Set<string>
  /** Set of field IDs the user can edit (from field-level security) */
  editableFieldIds: Set<string>
  /** Whether security has been fully loaded */
  isLoaded: boolean
}

export interface RecordContext {
  objectApiName: string
  recordId: string
  ownerId: string | null
}

// =====================================================
// MAIN FUNCTION
// =====================================================

/**
 * Compute the full security context for a record.
 *
 * This function combines:
 * 1. Field-level security (which fields can be seen/edited)
 * 2. Record-level security (can user access this specific record)
 * 3. Ownership context (is user the owner)
 */
export async function getRecordSecurityContext(
  recordContext: RecordContext
): Promise<RecordSecurityContext> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return createEmptySecurityContext()
    }

    // Fetch all security information in parallel
    const [fieldSecurityResult, userSecurityResult, , writeAccessResult] =
      await Promise.all([
        getAccessibleFieldsForObject(recordContext.objectApiName),
        getUserSecurityContext(),
        checkRecordAccess(
          recordContext.objectApiName,
          recordContext.recordId,
          recordContext.ownerId || '',
          'read'
        ),
        checkRecordAccess(
          recordContext.objectApiName,
          recordContext.recordId,
          recordContext.ownerId || '',
          'write'
        ),
      ])

    // Determine ownership
    const isOwner =
      recordContext.ownerId !== null && recordContext.ownerId === authUser.id
    const isAdmin = userSecurityResult.data?.isAdmin ?? false

    // Build visible/editable field sets from field-level security
    let visibleFieldIds = new Set<string>()
    let editableFieldIds = new Set<string>()

    if (fieldSecurityResult.data) {
      visibleFieldIds = new Set(
        fieldSecurityResult.data.visibleFields.map(f => f.id)
      )
      editableFieldIds = fieldSecurityResult.data.editableFieldIds
    }

    // Determine record-level permissions
    // Admin always has full access
    // Owner always has full access
    // Otherwise, check sharing rules
    const canEdit = isAdmin || isOwner || writeAccessResult.hasAccess
    const canDelete = isAdmin || isOwner // Only owner or admin can delete
    const canManageSharing = isAdmin || isOwner // Only owner or admin can manage sharing

    return {
      userId: authUser.id,
      isOwner,
      canEdit,
      canDelete,
      canManageSharing,
      visibleFieldIds,
      editableFieldIds,
      isLoaded: true,
    }
  } catch (error) {
    console.error('Error computing record security context:', error)
    return createEmptySecurityContext()
  }
}

/**
 * Create an empty/default security context for unauthenticated users
 * or when security cannot be computed.
 */
function createEmptySecurityContext(): RecordSecurityContext {
  return {
    userId: '',
    isOwner: false,
    canEdit: false,
    canDelete: false,
    canManageSharing: false,
    visibleFieldIds: new Set<string>(),
    editableFieldIds: new Set<string>(),
    isLoaded: false,
  }
}

/**
 * Create a full-access security context (for admin users or fallback).
 * This grants visibility and editability to all provided fields.
 */
export function createFullAccessContext(
  userId: string,
  fields: FieldDefinition[],
  isOwner: boolean = false
): RecordSecurityContext {
  const fieldIds = fields.map(f => f.id)
  return {
    userId,
    isOwner,
    canEdit: true,
    canDelete: true,
    canManageSharing: true,
    visibleFieldIds: new Set(fieldIds),
    editableFieldIds: new Set(fieldIds),
    isLoaded: true,
  }
}

/**
 * Serialize security context for client-side use.
 * Sets are converted to arrays for JSON serialization.
 */
export function serializeSecurityContext(
  context: RecordSecurityContext
): SerializedSecurityContext {
  return {
    userId: context.userId,
    isOwner: context.isOwner,
    canEdit: context.canEdit,
    canDelete: context.canDelete,
    canManageSharing: context.canManageSharing,
    visibleFieldIds: Array.from(context.visibleFieldIds),
    editableFieldIds: Array.from(context.editableFieldIds),
    isLoaded: context.isLoaded,
  }
}

/**
 * Deserialize security context from serialized form.
 */
export function deserializeSecurityContext(
  serialized: SerializedSecurityContext
): RecordSecurityContext {
  return {
    userId: serialized.userId,
    isOwner: serialized.isOwner,
    canEdit: serialized.canEdit,
    canDelete: serialized.canDelete,
    canManageSharing: serialized.canManageSharing,
    visibleFieldIds: new Set(serialized.visibleFieldIds),
    editableFieldIds: new Set(serialized.editableFieldIds),
    isLoaded: serialized.isLoaded,
  }
}

export interface SerializedSecurityContext {
  userId: string
  isOwner: boolean
  canEdit: boolean
  canDelete: boolean
  canManageSharing: boolean
  visibleFieldIds: string[]
  editableFieldIds: string[]
  isLoaded: boolean
}
