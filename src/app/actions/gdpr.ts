'use server'

/**
 * GDPR Server Actions
 *
 * Actions for data export requests, account deletion, and platform audit logging.
 * These support GDPR compliance for the multi-tenant SaaS platform.
 */

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requirePlatformAdmin } from '@/lib/platform/super-admin'

// =====================================================
// Types
// =====================================================

export interface DataExportRequest {
  id: string
  organization_id: string
  requested_by_user_id: string | null
  requested_by_email: string
  export_type: 'full' | 'partial'
  export_format: string
  include_clients: boolean
  include_documents: boolean
  include_payments: boolean
  include_communications: boolean
  include_audit_logs: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  file_url: string | null
  download_url: string | null
  file_size_bytes: number | null
  file_format: string
  requested_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  error_message: string | null
  notes: string | null
  organization?: {
    id: string
    name: string
  }
}

export interface AccountDeletionRequest {
  id: string
  organization_id: string
  organization_name: string
  organization_slug: string
  requested_by_user_id: string | null
  requested_by_email: string
  requested_at: string
  reason: string | null
  approved_by_user_id: string | null
  approved_at: string | null
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'cancelled'
  scheduled_deletion_at: string | null
  grace_period_days: number
  started_at: string | null
  completed_at: string | null
  records_deleted: Record<string, number>
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

export interface PlatformAuditLogEntry {
  id: string
  admin_user_id: string
  admin_email: string
  target_organization_id: string | null
  target_organization_name: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  description: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// =====================================================
// Helper Functions
// =====================================================

async function logPlatformAction(params: {
  adminUserId: string
  adminEmail: string
  action: string
  targetOrgId?: string
  targetOrgName?: string
  resourceType?: string
  resourceId?: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const supabase = createAdminClient()
  const headersList = await headers()

  await supabase.from('platform_audit_log').insert({
    admin_user_id: params.adminUserId,
    admin_email: params.adminEmail,
    target_organization_id: params.targetOrgId || null,
    target_organization_name: params.targetOrgName || null,
    action: params.action,
    resource_type: params.resourceType || null,
    resource_id: params.resourceId || null,
    description: params.description || null,
    metadata: params.metadata || {},
    ip_address: headersList.get('x-forwarded-for') || null,
    user_agent: headersList.get('user-agent') || null,
  })
}

// =====================================================
// Data Export Actions
// =====================================================

/**
 * Request a full data export for an organization (GDPR Article 20)
 * Can be requested by org owners or platform admins
 */
export async function requestDataExport(
  organizationId: string,
  options?: {
    export_type?: 'full' | 'partial'
    include_clients?: boolean
    include_documents?: boolean
    include_payments?: boolean
    include_communications?: boolean
    include_audit_logs?: boolean
  }
): Promise<{ success: boolean; data?: { requestId: string }; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminClient = createAdminClient()

    // Check if user is platform admin or org owner
    const { data: userData } = await adminClient
      .from('users')
      .select('email, is_platform_admin')
      .eq('id', user.id)
      .single()

    const isPlatformAdmin = userData?.is_platform_admin === true

    if (!isPlatformAdmin) {
      // Check if user is org owner
      const { data: membership } = await adminClient
        .from('organization_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (membership?.role !== 'owner') {
        return {
          success: false,
          error:
            'Only organization owners or platform admins can request data exports',
        }
      }
    }

    // Create export request
    const { data: exportRequest, error } = await adminClient
      .from('data_export_requests')
      .insert({
        organization_id: organizationId,
        requested_by_user_id: user.id,
        requested_by_email: userData?.email || user.email || 'unknown',
        export_type: options?.export_type || 'full',
        include_clients: options?.include_clients ?? true,
        include_documents: options?.include_documents ?? true,
        include_payments: options?.include_payments ?? true,
        include_communications: options?.include_communications ?? true,
        include_audit_logs: options?.include_audit_logs ?? true,
        status: 'pending',
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Get org name for audit log
    const { data: org } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    // Log the action
    await logPlatformAction({
      adminUserId: user.id,
      adminEmail: userData?.email || user.email || 'unknown',
      action: 'request_data_export',
      targetOrgId: organizationId,
      targetOrgName: org?.name,
      resourceType: 'data_export',
      resourceId: exportRequest?.id,
      description: `Data export requested for organization`,
    })

    return { success: true, data: { requestId: exportRequest?.id || '' } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to request export',
    }
  }
}

/**
 * Get data export requests for an organization
 */
export async function getDataExportRequests(
  organizationId?: string
): Promise<{ success: boolean; data?: DataExportRequest[]; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminClient = createAdminClient()

    // Check if platform admin (can see all) or org member
    const { data: userData } = await adminClient
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    let query = adminClient
      .from('data_export_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (!userData?.is_platform_admin) {
      // Non-admins can only see their org's requests
      const { data: membership } = await adminClient
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!membership) {
        return { success: false, error: 'No organization membership found' }
      }

      query = query.eq('organization_id', membership.organization_id)
    } else if (organizationId) {
      // Platform admin filtering by specific org
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get export requests',
    }
  }
}

/**
 * Process a data export (platform admin only)
 * In production, this would be a background job
 */
export async function processDataExport(
  exportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePlatformAdmin()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    // Get export request
    const { data: exportRequest, error: fetchError } = await adminClient
      .from('data_export_requests')
      .select('*, organization:organizations(name)')
      .eq('id', exportId)
      .single()

    if (fetchError || !exportRequest) {
      return { success: false, error: 'Export request not found' }
    }

    // Update status to processing
    await adminClient
      .from('data_export_requests')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', exportId)

    // In a real implementation, this would:
    // 1. Queue a background job
    // 2. Export all org data (leads, services, payments, etc.)
    // 3. Create a JSON/ZIP file
    // 4. Upload to secure storage
    // 5. Update the request with file_url and completed_at

    // For now, we'll simulate completion
    const { error: updateError } = await adminClient
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_format: 'json',
        notes:
          'Export completed. In production, this would include a download link.',
      })
      .eq('id', exportId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Log the action
    const { data: userData } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user?.id)
      .single()

