import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { WorkflowEngine } from '@/lib/workflows/engine'

/**
 * API endpoint to process a workflow execution
 *
 * This is called after a workflow execution is created (by DB trigger)
 * to actually run the workflow steps.
 *
 * Can be called via:
 * - Database webhook (pg_net extension)
 * - Direct API call
 * - Background job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { execution_id } = body

    if (!execution_id) {
      return NextResponse.json(
        { error: 'execution_id is required' },
        { status: 400 }
      )
    }

    const engine = new WorkflowEngine()
    await engine.processExecution(execution_id)

    return NextResponse.json({
      success: true,
      message: 'Workflow execution processed',
      execution_id,
    })
  } catch (error) {
    console.error('[WorkflowProcess] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Process all pending/running executions
 * Useful for catching up after a deployment or system restart
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Find running executions that may have been interrupted
    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('id')
      .eq('status', 'running')
      .limit(100)

    if (error) {
      console.error('[WorkflowProcess] Error fetching executions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!executions || executions.length === 0) {
      return NextResponse.json({
        message: 'No running executions to process',
        processed: 0,
      })
    }

    const engine = new WorkflowEngine()
    const results: Array<{ id: string; success: boolean }> = []

    for (const exec of executions) {
      try {
        await engine.processExecution(exec.id)
        results.push({ id: exec.id, success: true })
      } catch {
        results.push({ id: exec.id, success: false })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} executions`,
      results,
    })
  } catch (error) {
    console.error('[WorkflowProcess] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
