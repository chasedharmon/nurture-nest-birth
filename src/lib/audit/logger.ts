import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Supported audit actions
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'invite'
  | 'accept_invite'
  | 'revoke'
  | 'archive'
  | 'restore'
  | 'send_email'
  | 'send_sms'
  | 'payment_received'
  | 'payment_failed'
  | 'contract_signed'
  | 'terms_accepted'
  | 'password_reset'

// Entity types that can be audited
export type AuditEntityType =
  | 'lead'
  | 'client'
  | 'invoice'
  | 'payment'
  | 'meeting'
  | 'contract'
  | 'document'
  | 'user'
  | 'team_member'
  | 'organization'
  | 'workflow'
  | 'message'
  | 'conversation'
  | 'service'
  | 'intake_form'
  | 'notification'
  | 'session'

interface AuditLogEntry {
  organizationId: string
  userId?: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Log an audit event
 *
 * This function should be called from server actions after successful operations.
 * It captures the user's IP address and user agent from the request headers.
 *
 * @example
 * ```ts
 * await logAudit({
 *   organizationId: orgId,
 *   userId: user.id,
 *   action: 'create',
 *   entityType: 'lead',
 *   entityId: newLead.id,
 *   newValues: { name, email, phone },
 * })
 * ```
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    const headersList = await headers()

    // Extract request context
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null
    const userAgent = headersList.get('user-agent') || null

    const { error } = await supabase.from('audit_logs').insert({
      organization_id: entry.organizationId,
      user_id: entry.userId || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: entry.metadata || {},
    })

    if (error) {
      // Don't throw - audit logging should not break the main operation
      console.error('[Audit] Failed to log:', error.message)
    }
  } catch (err) {
    // Silent fail - audit logging should never break the application
    console.error('[Audit] Unexpected error:', err)
  }
}

/**
 * Log a batch of audit events
 * Useful for bulk operations like imports or migrations
 */
export async function logAuditBatch(entries: AuditLogEntry[]): Promise<void> {
  try {
    const supabase = createAdminClient()
    const headersList = await headers()

    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null
    const userAgent = headersList.get('user-agent') || null

    const records = entries.map(entry => ({
      organization_id: entry.organizationId,
      user_id: entry.userId || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: entry.metadata || {},
    }))

    const { error } = await supabase.from('audit_logs').insert(records)

    if (error) {
      console.error('[Audit] Failed to log batch:', error.message)
    }
  } catch (err) {
    console.error('[Audit] Unexpected batch error:', err)
  }
}

/**
 * Helper to create a diff of changed fields for update operations
 * Returns only the fields that actually changed
 */
export function diffChanges<T extends Record<string, unknown>>(
  oldValues: T,
  newValues: Partial<T>
): { oldValues: Partial<T>; newValues: Partial<T> } {
  const changedOld: Partial<T> = {}
  const changedNew: Partial<T> = {}

  for (const key of Object.keys(newValues) as Array<keyof T>) {
    const oldVal = oldValues[key]
    const newVal = newValues[key]

    // Compare stringified values for deep comparison
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedOld[key] = oldVal
      changedNew[key] = newVal
    }
  }

  return { oldValues: changedOld, newValues: changedNew }
}

/**
 * Get current user and organization context for audit logging
 * Returns null if user is not authenticated
 */
export async function getAuditContext(): Promise<{
  userId: string
  organizationId: string
} | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Get from organization_memberships
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (membership?.organization_id) {
      return {
        userId: user.id,
        organizationId: membership.organization_id,
      }
    }

    // Fallback to users table
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id) {
      return {
        userId: user.id,
        organizationId: userData.organization_id,
      }
    }

    return null
  } catch {
    return null
  }
}
