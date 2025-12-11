'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  toCSV,
  toJSON,
  createManifest,
  prepareForCSV,
} from '@/lib/export/formatters'
import { sendEmail } from '@/lib/email/send'
import { WorkflowEmail } from '@/lib/email/templates'
import JSZip from 'jszip'

// Tables to export for GDPR compliance (organization-scoped)
const EXPORT_TABLES = [
  { name: 'leads', displayName: 'Clients & Leads' },
  { name: 'lead_activities', displayName: 'Client Activities' },
  { name: 'client_services', displayName: 'Services' },
  { name: 'meetings', displayName: 'Meetings' },
  { name: 'client_documents', displayName: 'Documents (Metadata)' },
  { name: 'payments', displayName: 'Payments' },
  { name: 'invoices', displayName: 'Invoices' },
  { name: 'contract_templates', displayName: 'Contract Templates' },
  { name: 'contract_signatures', displayName: 'Signed Contracts' },
  { name: 'intake_form_templates', displayName: 'Intake Form Templates' },
  { name: 'intake_form_submissions', displayName: 'Intake Form Submissions' },
  { name: 'team_members', displayName: 'Team Members' },
  { name: 'users', displayName: 'Admin Users' },
  { name: 'conversations', displayName: 'Conversations' },
  { name: 'messages', displayName: 'Messages' },
  { name: 'workflows', displayName: 'Workflows' },
  { name: 'service_packages', displayName: 'Service Packages' },
  { name: 'client_action_items', displayName: 'Action Items' },
  { name: 'client_journey_milestones', displayName: 'Journey Milestones' },
  { name: 'notification_log', displayName: 'Notification History' },
] as const

// Sensitive fields to exclude from export
const SENSITIVE_FIELDS = [
  'password_hash',
  'session_token',
  'token',
  'stripe_customer_id',
  'stripe_subscription_id',
  'stripe_invoice_id',
  'stripe_payment_intent_id',
]

/**
 * Request a full data export for the organization (GDPR compliance)
 * Creates a ZIP file with JSON and CSV exports of all organization data
 */
