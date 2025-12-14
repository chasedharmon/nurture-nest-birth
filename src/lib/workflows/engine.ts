import { createAdminClient } from '@/lib/supabase/server'
import { sendTrackedEmail } from '@/lib/email/send'
import { WorkflowEmail } from '@/lib/email/templates'
import { emailConfig } from '@/lib/email/config'
import type { WorkflowEmailData } from '@/lib/email/types'
import type { WorkflowStep, StepConfig, WorkflowStepType } from './types'
import {
  sendSms,
  formatPhoneNumber,
  isValidPhoneNumber,
  interpolateVariables as interpolateSmsVariables,
  checkOptInStatus,
} from '@/lib/sms/client'

// ============================================================================
// Workflow Execution Engine
// ============================================================================

interface ExecutionContext {
  trigger_type: string
  triggered_at: string
  record_data: Record<string, unknown>
  step_results?: Record<string, unknown>
  organization_id?: string // Added for multi-tenant tracking
  workflow_execution_id?: string // For linking SMS messages to executions
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

    // Get workflow with organization_id for multi-tenant tracking
    const { data: workflow, error: workflowError } = await this.supabase
      .from('workflows')
      .select('id, organization_id')
      .eq('id', execution.workflow_id)
      .single()

    if (workflowError || !workflow) {
      await this.failExecution(executionId, 'Workflow not found')
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
    const context: ExecutionContext = {
      ...(execution.context as ExecutionContext),
      organization_id: workflow.organization_id,
      workflow_execution_id: executionId,
    }

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

        case 'send_sms':
          return await this.executeSendSms(config, context, step.next_step_key)

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

        case 'send_survey':
          return await this.executeSendSurvey(
            config,
            context,
            step.next_step_key
          )

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

    // Get recipient name for personalization
    const recipientName = this.getRecipientName(recordData)

    // Interpolate variables in subject and body
    const subject = this.interpolateVariables(
      config.subject || 'Message from your doula',
      recordData
    )
    const body = this.interpolateVariables(
      config.body || config.content || '',
      recordData
    )

    // Prepare email data
    const emailData: WorkflowEmailData = {
      recipientName,
      subject,
      body,
      ctaText: config.cta_text,
      ctaUrl: config.cta_url
        ? this.interpolateVariables(config.cta_url, recordData)
        : undefined,
      doulaName: emailConfig.doula?.name,
    }

    // Get client ID if available
    const clientId = (recordData.id as string) || undefined

    console.log('[WorkflowEngine] Sending email:', {
      to: toEmail,
      subject: emailData.subject,
      clientId,
    })

    try {
      // Actually send the email
      const result = await sendTrackedEmail({
        to: toEmail,
        subject: emailData.subject,
        template: WorkflowEmail({ data: emailData }),
        clientId,
        notificationType: 'workflow',
      })

      if (!result.success) {
        console.error('[WorkflowEngine] Email send failed:', result.error)
        return {
          success: false,
          error: result.error || 'Failed to send email',
        }
      }

      console.log('[WorkflowEngine] Email sent successfully:', result.messageId)

      return {
        success: true,
        output: {
          email_sent_to: toEmail,
          message_id: result.messageId,
          template: config.template_name,
        },
        nextStepKey,
      }
    } catch (error) {
      console.error('[WorkflowEngine] Email send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      }
    }
  }

  private async executeSendSms(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    const recordData = context.record_data

    // Get recipient phone number
    let toPhone: string | undefined

    if (config.to_field && recordData[config.to_field]) {
      toPhone = recordData[config.to_field] as string
    } else if (recordData.phone) {
      toPhone = recordData.phone as string
    } else if (recordData.phone_number) {
      toPhone = recordData.phone_number as string
    }

    if (!toPhone) {
      return {
        success: false,
        error: 'No recipient phone number found',
      }
    }

    // Validate phone number
    if (!isValidPhoneNumber(toPhone)) {
      return {
        success: false,
        error: `Invalid phone number format: ${toPhone}`,
      }
    }

    const formattedPhone = formatPhoneNumber(toPhone)
    const organizationId = context.organization_id

    // Check opt-in status (respects SMS consent) - pass organization_id for tenant isolation
    const optInStatus = await checkOptInStatus(formattedPhone, organizationId)
    if (!optInStatus.optedIn) {
      console.log(
        '[WorkflowEngine] SMS skipped - not opted in:',
        formattedPhone
      )
      return {
        success: true,
        output: {
          sms_skipped: true,
          reason: 'Recipient has not opted in for SMS',
          phone: formattedPhone,
        },
        nextStepKey,
      }
    }

    // Get message content
    let messageContent: string

    if (config.template_name) {
      // Fetch template from database
      const { data: template, error: templateError } = await this.supabase
        .from('sms_templates')
        .select('content')
        .eq('name', config.template_name)
        .eq('is_active', true)
        .single()

      if (templateError || !template) {
        return {
          success: false,
          error: `SMS template not found: ${config.template_name}`,
        }
      }

      messageContent = template.content
    } else if (config.body || config.content) {
      messageContent = config.body || config.content || ''
    } else {
      return {
        success: false,
        error: 'No message content or template specified for SMS',
      }
    }

    // Interpolate variables
    const interpolatedContent = interpolateSmsVariables(
      messageContent,
      recordData
    )

    // Get client ID if available
    const clientId = (recordData.id as string) || undefined

    console.log('[WorkflowEngine] Sending SMS:', {
      to: formattedPhone,
      contentLength: interpolatedContent.length,
      clientId,
      template: config.template_name,
      organizationId,
    })

    try {
      const result = await sendSms({
        to: formattedPhone,
        body: interpolatedContent,
        clientId,
        templateId: config.template_name,
        organizationId, // For usage tracking and soft limits
        workflowExecutionId: context.workflow_execution_id, // For audit trail
      })

      if (!result.success) {
        console.error('[WorkflowEngine] SMS send failed:', result.error)
        return {
          success: false,
          error: result.error || 'Failed to send SMS',
        }
      }

      console.log('[WorkflowEngine] SMS sent successfully:', result.messageId)

      // Include limit warning in output if approaching limit
      const output: Record<string, unknown> = {
        sms_sent_to: formattedPhone,
        message_id: result.messageId,
        segment_count: result.segmentCount,
        template: config.template_name,
        provider: result.provider,
      }

      if (result.limitWarning) {
        output.limit_warning = result.limitWarning
      }

      return {
        success: true,
        output,
        nextStepKey,
      }
    } catch (error) {
      console.error('[WorkflowEngine] SMS send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      }
    }
  }

  /**
   * Get recipient name from record data for personalization
   */
  private getRecipientName(
    recordData: Record<string, unknown>
  ): string | undefined {
    // Try common name fields
    if (recordData.name && typeof recordData.name === 'string') {
      return recordData.name.split(' ')[0] // First name
    }
    if (recordData.first_name && typeof recordData.first_name === 'string') {
      return recordData.first_name
    }
    if (recordData.full_name && typeof recordData.full_name === 'string') {
      return recordData.full_name.split(' ')[0]
    }
    return undefined
  }

  /**
   * Interpolate template variables in a string
   * Supports {{variable_name}} syntax
   */
  private interpolateVariables(
    template: string,
    data: Record<string, unknown>
  ): string {
    if (!template) return template

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key]
      if (value === undefined || value === null) {
        return match // Keep the placeholder if no value
      }
      return String(value)
    })
  }

  /**
   * Execute a send_survey step
   * Creates a survey invitation and sends it via the configured channel
   */
  private async executeSendSurvey(
    config: StepConfig,
    context: ExecutionContext,
    nextStepKey?: string | null
  ): Promise<StepResult> {
    const recordData = context.record_data
    const clientId = recordData.id as string
    const serviceId = (recordData.service_id as string) || null

    if (!clientId) {
      return {
        success: false,
        error: 'No client ID found in record data',
      }
    }

    if (!config.survey_id) {
      return {
        success: false,
        error: 'No survey ID configured for this step',
      }
    }

    try {
      // Get client information
      const { data: client, error: clientError } = await this.supabase
        .from('leads')
        .select('name, email, organization_id')
        .eq('id', clientId)
        .single()

      if (clientError || !client) {
        return {
          success: false,
          error: 'Client not found',
        }
      }

      // Get survey details
      const { data: survey, error: surveyError } = await this.supabase
        .from('surveys')
        .select('id, name, is_active')
        .eq('id', config.survey_id)
        .single()

      if (surveyError || !survey) {
        return {
          success: false,
          error: 'Survey not found',
        }
      }

      if (!survey.is_active) {
        console.log(
          `[WorkflowEngine] Survey ${survey.name} is inactive, skipping`
        )
        return {
          success: true,
          output: { skipped: true, reason: 'Survey is inactive' },
          nextStepKey,
        }
      }

      // Create survey invitation
      const sendVia = config.send_via || 'email'
      const { data: invitation, error: invError } = await this.supabase
        .from('survey_invitations')
        .insert({
          survey_id: config.survey_id,
          client_id: clientId,
          service_id: serviceId,
          organization_id: client.organization_id,
          sent_via: sendVia,
        })
        .select('id, token')
        .single()

      if (invError || !invitation) {
        return {
          success: false,
          error: 'Failed to create survey invitation',
        }
      }

      // TODO: Send via email/SMS/portal based on send_via config
      // For now, just log the invitation
      console.log(
        `[WorkflowEngine] Survey invitation created for ${client.email}`,
        `Token: ${invitation.token}`,
        `Send via: ${sendVia}`
      )

      // Log to lead activities
      await this.supabase.from('lead_activities').insert({
        lead_id: clientId,
        activity_type: 'system',
        content: `Survey invitation sent: ${survey.name}`,
        activity_category: 'communication',
        metadata: {
          survey_id: config.survey_id,
          invitation_id: invitation.id,
          send_via: sendVia,
        },
      })

      return {
        success: true,
        output: {
          invitation_id: invitation.id,
          token: invitation.token,
          survey_name: survey.name,
          sent_via: sendVia,
        },
        nextStepKey,
      }
    } catch (error) {
      console.error('[WorkflowEngine] Error sending survey:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send survey',
      }
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
    const isAdvancedMode = config.decision_mode === 'advanced'
    const decisionBranches = config.decision_branches || []

    // Find the appropriate branch from step.branches
    const branches = step.branches as Array<{
      condition: string
      next_step_key: string
    }> | null

    if (isAdvancedMode && decisionBranches.length > 0) {
      // Advanced mode: evaluate each branch's conditions
      for (const branch of decisionBranches) {
        const branchMatches = this.evaluateBranchConditions(
          branch,
          context.record_data
        )

        if (branchMatches) {
          // Find the corresponding edge
          const matchingBranch = branches?.find(b => b.condition === branch.id)
          return {
            success: true,
            output: {
              mode: 'advanced',
              branch_matched: branch.label,
              branch_id: branch.id,
            },
            nextStepKey: matchingBranch?.next_step_key || null,
          }
        }
      }

      // No branch matched, use default
      const defaultBranch = branches?.find(b => b.condition === 'default')
      return {
        success: true,
        output: {
          mode: 'advanced',
          branch_matched: config.default_branch_label || 'Default',
          branch_id: 'default',
        },
        nextStepKey: defaultBranch?.next_step_key || null,
      }
    }

    // Simple mode: single condition evaluation
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
        mode: 'simple',
        condition_field: config.condition_field,
        field_value: fieldValue,
        condition_met: conditionMet,
        branch_taken: conditionMet ? 'true' : 'false',
      },
      nextStepKey,
    }
  }

  /**
   * Evaluate all condition groups for a decision branch
   */
  private evaluateBranchConditions(
    branch: NonNullable<StepConfig['decision_branches']>[number],
    recordData: Record<string, unknown>
  ): boolean {
    if (branch.condition_groups.length === 0) {
      return false
    }

    // Evaluate each group
    const groupResults = branch.condition_groups.map(group =>
      this.evaluateConditionGroup(group, recordData)
    )

    // Combine results based on branch.match_type
    if (branch.match_type === 'all') {
      return groupResults.every(r => r)
    } else {
      return groupResults.some(r => r)
    }
  }

  /**
   * Evaluate a single condition group
   */
  private evaluateConditionGroup(
    group: NonNullable<
      StepConfig['decision_branches']
    >[number]['condition_groups'][number],
    recordData: Record<string, unknown>
  ): boolean {
    if (group.conditions.length === 0) {
      return false
    }

    const conditionResults = group.conditions.map(condition =>
      this.evaluateSingleCondition(condition, recordData)
    )

    if (group.match_type === 'all') {
      return conditionResults.every(r => r)
    } else {
      return conditionResults.some(r => r)
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(
    condition: NonNullable<
      StepConfig['decision_branches']
    >[number]['condition_groups'][number]['conditions'][number],
    recordData: Record<string, unknown>
  ): boolean {
    const fieldValue = recordData[condition.field]
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return String(fieldValue) === String(conditionValue)
      case 'not_equals':
        return String(fieldValue) !== String(conditionValue)
      case 'contains':
        return String(fieldValue).includes(String(conditionValue))
      case 'not_contains':
        return !String(fieldValue).includes(String(conditionValue))
      case 'starts_with':
        return String(fieldValue).startsWith(String(conditionValue))
      case 'ends_with':
        return String(fieldValue).endsWith(String(conditionValue))
      case 'is_empty':
        return (
          fieldValue === null || fieldValue === undefined || fieldValue === ''
        )
      case 'is_not_empty':
        return (
          fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
        )
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue)
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue)
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(conditionValue)
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(conditionValue)
      default:
        return Boolean(fieldValue)
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
