import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { WorkflowEngine } from '@/lib/workflows/engine'

/**
 * Cron job to process waiting workflows
 *
 * This should be called periodically (e.g., every 5 minutes) via Vercel Cron
 * or an external scheduler to process workflows that are waiting.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/workflow-scheduler",
 *     "schedule": "0/5 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret if in production
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Find waiting executions that are ready to resume
    const { data: waitingExecutions, error } = await supabase
      .from('workflow_executions')
      .select('id, workflow_id')
      .eq('status', 'waiting')
      .lte('next_run_at', new Date().toISOString())
      .limit(50) // Process in batches

    if (error) {
      console.error('[WorkflowScheduler] Error fetching executions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!waitingExecutions || waitingExecutions.length === 0) {
      return NextResponse.json({
        message: 'No waiting executions to process',
        processed: 0,
      })
    }

    // Process each waiting execution
    const engine = new WorkflowEngine()
    const results: Array<{ id: string; success: boolean; error?: string }> = []

    for (const execution of waitingExecutions) {
      try {
        // Update status to running before processing
        await supabase
          .from('workflow_executions')
          .update({
            status: 'running',
            next_run_at: null,
            waiting_for: null,
          })
          .eq('id', execution.id)

        // Process the execution
        await engine.processExecution(execution.id)
        results.push({ id: execution.id, success: true })
      } catch (err) {
        console.error(
          `[WorkflowScheduler] Error processing execution ${execution.id}:`,
          err
        )
        results.push({
          id: execution.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Processed ${results.length} executions`,
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
    })
  } catch (error) {
    console.error('[WorkflowScheduler] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