export async function requestDataExport(): Promise<{
  success: boolean
  error?: string
  exportId?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select(
        'organization_id, role, organization:organizations(id, name, slug)'
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!membership?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    const orgId = membership.organization_id
    // Supabase returns nested objects as arrays when using select with joins
    const membershipOrgData = membership.organization as unknown
    const org = (
      Array.isArray(membershipOrgData)
        ? membershipOrgData[0]
        : membershipOrgData
    ) as { id: string; name: string; slug: string }

    // Only owners and admins can request exports
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return {
        success: false,
        error: 'Only administrators can request data exports',
      }
    }

    // Create ZIP archive
    const zip = new JSZip()
    const exportedAt = new Date()
    const tableMetrics: { name: string; recordCount: number }[] = []

    // Export each table
    for (const table of EXPORT_TABLES) {
      try {
        // Use admin client to bypass RLS for complete export
        const { data, error } = await adminClient
          .from(table.name)
          .select('*')
          .eq('organization_id', orgId)

        if (error) {
          console.error(`[GDPR Export] Error exporting ${table.name}:`, error)
          continue
        }

        const records = data || []

        // Remove sensitive fields
        const sanitizedRecords = records.map(record => {
          const sanitized = { ...record }
          for (const field of SENSITIVE_FIELDS) {
            if (field in sanitized) {
              delete sanitized[field]
            }
          }
          return sanitized
        })

        // Add to ZIP
        if (sanitizedRecords.length > 0) {
          // JSON format (complete data)
          zip.file(`${table.name}.json`, toJSON(sanitizedRecords))

          // CSV format (flattened for spreadsheet compatibility)
          const csvData = prepareForCSV(sanitizedRecords)
          zip.file(`${table.name}.csv`, toCSV(csvData))
        } else {
          // Empty file placeholders
          zip.file(`${table.name}.json`, '[]')
          zip.file(`${table.name}.csv`, '')
        }

        tableMetrics.push({
          name: table.displayName,
          recordCount: sanitizedRecords.length,
        })
      } catch (tableError) {
        console.error(
          `[GDPR Export] Error processing ${table.name}:`,
          tableError
        )
      }
    }

    // Add organization info
    const { data: orgData } = await adminClient
      .from('organizations')
      .select(
        'id, name, slug, created_at, subscription_tier, subscription_status'
      )
      .eq('id', orgId)
      .single()

    if (orgData) {
      zip.file('organization.json', toJSON(orgData))
    }

    // Add manifest
    const manifest = createManifest(org.name, tableMetrics, exportedAt)
    zip.file('manifest.json', manifest)

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' })

    // Generate unique filename
    const timestamp = exportedAt.toISOString().replace(/[:.]/g, '-')
    const filename = `export-${org.slug}-${timestamp}.zip`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('exports')
      .upload(filename, zipBlob, {
        contentType: 'application/zip',
        upsert: false,
      })

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message?.includes('not found')) {
        // Create the bucket
        await adminClient.storage.createBucket('exports', {
          public: false,
          fileSizeLimit: 104857600, // 100MB
        })

        // Retry upload
        const { error: retryError } = await adminClient.storage
          .from('exports')
          .upload(filename, zipBlob, {
            contentType: 'application/zip',
            upsert: false,
          })

        if (retryError) {
          console.error(
            '[GDPR Export] Upload error after bucket creation:',
            retryError
          )
          return { success: false, error: 'Failed to upload export file' }
        }
      } else {
        console.error('[GDPR Export] Upload error:', uploadError)
        return { success: false, error: 'Failed to upload export file' }
      }
    }

    // Create signed URL (24 hours)
    const { data: signedUrlData, error: signedUrlError } =
      await adminClient.storage.from('exports').createSignedUrl(filename, 86400) // 24 hours

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[GDPR Export] Signed URL error:', signedUrlError)
      return { success: false, error: 'Failed to generate download link' }
    }

    // Get user email for notification
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const userEmail = userData?.email || user.email
    const userName = userData?.full_name || 'User'

    // Send email with download link
    if (userEmail) {
      const totalRecords = tableMetrics.reduce(
        (sum, t) => sum + t.recordCount,
        0
      )

      await sendEmail({
        to: userEmail,
        subject: `Your Data Export is Ready - ${org.name}`,
        template: WorkflowEmail({
          data: {
            recipientName: userName,
            subject: 'Your Data Export is Ready',
            body: `Your data export for ${org.name} is ready for download.\n\nThis export includes ${totalRecords.toLocaleString()} records across ${tableMetrics.length} data categories.\n\nThe download link will expire in 24 hours. After that, you'll need to request a new export.\n\nClick the button below to download your data:`,
            ctaText: 'Download Export',
            ctaUrl: signedUrlData.signedUrl,
            doulaName: org.name,
          },
        }),
        tags: ['gdpr-export'],
      })
    }

    console.log(`[GDPR Export] Completed for org ${orgId}: ${filename}`)

    return {
      success: true,
      exportId: uploadData?.path || filename,
    }
  } catch (error) {
    console.error('[GDPR Export] Unexpected error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Request account/organization deletion
 * Initiates a 30-day soft delete grace period
 */
export async function requestAccountDeletion(
  confirmationText: string
): Promise<{
  success: boolean
  error?: string
  deletionScheduledAt?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select(
        'organization_id, role, organization:organizations(id, name, slug)'
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!membership?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    const orgData = membership.organization as unknown
    const org = (Array.isArray(orgData) ? orgData[0] : orgData) as {
      id: string
      name: string
      slug: string
    }

    // Only owners can delete the organization
    if (membership.role !== 'owner') {
      return {
        success: false,
        error: 'Only the organization owner can request deletion',
      }
    }

    // Verify confirmation text matches organization name
    if (confirmationText.toLowerCase() !== org.name.toLowerCase()) {
      return {
        success: false,
        error: 'Confirmation text does not match organization name',
      }
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    // Set soft delete timestamp on organization
    const { error: updateError } = await adminClient
      .from('organizations')
      .update({
        deleted_at: deletionDate.toISOString(),
        subscription_status: 'cancelled',
      })
      .eq('id', membership.organization_id)

    if (updateError) {
      console.error('[Account Deletion] Update error:', updateError)
      return { success: false, error: 'Failed to schedule deletion' }
    }

    // Revoke all active sessions for organization members
    const { data: members } = await adminClient
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', membership.organization_id)
      .eq('is_active', true)

    if (members && members.length > 0) {
      // Deactivate all memberships
      await adminClient
        .from('organization_memberships')
        .update({ is_active: false })
        .eq('organization_id', membership.organization_id)
    }

    // Get user email for confirmation
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const userEmail = userData?.email || user.email
    const userName = userData?.full_name || 'User'

    // Send confirmation email
    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: `Account Deletion Scheduled - ${org.name}`,
        template: WorkflowEmail({
          data: {
            recipientName: userName,
            subject: 'Account Deletion Scheduled',
            body: `Your account deletion request for ${org.name} has been received.\n\nYour account and all associated data will be permanently deleted on ${deletionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\n\nIf you change your mind, please contact support before this date to cancel the deletion request.\n\nThank you for using Nurture Nest Birth.`,
            doulaName: 'Nurture Nest Birth Team',
          },
        }),
        tags: ['account-deletion'],
      })
    }

    console.log(
      `[Account Deletion] Scheduled for org ${membership.organization_id}: ${deletionDate.toISOString()}`
    )

    return {
      success: true,
      deletionScheduledAt: deletionDate.toISOString(),
    }
  } catch (error) {
    console.error('[Account Deletion] Unexpected error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Cancel a pending account deletion
 */
export async function cancelAccountDeletion(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization (even if membership is inactive)
    const { data: membership } = await adminClient
      .from('organization_memberships')
      .select(
        'organization_id, role, organization:organizations(id, name, deleted_at)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!membership?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    const orgData = membership.organization as unknown
    const org = (Array.isArray(orgData) ? orgData[0] : orgData) as {
      id: string
      name: string
      deleted_at: string | null
    }

    // Only owners can cancel deletion
    if (membership.role !== 'owner') {
      return {
        success: false,
        error: 'Only the organization owner can cancel deletion',
      }
    }

    // Check if deletion is scheduled
    if (!org.deleted_at) {
      return {
        success: false,
        error: 'No deletion is scheduled for this organization',
      }
    }

    // Check if deletion date has already passed
    if (new Date(org.deleted_at) < new Date()) {
      return { success: false, error: 'The deletion grace period has expired' }
    }

    // Remove soft delete timestamp
    const { error: updateError } = await adminClient
      .from('organizations')
      .update({
        deleted_at: null,
        subscription_status: 'active',
      })
      .eq('id', membership.organization_id)

    if (updateError) {
      console.error('[Cancel Deletion] Update error:', updateError)
      return { success: false, error: 'Failed to cancel deletion' }
    }

    // Reactivate owner membership
    await adminClient
      .from('organization_memberships')
      .update({ is_active: true })
      .eq('organization_id', membership.organization_id)
      .eq('user_id', user.id)

    console.log(
      `[Cancel Deletion] Cancelled for org ${membership.organization_id}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Cancel Deletion] Unexpected error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
