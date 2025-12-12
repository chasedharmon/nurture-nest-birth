/**
 * Record-Level Security Utilities
 *
 * This module provides utilities for checking and enforcing record-level
 * sharing in the CRM system. It implements Salesforce-style sharing:
 *
 * 1. Organization-Wide Defaults (OWD) - base access level for all users
 * 2. Role Hierarchy - managers see subordinates' records
 * 3. Sharing Rules - criteria-based automatic sharing
 * 4. Manual Sharing - ad-hoc sharing by record owner
 *
 * Key concepts:
 * - Owner always has full access
 * - Access is additive: multiple sources can grant access
 * - Higher privilege wins when sources conflict
 */

import type {
  SharingModel,
  RecordAccessLevel,
  AccessSource,
  SharingRule,
  SharingCriteria,
  SharingCriteriaCondition,
  ManualShare,
} from './types'

// =====================================================
// TYPES
// =====================================================

export interface RecordContext {
  recordId: string
  objectApiName: string
  ownerId: string | null
  organizationId: string
  fieldValues?: Record<string, unknown>
}

export interface UserContext {
  userId: string
  roleId: string | null
  organizationId: string
  hierarchyLevel: number | null
}

export interface SharingEvaluationResult {
  hasAccess: boolean
  accessLevel: RecordAccessLevel | null
  accessSource: AccessSource | null
  allAccessGrants: Array<{
    source: AccessSource
    level: RecordAccessLevel
    sourceId?: string
    sourceName?: string
  }>
}

// =====================================================
// ACCESS LEVEL UTILITIES
// =====================================================

/**
 * Compare two access levels. Higher privilege wins.
 * full_access > read_write > read
 */
export function compareAccessLevels(
  a: RecordAccessLevel | null,
  b: RecordAccessLevel | null
): RecordAccessLevel | null {
  const order: Record<RecordAccessLevel, number> = {
    read: 1,
    read_write: 2,
    full_access: 3,
  }

  const aScore = a ? order[a] : 0
  const bScore = b ? order[b] : 0

  if (aScore >= bScore) return a
  return b
}

/**
 * Check if access level satisfies required access
 */
export function satisfiesAccess(
  granted: RecordAccessLevel | null,
  required: 'read' | 'write'
): boolean {
  if (!granted) return false

  if (required === 'read') {
    return ['read', 'read_write', 'full_access'].includes(granted)
  }

  // Write access
  return ['read_write', 'full_access'].includes(granted)
}

/**
 * Convert sharing model to access level
 */
export function sharingModelToAccessLevel(
  model: SharingModel
): RecordAccessLevel | null {
  switch (model) {
    case 'full_access':
      return 'full_access'
    case 'read_write':
      return 'read_write'
    case 'read':
      return 'read'
    case 'private':
      return null
  }
}

// =====================================================
// CRITERIA EVALUATION
// =====================================================

/**
 * Evaluate a single condition against a record's field values
 */
export function evaluateCondition(
  condition: SharingCriteriaCondition,
  fieldValues: Record<string, unknown>
): boolean {
  const fieldValue = fieldValues[condition.field]
  const targetValue = condition.value

  switch (condition.operator) {
    case 'equals':
      return fieldValue === targetValue

    case 'not_equals':
      return fieldValue !== targetValue

    case 'contains':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue.toLowerCase().includes(targetValue.toLowerCase())
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(targetValue)
      }
      return false

    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return !fieldValue.toLowerCase().includes(targetValue.toLowerCase())
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(targetValue)
      }
      return true

    case 'starts_with':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue.toLowerCase().startsWith(targetValue.toLowerCase())
      }
      return false

    case 'greater_than':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue > targetValue
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue > targetValue
      }
      return false

    case 'less_than':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue < targetValue
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue < targetValue
      }
      return false

    case 'is_null':
      return fieldValue === null || fieldValue === undefined

    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined

    case 'in':
      if (Array.isArray(targetValue)) {
        return targetValue.includes(fieldValue)
      }
      return false

    default:
      return false
  }
}

/**
 * Evaluate all criteria conditions against a record
 */