    await logPlatformAction({
      adminUserId: user?.id || '',
      adminEmail: userData?.email || 'unknown',
      action: 'process_data_export',
      targetOrgId: exportRequest.organization_id,
      targetOrgName: (exportRequest.organization as Record<string, unknown>)
        ?.name as string,
      resourceType: 'data_export',
      resourceId: exportId,
      description: 'Data export processed',
    })

    revalidatePath('/super-admin')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to process export',
    }
  }
}

// =====================================================
// Account Deletion Actions
// =====================================================

/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 */
export async function requestAccountDeletion(
  organizationId: string,
  reason?: string
): Promise<{ success: boolean; data?: { requestId: string }; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminClient = createAdminClient()

    // Check if user is org owner
    const { data: membership } = await adminClient
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (membership?.role !== 'owner') {
      return {
        success: false,
        error: 'Only organization owners can request account deletion',
      }
    }

    // Get org details
    const { data: org } = await adminClient
      .from('organizations')
      .select('name, slug')
      .eq('id', organizationId)
      .single()

    if (!org) {
      return { success: false, error: 'Organization not found' }
    }

    // Check for existing pending deletion request
    const { data: existingRequest } = await adminClient
      .from('account_deletion_queue')
      .select('id')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'approved'])
      .single()

    if (existingRequest) {
      return {
        success: false,
        error: 'A deletion request already exists for this organization',
      }
    }

    // Get user email
    const { data: userData } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    // Create deletion request with 30-day grace period
    const scheduledDeletion = new Date()
    scheduledDeletion.setDate(scheduledDeletion.getDate() + 30)

    const { data: deletionRequest, error } = await adminClient
      .from('account_deletion_queue')
      .insert({
        organization_id: organizationId,
        organization_name: org.name,
        organization_slug: org.slug,
        requested_by_user_id: user.id,
        requested_by_email: userData?.email || user.email || 'unknown',
        status: 'pending',
        scheduled_deletion_at: scheduledDeletion.toISOString(),
        grace_period_days: 30,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Log the action
    await logPlatformAction({
      adminUserId: user.id,
      adminEmail: userData?.email || user.email || 'unknown',
      action: 'request_account_deletion',
      targetOrgId: organizationId,
      targetOrgName: org.name,
      resourceType: 'deletion_request',
      resourceId: deletionRequest?.id,
      description: reason || 'Account deletion requested by owner',
    })

    return { success: true, data: { requestId: deletionRequest?.id || '' } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to request account deletion',
    }
  }
}

