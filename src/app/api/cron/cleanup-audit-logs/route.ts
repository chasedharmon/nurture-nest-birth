import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialize Supabase client
let supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error('Supabase environment variables are not set')
    }
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn(
      '[Cron] No CRON_SECRET configured - allowing request in dev mode'
    )
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

// Default retention in days
const DEFAULT_RETENTION_DAYS = 90

/**
 * Audit Log Cleanup Cron Job
 *
 * This endpoint should be called daily to clean up old audit logs
 * based on each organization's retention settings.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-audit-logs",
 *     "schedule": "0 4 * * *"  // Every day at 4 AM
 *   }]
 * }
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting audit log cleanup...')

  try {
    const client = getSupabase()

    // Get all organizations with their retention settings
    const { data: orgs, error: orgError } = await client
      .from('organizations')
      .select('id, name, settings')

    if (orgError) {
      console.error('[Cron] Failed to fetch organizations:', orgError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: orgError.message },
        { status: 500 }
      )
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations found',
        logsDeleted: 0,
      })
    }

    let totalDeleted = 0
    const results: Array<{ orgId: string; orgName: string; deleted: number }> =
      []

    for (const org of orgs) {
      // Get retention days from org settings, default to 90
      const retentionDays =
        (org.settings as Record<string, unknown>)?.audit_log_retention_days ??
        DEFAULT_RETENTION_DAYS

      // Calculate cutoff date
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (retentionDays as number))

      // Delete old audit logs for this organization
      const { data: deleted, error: deleteError } = await client
        .from('audit_logs')
        .delete()
        .eq('organization_id', org.id)
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (deleteError) {
        console.error(
          `[Cron] Failed to delete logs for org ${org.id}:`,
          deleteError
        )
        continue
      }

      const deletedCount = deleted?.length || 0
      totalDeleted += deletedCount

      if (deletedCount > 0) {
        results.push({
          orgId: org.id,
          orgName: org.name,
          deleted: deletedCount,
        })
        console.log(
          `[Cron] Deleted ${deletedCount} audit logs for org ${org.name} (retention: ${retentionDays} days)`
        )
      }
    }

    console.log(
      `[Cron] Audit log cleanup complete. Total deleted: ${totalDeleted}`
    )

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${totalDeleted} audit log entries`,
      logsDeleted: totalDeleted,
      organizations: results,
    })
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Support POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}
