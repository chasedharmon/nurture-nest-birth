import { createAdminClient } from '@/lib/supabase/server'
import type { WorkflowStep, StepConfig, WorkflowStepType } from './types'

// ============================================================================
// Workflow Execution Engine
// ============================================================================

interface ExecutionContext {
  trigger_type: string
  triggered_at: string
  record_data: Record<string, unknown>
  step_results?: Record<string, unknown>
}

interface StepResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  nextStepKey?: string | null
}

export class WorkflowEngine {
  private supabase: Awaited<ReturnType<typeof createAdminClient>>

  constructor() {
    this.supabase = createAdminClient()
  }

  /**
   * Process a single workflow execution
   */
  async processExecution(executionId: string): Promise<void> {
    // Get the execution
    const { data: execution, error: execError } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (execError || !execution) {
      console.error('[WorkflowEngine] Execution not found:', executionId)
      return
    }

    if (execution.status !== 'running') {
      console.log(
        '[WorkflowEngine] Execution not in running state:',
        execution.status
      )
      return
    }

    // Get workflow steps
    const { data: steps, error: stepsError } = await this.supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', execution.workflow_id)
      .order('step_order', { ascending: true })

    if (stepsError || !steps || steps.length === 0) {
      await this.failExecution(executionId, 'No workflow steps found')
      return
    }

    // Find starting step (trigger) or current step
    let currentStepKey = execution.current_step_key || 'trigger'
    const context: ExecutionContext = execution.context as ExecutionContext

    // Process steps until we hit an end, wait, or error
    while (currentStepKey) {
      const step = steps.find(s => s.step_key === currentStepKey)

      if (!step) {
        await this.failExecution(
          executionId,
          `Step not found: ${currentStepKey}`
        )
        return
      }

      // Log step start
      const { data: stepExec } = await this.supabase
        .from('workflow_step_executions')
        .insert({
          execution_id: executionId,
          step_id: step.id,
          status: 'running',
          input: { context, step_config: step.step_config },
        })
        .select()
        .single()

      // Execute the step
      const result = await this.executeStep(step, context)

      // Log step result
      if (stepExec) {
        await this.supabase
          .from('workflow_step_executions')
          .update({
            status: result.success ? 'completed' : 'failed',
            output: result.output,
            error_message: result.error,
            completed_at: new Date().toISOString(),
          })
          .eq('id', stepExec.id)
      }

      if (!result.success) {
        await this.failExecution(
          executionId,
          result.error || 'Step execution failed'
        )
        return
      }

      // Store step results in context
      if (result.output) {
        context.step_results = {
          ...context.step_results,
          [currentStepKey]: result.output,
        }
      }

      // Handle wait steps
      if (step.step_type === 'wait' && result.output?.wait_until) {
        await this.supabase
          .from('workflow_executions')
          .update({
            status: 'waiting',
            current_step_key: step.next_step_key || null,
            context,
            next_run_at: result.output.wait_until as string,
            waiting_for: `Waiting until ${result.output.wait_until}`,
          })
          .eq('id', executionId)
        return
      }

      // Handle end step
      if (step.step_type === 'end' || !result.nextStepKey) {
        await this.completeExecution(executionId, context)
        return
      }

      // Move to next step
      currentStepKey = result.nextStepKey

      // Update execution progress
      await this.supabase
        .from('workflow_executions')
        .update({
          current_step_key: currentStepKey,
          context,
        })
        .eq('id', executionId)
    }

    // If we get here with no next step, complete
    await this.completeExecution(executionId, context)
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<StepResult> {
    const config = step.step_config as StepConfig

    try {
      switch (step.step_type as WorkflowStepType) {
        case 'trigger':
          // Trigger is just the entry point
          return {
            success: true,
            nextStepKey: step.next_step_key,
          }

        case 'send_email':
          return await this.executeSendEmail(
            config,
            context,
            step.next_step_key
          )

        case 'create_task':
          return await this.executeCreateTask(
            config,
            context,
            step.next_step_key
          )

        case 'update_field':
          return await this.executeUpdateField(
            config,
            context,
            step.next_step_key
          )

        case 'wait':
          return await this.executeWait(config, context, step.next_step_key)

        case 'decision':
          return await this.executeDecision(config, context, step)

        case 'end':
          return { success: true }

        default:
          return {
            success: true,
            output: {
              message: `Step type ${step.step_type} not yet implemented`,
            },
            nextStepKey: step.next_step_key,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ============================================================================
  // Step Executors
  // ============================================================================

  private async executeSendEmail(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    const recordData = context.record_data

    // Get recipient email
    let toEmail: string | undefined

    if (config.to_type === 'custom' && config.to_email) {
      toEmail = config.to_email
    } else if (config.to_field && recordData[config.to_field]) {
      toEmail = recordData[config.to_field] as string
    } else if (recordData.email) {
      toEmail = recordData.email as string
    }

    if (!toEmail) {
      return {
        success: false,
        error: 'No recipient email found',
      }
    }

    // For now, log the email (actual sending would use the notification system)
    console.log('[WorkflowEngine] Would send email:', {
      to: toEmail,
      template: config.template_name,
      subject: config.subject,
    })

    // TODO: Integrate with actual email sending via notifications.ts

    return {
      success: true,
      output: {
        email_sent_to: toEmail,
        template: config.template_name,
      },
      nextStepKey,
    }
  }

  private async executeCreateTask(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    const recordData = context.record_data
    const clientId = recordData.id as string

    if (!clientId) {
      return {
        success: false,
        error: 'No client ID found in record data',
      }
    }

    // Create action item
    const { data, error } = await this.supabase
      .from('client_action_items')
      .insert({
        client_id: clientId,
        title: config.title || 'Action item from workflow',
        action_type: config.action_type || 'custom',
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to create task: ${error.message}`,
      }
    }

    return {
      success: true,
      output: {
        task_created: true,
        task_id: data.id,
        task_title: config.title,
      },
      nextStepKey,
    }
  }

  private async executeUpdateField(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    const recordData = context.record_data
    const recordId = recordData.id as string

    if (!config.field || config.value === undefined) {
      return {
        success: false,
        error: 'Field and value are required for update_field step',
      }
    }

    // Determine table based on context (this is simplified - real implementation
    // would need to know the record type)
    const table = 'leads' // Default to leads for now

    const { error } = await this.supabase
      .from(table)
      .update({ [config.field]: config.value })
      .eq('id', recordId)

    if (error) {
      return {
        success: false,
        error: `Failed to update field: ${error.message}`,
      }
    }

    return {
      success: true,
      output: {
        field_updated: config.field,
        new_value: config.value,
      },
      nextStepKey,
    }
  }

  private async executeWait(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    let waitUntil: Date

    if (config.wait_days || config.wait_hours) {
      waitUntil = new Date()
      if (config.wait_days) {
        waitUntil.setDate(waitUntil.getDate() + config.wait_days)
      }
      if (config.wait_hours) {
        waitUntil.setHours(waitUntil.getHours() + config.wait_hours)
      }
    } else if (config.wait_until_field) {
      const fieldValue = context.record_data[config.wait_until_field]
      if (fieldValue) {
        waitUntil = new Date(fieldValue as string)
      } else {
        return {
          success: false,
          error: `Field ${config.wait_until_field} not found or empty`,
        }
      }
    } else {
      // No wait configured, continue immediately
      return {
        success: true,
        nextStepKey,
      }
    }

    return {
      success: true,
      output: {
        wait_until: waitUntil.toISOString(),
        wait_days: config.wait_days,
        wait_hours: config.wait_hours,
      },
      nextStepKey,
    }
  }

  private async executeDecision(
    config: StepConfig,
    context: ExecutionContext,
    step: WorkflowStep
  ): Promise<StepResult> {
    if (!config.condition_field) {
      return {
        success: false,
        error: 'Decision step requires condition_field',
      }
    }

    const fieldValue = context.record_data[config.condition_field]
    let conditionMet = false

    switch (config.condition_operator) {
      case 'equals':
        conditionMet = String(fieldValue) === String(config.condition_value)
        break
      case 'not_equals':
        conditionMet = String(fieldValue) !== String(config.condition_value)
        break
      case 'contains':
        conditionMet = String(fieldValue).includes(
          String(config.condition_value)
        )
        break
      case 'greater_than':
        conditionMet = Number(fieldValue) > Number(config.condition_value)
        break
      case 'less_than':
        conditionMet = Number(fieldValue) < Number(config.condition_value)
        break
      default:
        conditionMet = Boolean(fieldValue)
    }

    // Find the appropriate branch
    const branches = step.branches as Array<{
      condition: string
      next_step_key: string
    }> | null
    let nextStepKey: string | null = null

    if (branches) {
      const matchingBranch = branches.find(
        b => b.condition === (conditionMet ? 'true' : 'false')
      )
      nextStepKey = matchingBranch?.next_step_key || null
    }

    return {
      success: true,
      output: {
        condition_field: config.condition_field,
        field_value: fieldValue,
        condition_met: conditionMet,
        branch_taken: conditionMet ? 'true' : 'false',
      },
      nextStepKey,
    }
  }

  // ============================================================================
  // Execution State Management
  // ============================================================================

  private async failExecution(
    executionId: string,
    error: string
  ): Promise<void> {
    await this.supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: error,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)
  }

  private async completeExecution(
    executionId: string,
    context: ExecutionContext
  ): Promise<void> {
    await this.supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        context,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine()
