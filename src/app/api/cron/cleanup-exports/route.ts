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
 * Export Cleanup Cron Job
 *
 * This endpoint should be called periodically (e.g., daily) to clean up
 * expired GDPR data export files from storage.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-exports",
 *     "schedule": "0 3 * * *"  // Every day at 3 AM
 *   }]
 * }
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting export cleanup...')

  try {
    const client = getSupabase()

    // List all files in exports bucket
    const { data: files, error: listError } = await client.storage
      .from('exports')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      })

    if (listError) {
      // Bucket might not exist yet
      if (listError.message?.includes('not found')) {
        return NextResponse.json({
          success: true,
          message: 'No exports bucket found - nothing to clean up',
          filesDeleted: 0,
        })
      }
      console.error('[Cron] Failed to list exports:', listError)
      return NextResponse.json(
        { error: 'Failed to list exports', details: listError.message },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No export files found',
        filesDeleted: 0,
      })
    }

    // Find files older than 24 hours
    const now = new Date()
    const expirationMs = 24 * 60 * 60 * 1000 // 24 hours
    const expiredFiles = files.filter(file => {
      if (!file.created_at) return false
      const createdAt = new Date(file.created_at)
      return now.getTime() - createdAt.getTime() > expirationMs
    })

    if (expiredFiles.length === 0) {
      console.log('[Cron] No expired export files found')
      return NextResponse.json({
        success: true,
        message: 'No expired export files',
        filesDeleted: 0,
        totalFiles: files.length,
      })
    }

    console.log(
      `[Cron] Found ${expiredFiles.length} expired export files to delete`
    )

    // Delete expired files
    const filePaths = expiredFiles.map(f => f.name)
    const { error: deleteError } = await client.storage
      .from('exports')
      .remove(filePaths)

    if (deleteError) {
      console.error('[Cron] Failed to delete files:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete files', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(
      `[Cron] Successfully deleted ${expiredFiles.length} export files`
    )

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${expiredFiles.length} expired export files`,
      filesDeleted: expiredFiles.length,
      deletedFiles: filePaths,
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