export function evaluateCriteria(
  criteria: SharingCriteria,
  fieldValues: Record<string, unknown>
): boolean {
  if (!criteria.conditions || criteria.conditions.length === 0) {
    return true // No conditions = matches all
  }

  const results = criteria.conditions.map(condition =>
    evaluateCondition(condition, fieldValues)
  )

  if (criteria.match_type === 'all') {
    return results.every(r => r)
  } else {
    return results.some(r => r)
  }
}

// =====================================================
// SHARING RULE EVALUATION
// =====================================================

/**
 * Check if a sharing rule applies to a user
 */
export function sharingRuleAppliesToUser(
  rule: SharingRule,
  userContext: UserContext
): boolean {
  if (!rule.is_active) return false

  switch (rule.share_with_type) {
    case 'user':
      return rule.share_with_id === userContext.userId

    case 'role':
      return rule.share_with_id === userContext.roleId

    case 'public_group':
      // Would need to check group membership - not implemented yet
      return false

    default:
      return false
  }
}

/**
 * Check if a sharing rule grants access to a record
 */
export function evaluateSharingRule(
  rule: SharingRule,
  recordContext: RecordContext,
  userContext: UserContext
): RecordAccessLevel | null {
  // Rule must be active
  if (!rule.is_active) return null

  // Rule must apply to this user
  if (!sharingRuleAppliesToUser(rule, userContext)) return null

  // For criteria-based rules, evaluate criteria against record
  if (rule.rule_type === 'criteria' && recordContext.fieldValues) {
    const criteria = rule.criteria as SharingCriteria
    if (!evaluateCriteria(criteria, recordContext.fieldValues)) {
      return null
    }
  }

  // For owner-based rules, check if record owner has the specified role
  if (rule.rule_type === 'owner_based' && rule.owner_role_id) {
    // This would need additional context about the owner's role
    // For now, we'll skip this check in client-side evaluation
    // The database function handles this
  }

  return rule.access_level as RecordAccessLevel
}

// =====================================================
// MANUAL SHARE EVALUATION
// =====================================================

/**
 * Check if a manual share grants access to a user
 */
export function evaluateManualShare(
  share: ManualShare,
  userContext: UserContext
): RecordAccessLevel | null {
  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null
  }

  // Check if share applies to user
  if (share.share_with_type === 'user') {
    if (share.share_with_id !== userContext.userId) {
      return null
    }
  } else if (share.share_with_type === 'role') {
    if (share.share_with_id !== userContext.roleId) {
      return null
    }
  }

  return share.access_level
}

// =====================================================
// ROLE HIERARCHY
// =====================================================

/**
 * Check if user has hierarchy-based access to record
 * (user's hierarchy level is lower/more privileged than owner's)
 */
export function hasHierarchyAccess(
  userHierarchyLevel: number | null,
  ownerHierarchyLevel: number | null
): boolean {
  if (userHierarchyLevel === null || ownerHierarchyLevel === null) {
    return false
  }

  // Lower hierarchy_level = higher privilege
  return userHierarchyLevel < ownerHierarchyLevel
}

// =====================================================
// MAIN ACCESS EVALUATION
// =====================================================

/**
 * Evaluate all access paths for a record
 * This is the main function used to determine if a user can access a record
 */