/**
 * Get account deletion requests (platform admin)
 */
export async function getAccountDeletionRequests(status?: string): Promise<{
  success: boolean
  data?: AccountDeletionRequest[]
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const adminClient = createAdminClient()

    let query = adminClient
      .from('account_deletion_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get deletion requests',
    }
  }
}

/**
 * Approve account deletion (platform admin)
 */
export async function approveAccountDeletion(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePlatformAdmin()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    // Get request details
    const { data: request, error: fetchError } = await adminClient
      .from('account_deletion_queue')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { success: false, error: 'Deletion request not found' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request is not pending approval' }
    }

    // Approve the request
    const { error: updateError } = await adminClient
      .from('account_deletion_queue')
      .update({
        status: 'approved',
        approved_by_user_id: user?.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Log the action
    const { data: userData } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user?.id)
      .single()

    await logPlatformAction({
      adminUserId: user?.id || '',
      adminEmail: userData?.email || 'unknown',
      action: 'approve_account_deletion',
      targetOrgId: request.organization_id,
      targetOrgName: request.organization_name,
      resourceType: 'deletion_request',
      resourceId: requestId,
      description: `Approved deletion for ${request.organization_name}. Scheduled for ${request.scheduled_deletion_at}`,
    })

    revalidatePath('/super-admin')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to approve deletion',
    }
  }
}

/**
 * Cancel account deletion (by org owner or platform admin)
 */
export async function cancelAccountDeletion(
  requestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminClient = createAdminClient()

    // Get request details
    const { data: request, error: fetchError } = await adminClient
      .from('account_deletion_queue')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { success: false, error: 'Deletion request not found' }
    }

    if (!['pending', 'approved'].includes(request.status)) {
      return {
        success: false,
        error: 'Request cannot be cancelled at this stage',
      }
    }

    // Check authorization
    const { data: userData } = await adminClient
      .from('users')
      .select('email, is_platform_admin')
      .eq('id', user.id)
      .single()

    const isPlatformAdmin = userData?.is_platform_admin === true

    if (!isPlatformAdmin) {
      // Check if user is the one who requested
      if (request.requested_by_user_id !== user.id) {
        return {
          success: false,
          error: 'Only the requester or platform admin can cancel',
        }
      }
    }

    // Cancel the request
    const { error: updateError } = await adminClient
      .from('account_deletion_queue')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Log the action
    await logPlatformAction({
      adminUserId: user.id,
      adminEmail: userData?.email || 'unknown',
      action: 'cancel_account_deletion',
      targetOrgId: request.organization_id,
      targetOrgName: request.organization_name,
      resourceType: 'deletion_request',
      resourceId: requestId,
      description: `Cancelled deletion: ${reason}`,
    })

    revalidatePath('/super-admin')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel deletion',
    }
  }
}

// =====================================================
// Platform Audit Log Actions
// =====================================================

/**
 * Get platform audit log entries (platform admin only)
 */
export async function getPlatformAuditLog(options?: {
  targetOrgId?: string
  action?: string
  adminUserId?: string
  limit?: number
  offset?: number
}): Promise<{
  success: boolean
  data?: { entries: PlatformAuditLogEntry[]; total: number }
  error?: string
}> {
  try {
    await requirePlatformAdmin()

    const adminClient = createAdminClient()

    let query = adminClient
      .from('platform_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.targetOrgId) {
      query = query.eq('target_organization_id', options.targetOrgId)
    }

    if (options?.action) {
      query = query.eq('action', options.action)
    }

    if (options?.adminUserId) {
      query = query.eq('admin_user_id', options.adminUserId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        entries: data || [],
        total: count || 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit log',
    }
  }
}

/**
 * Log a platform admin action manually
 */
export async function logAdminAction(params: {
  action: string
  targetOrgId?: string
  resourceType?: string
  resourceId?: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePlatformAdmin()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    // Get admin email and org name
    const { data: userData } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user?.id)
      .single()

    let targetOrgName: string | undefined
    if (params.targetOrgId) {
      const { data: org } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', params.targetOrgId)
        .single()
      targetOrgName = org?.name
    }

    await logPlatformAction({
      adminUserId: user?.id || '',
      adminEmail: userData?.email || 'unknown',
      action: params.action,
      targetOrgId: params.targetOrgId,
      targetOrgName,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log action',
    }
  }
}
