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

/**
 * Hard Delete Organizations Cron Job
 *
 * This endpoint should be called daily to permanently delete organizations
 * that have passed their 30-day grace period after soft deletion.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/hard-delete-orgs",
 *     "schedule": "0 2 * * *"  // Every day at 2 AM
 *   }]
 * }
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting hard delete check for organizations...')

  try {
    const client = getSupabase()
    const now = new Date()

    // Find organizations where deleted_at has passed
    const { data: orgsToDelete, error: fetchError } = await client
      .from('organizations')
      .select('id, name, slug, deleted_at')
      .not('deleted_at', 'is', null)
      .lte('deleted_at', now.toISOString())

    if (fetchError) {
      console.error('[Cron] Failed to fetch organizations:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!orgsToDelete || orgsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations ready for hard deletion',
        deletedCount: 0,
      })
    }

    console.log(
      `[Cron] Found ${orgsToDelete.length} organizations to permanently delete`
    )

    const results = await Promise.allSettled(
      orgsToDelete.map(async org => {
        console.log(`[Cron] Deleting organization: ${org.name} (${org.id})`)

        try {
          // Delete organization files from storage
          // List and delete all files in org-specific paths
          const buckets = ['exports', 'documents', 'avatars']
          for (const bucket of buckets) {
            try {
              const { data: files } = await client.storage
                .from(bucket)
                .list(`org_${org.id}`, { limit: 1000 })

              if (files && files.length > 0) {
                const filePaths = files.map(f => `org_${org.id}/${f.name}`)
                await client.storage.from(bucket).remove(filePaths)
                console.log(
                  `[Cron] Deleted ${files.length} files from ${bucket}`
                )
              }
            } catch {
              // Bucket might not exist or have org data
            }
          }

          // Hard delete the organization
          // Due to CASCADE DELETE on foreign keys, this will delete all related data
          const { error: deleteError } = await client
            .from('organizations')
            .delete()
            .eq('id', org.id)

          if (deleteError) {
            throw new Error(deleteError.message)
          }

          console.log(`[Cron] Successfully deleted organization: ${org.name}`)
          return { orgId: org.id, name: org.name, status: 'deleted' }
        } catch (err) {
          console.error(`[Cron] Failed to delete org ${org.id}:`, err)
          return {
            orgId: org.id,
            name: org.name,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      })
    )

    // Summarize results
    const deleted = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 'deleted'
    ).length
    const failed = results.filter(
      r =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.status === 'failed')
    ).length

    console.log(
      `[Cron] Hard delete completed: ${deleted} deleted, ${failed} failed`
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${orgsToDelete.length} organizations`,
      deletedCount: deleted,
      failedCount: failed,
      details: results.map(r =>
        r.status === 'fulfilled'
          ? r.value
          : { status: 'error', error: r.reason }
      ),
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