export function evaluateRecordAccess(
  recordContext: RecordContext,
  userContext: UserContext,
  sharingModel: SharingModel,
  sharingRules: SharingRule[] = [],
  manualShares: ManualShare[] = [],
  ownerHierarchyLevel: number | null = null
): SharingEvaluationResult {
  const allAccessGrants: SharingEvaluationResult['allAccessGrants'] = []

  // Must be in same organization
  if (userContext.organizationId !== recordContext.organizationId) {
    return {
      hasAccess: false,
      accessLevel: null,
      accessSource: null,
      allAccessGrants: [],
    }
  }

  // 1. Owner always has full access
  if (recordContext.ownerId === userContext.userId) {
    allAccessGrants.push({
      source: 'owner',
      level: 'full_access',
      sourceName: 'Record Owner',
    })
  }

  // 2. Organization-wide default
  const owdAccess = sharingModelToAccessLevel(sharingModel)
  if (owdAccess) {
    allAccessGrants.push({
      source: 'org_wide_default',
      level: owdAccess,
      sourceName: `Organization Default: ${sharingModel}`,
    })
  }

  // 3. Role hierarchy
  if (hasHierarchyAccess(userContext.hierarchyLevel, ownerHierarchyLevel)) {
    allAccessGrants.push({
      source: 'role_hierarchy',
      level: 'read_write', // Hierarchy typically grants read/write
      sourceName: 'Role Hierarchy',
    })
  }

  // 4. Sharing rules
  for (const rule of sharingRules) {
    const ruleAccess = evaluateSharingRule(rule, recordContext, userContext)
    if (ruleAccess) {
      allAccessGrants.push({
        source: 'sharing_rule',
        level: ruleAccess,
        sourceId: rule.id,
        sourceName: `Sharing Rule: ${rule.name}`,
      })
    }
  }

  // 5. Manual shares
  for (const share of manualShares) {
    const shareAccess = evaluateManualShare(share, userContext)
    if (shareAccess) {
      allAccessGrants.push({
        source: 'manual_share',
        level: shareAccess,
        sourceId: share.id,
        sourceName: share.reason || 'Manual Share',
      })
    }
  }

  // Determine highest access level
  let highestAccess: RecordAccessLevel | null = null
  let winningSource: AccessSource | null = null

  for (const grant of allAccessGrants) {
    const newHighest = compareAccessLevels(highestAccess, grant.level)
    if (newHighest !== highestAccess) {
      highestAccess = newHighest
      winningSource = grant.source
    }
  }

  return {
    hasAccess: highestAccess !== null,
    accessLevel: highestAccess,
    accessSource: winningSource,
    allAccessGrants,
  }
}

// =====================================================
// UI HELPERS
// =====================================================

/**
 * Get human-readable description of access source
 */
export function getAccessSourceDescription(source: AccessSource): string {
  switch (source) {
    case 'owner':
      return 'You are the record owner'
    case 'org_wide_default':
      return 'Organization-wide sharing setting'
    case 'role_hierarchy':
      return 'Access via role hierarchy'
    case 'sharing_rule':
      return 'Granted by sharing rule'
    case 'manual_share':
      return 'Manually shared with you'
    default:
      return 'Unknown access source'
  }
}

/**
 * Get human-readable description of access level
 */
export function getAccessLevelDescription(level: RecordAccessLevel): string {
  switch (level) {
    case 'read':
      return 'Read Only'
    case 'read_write':
      return 'Read/Write'
    case 'full_access':
      return 'Full Access'
    default:
      return 'Unknown'
  }
}

/**
 * Get sharing model display name
 */
export function getSharingModelDisplayName(model: SharingModel): string {
  switch (model) {
    case 'private':
      return 'Private'
    case 'read':
      return 'Public Read Only'
    case 'read_write':
      return 'Public Read/Write'
    case 'full_access':
      return 'Public Full Access'
    default:
      return model
  }
}

/**
 * Get sharing model description
 */
export function getSharingModelDescription(model: SharingModel): string {
  switch (model) {
    case 'private':
      return 'Only record owner and users granted access can view and edit'
    case 'read':
      return 'All users can view records, but only owner and granted users can edit'
    case 'read_write':
      return 'All users can view and edit records'
    case 'full_access':
      return 'All users have full access including transfer and delete'
    default:
      return ''
  }
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate sharing rule criteria structure
 */
export function validateSharingCriteria(criteria: unknown): {
  valid: boolean
  error?: string
} {
  if (!criteria || typeof criteria !== 'object') {
    return { valid: false, error: 'Criteria must be an object' }
  }

  const c = criteria as Record<string, unknown>

  if (!Array.isArray(c.conditions)) {
    return { valid: false, error: 'Criteria must have conditions array' }
  }

  if (c.match_type !== 'all' && c.match_type !== 'any') {
    return { valid: false, error: 'match_type must be "all" or "any"' }
  }

  for (let i = 0; i < c.conditions.length; i++) {
    const condition = c.conditions[i]
    if (!condition || typeof condition !== 'object') {
      return { valid: false, error: `Condition ${i} must be an object` }
    }

    const cond = condition as Record<string, unknown>
    if (typeof cond.field !== 'string' || !cond.field) {
      return { valid: false, error: `Condition ${i} must have a field` }
    }

    const validOperators = [
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'starts_with',
      'greater_than',
      'less_than',
      'is_null',
      'is_not_null',
      'in',
    ]
    if (!validOperators.includes(cond.operator as string)) {
      return { valid: false, error: `Condition ${i} has invalid operator` }
    }
  }

  return { valid: true }
}
