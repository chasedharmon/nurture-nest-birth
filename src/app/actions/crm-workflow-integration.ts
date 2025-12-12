'use server'

/**
 * CRM-Workflow Automation Integration
 *
 * Connects CRM Activities and record changes with the Workflow Automation system.
 * This allows workflows to be triggered by:
 * - CRM Activity creation (meetings, calls, tasks)
 * - CRM record stage changes (leads, opportunities)
 * - CRM field updates
 */

import { createAdminClient } from '@/lib/supabase/server'
import { handleOpportunityStageChange } from './crm-invoicing-integration'
import type {
  CrmActivity,
  CrmLead,
  CrmOpportunity,
  CrmContact,
} from '@/lib/crm/types'
import type { Workflow } from '@/lib/workflows/types'

// =====================================================
// TYPES
// =====================================================

export type CrmObjectType =
  | 'Contact'
  | 'Account'
  | 'Lead'
  | 'Opportunity'
  | 'Activity'

export type CrmTriggerEvent =
  | 'record_create'
  | 'record_update'
  | 'field_change'
  | 'stage_change'
  | 'activity_completed'
  | 'activity_scheduled'

export interface CrmWorkflowTriggerContext {
  objectType: CrmObjectType
  event: CrmTriggerEvent
  recordId: string
  record: Record<string, unknown>
  previousValues?: Record<string, unknown>
  changedFields?: string[]
  userId?: string
}

export interface WorkflowTriggerResult {
  triggered: boolean
  workflowId: string | null
  executionId: string | null
  error: string | null
}

// =====================================================
// WORKFLOW TRIGGER MATCHING
// =====================================================

/**
 * Find workflows that match a CRM trigger event
 */
export async function findMatchingWorkflows(
  context: CrmWorkflowTriggerContext
): Promise<{ workflows: Workflow[]; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // Map CRM object types to workflow object types
    const objectTypeMap: Record<CrmObjectType, string> = {
      Contact: 'contact',
      Account: 'account',
      Lead: 'lead',
      Opportunity: 'opportunity',
      Activity: 'activity',
    }

    // Map CRM events to workflow trigger types
    const triggerTypeMap: Record<CrmTriggerEvent, string[]> = {
      record_create: ['record_create'],
      record_update: ['record_update', 'field_change'],
      field_change: ['field_change'],
      stage_change: ['field_change', 'record_update'],
      activity_completed: ['record_update', 'field_change'],
      activity_scheduled: ['record_create'],
    }

    const workflowObjectType = objectTypeMap[context.objectType]
    const triggerTypes = triggerTypeMap[context.event]

    // Query for matching workflows
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('object_type', workflowObjectType)
      .in('trigger_type', triggerTypes)
      .order('evaluation_order', { ascending: true })

    if (error) {
      return { workflows: [], error: error.message }
    }

    // Filter by entry criteria
    const matchingWorkflows = (workflows ?? []).filter(workflow =>
      evaluateEntryCriteria(workflow, context)
    )

    return { workflows: matchingWorkflows as Workflow[], error: null }
  } catch (err) {
    console.error('Error finding matching workflows:', err)
    return { workflows: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Evaluate if a record meets a workflow's entry criteria
 */
function evaluateEntryCriteria(
  workflow: Workflow,
  context: CrmWorkflowTriggerContext
): boolean {
  const criteria = workflow.entry_criteria

  if (!criteria || !criteria.conditions || criteria.conditions.length === 0) {
    return true // No criteria = always match
  }

  const record = context.record
  const matchType = criteria.match_type || 'all'

  const results = criteria.conditions.map(condition => {
    const fieldValue = record[condition.field]
    return evaluateCondition(condition, fieldValue)
  })

  if (matchType === 'all') {
    return results.every(r => r)
  } else {
    return results.some(r => r)
  }
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: { field: string; operator: string; value?: unknown },
  fieldValue: unknown
): boolean {
  const { operator, value } = condition

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'not_equals':
      return fieldValue !== value
    case 'contains':
      return String(fieldValue ?? '').includes(String(value ?? ''))
    case 'not_contains':
      return !String(fieldValue ?? '').includes(String(value ?? ''))
    case 'starts_with':
      return String(fieldValue ?? '').startsWith(String(value ?? ''))
    case 'ends_with':
      return String(fieldValue ?? '').endsWith(String(value ?? ''))
    case 'is_null':
      return fieldValue === null || fieldValue === undefined
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue)
    default:
      return false
  }
}

// =====================================================
// TRIGGER HANDLERS
// =====================================================

/**
 * Trigger workflows for a CRM event
 */
export async function triggerCrmWorkflows(
  context: CrmWorkflowTriggerContext
): Promise<WorkflowTriggerResult[]> {
  try {
    // Find matching workflows
    const { workflows, error } = await findMatchingWorkflows(context)

    if (error || workflows.length === 0) {
      return []
    }

    // Execute each matching workflow
    const results = await Promise.all(
      workflows.map(workflow => executeWorkflow(workflow.id, context))
    )

    return results
  } catch (err) {
    console.error('Error triggering CRM workflows:', err)
    return [
      {
        triggered: false,
        workflowId: null,
        executionId: null,
        error: 'An unexpected error occurred',
      },
    ]
  }
}

/**
 * Execute a workflow for a CRM record
 */
async function executeWorkflow(
  workflowId: string,
  context: CrmWorkflowTriggerContext
): Promise<WorkflowTriggerResult> {
  try {
    const supabase = createAdminClient()

    // Check re-entry rules
    const canEnter = await checkReentryRules(workflowId, context.recordId)
    if (!canEnter.allowed) {
      return {
        triggered: false,
        workflowId,
        executionId: null,
        error: canEnter.reason,
      }
    }

    // Create workflow execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        record_id: context.recordId,
        record_type: context.objectType.toLowerCase(),
        status: 'running',
        started_at: new Date().toISOString(),
        context_data: {
          event: context.event,
          changedFields: context.changedFields,
          previousValues: context.previousValues,
          triggeredBy: context.userId,
        },
      })
      .select()
      .single()

    if (execError) {
      return {
        triggered: false,
        workflowId,
        executionId: null,
        error: execError.message,
      }
    }

    // Update workflow execution count
    await supabase.rpc('increment_workflow_execution_count', {
      workflow_id: workflowId,
    })

    return {
      triggered: true,
      workflowId,
      executionId: execution.id,
      error: null,
    }
  } catch (err) {
    console.error('Error executing workflow:', err)
    return {
      triggered: false,
      workflowId,
      executionId: null,
      error: 'Failed to execute workflow',
    }
  }
}

/**
 * Check if a record can re-enter a workflow based on re-entry rules
 */
async function checkReentryRules(
  workflowId: string,
  recordId: string
): Promise<{ allowed: boolean; reason: string | null }> {
  try {
    const supabase = createAdminClient()

    // Get workflow re-entry settings
    const { data: workflow } = await supabase
      .from('workflows')
      .select('reentry_mode, reentry_wait_days')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return { allowed: false, reason: 'Workflow not found' }
    }

    const { reentry_mode, reentry_wait_days } = workflow

    switch (reentry_mode) {
      case 'allow_all':
        return { allowed: true, reason: null }

      case 'once_only': {
        // Check if this record has ever entered this workflow
        const { data: existing } = await supabase
          .from('workflow_executions')
          .select('id')
          .eq('workflow_id', workflowId)
          .eq('record_id', recordId)
          .limit(1)

        if (existing && existing.length > 0) {
          return {
            allowed: false,
            reason: 'Record has already entered this workflow',
          }
        }
        return { allowed: true, reason: null }
      }

      case 'wait_period': {
        // Check if enough time has passed since last execution
        const { data: lastExecution } = await supabase
          .from('workflow_executions')
          .select('started_at')
          .eq('workflow_id', workflowId)
          .eq('record_id', recordId)
          .order('started_at', { ascending: false })
          .limit(1)

        const lastEntry = lastExecution?.[0]
        if (!lastEntry) {
          return { allowed: true, reason: null }
        }

        const lastStarted = new Date(lastEntry.started_at)
        const waitDays = reentry_wait_days || 0
        const waitUntil = new Date(lastStarted)
        waitUntil.setDate(waitUntil.getDate() + waitDays)

        if (new Date() < waitUntil) {
          return {
            allowed: false,
            reason: `Must wait until ${waitUntil.toLocaleDateString()} to re-enter`,
          }
        }
        return { allowed: true, reason: null }
      }

      default:
        return { allowed: true, reason: null }
    }
  } catch {
    // On error, allow execution
    return { allowed: true, reason: null }
  }
}

// =====================================================
// CRM ACTIVITY HANDLERS
// =====================================================

/**
 * Handle CRM Activity creation - trigger workflows
 */
export async function onActivityCreated(
  activity: CrmActivity
): Promise<WorkflowTriggerResult[]> {
  // Check if activity has a future due_date to determine if it's scheduled
  const isScheduled =
    activity.due_date && new Date(activity.due_date) > new Date()

  const context: CrmWorkflowTriggerContext = {
    objectType: 'Activity',
    event: isScheduled ? 'activity_scheduled' : 'record_create',
    recordId: activity.id,
    record: activity as unknown as Record<string, unknown>,
  }

  return triggerCrmWorkflows(context)
}

/**
 * Handle CRM Activity completion - trigger workflows
 */
export async function onActivityCompleted(
  activity: CrmActivity
): Promise<WorkflowTriggerResult[]> {
  const context: CrmWorkflowTriggerContext = {
    objectType: 'Activity',
    event: 'activity_completed',
    recordId: activity.id,
    record: activity as unknown as Record<string, unknown>,
    changedFields: ['status', 'completed_at'],
    previousValues: { status: 'open' },
  }

  return triggerCrmWorkflows(context)
}

// =====================================================
// CRM RECORD CHANGE HANDLERS
// =====================================================

/**
 * Handle CRM Opportunity stage change
 * This also triggers invoice generation for closed-won opportunities
 */
export async function onOpportunityStageChange(
  opportunity: CrmOpportunity,
  previousStage: string,
  newStage: string
): Promise<{
  workflowResults: WorkflowTriggerResult[]
  invoiceCreated: boolean
  invoiceId: string | null
}> {
  // Trigger workflows
  const context: CrmWorkflowTriggerContext = {
    objectType: 'Opportunity',
    event: 'stage_change',
    recordId: opportunity.id,
    record: opportunity as unknown as Record<string, unknown>,
    changedFields: ['stage'],
    previousValues: { stage: previousStage },
  }

  const workflowResults = await triggerCrmWorkflows(context)

  // Handle invoice generation for closed-won
  const invoiceResult = await handleOpportunityStageChange(
    opportunity.id,
    previousStage,
    newStage
  )

  return {
    workflowResults,
    invoiceCreated: invoiceResult.invoiceCreated,
    invoiceId: invoiceResult.invoiceId,
  }
}

/**
 * Handle CRM Lead status change
 */
export async function onLeadStatusChange(
  lead: CrmLead,
  previousStatus: string,
  _newStatus: string
): Promise<WorkflowTriggerResult[]> {
  // Note: newStatus is available via lead.lead_status (current value)
  const context: CrmWorkflowTriggerContext = {
    objectType: 'Lead',
    event: 'stage_change',
    recordId: lead.id,
    record: lead as unknown as Record<string, unknown>,
    changedFields: ['lead_status'],
    previousValues: { lead_status: previousStatus },
  }

  return triggerCrmWorkflows(context)
}

/**
 * Handle CRM Contact update
 */
export async function onContactUpdated(
  contact: CrmContact,
  changedFields: string[],
  previousValues: Record<string, unknown>
): Promise<WorkflowTriggerResult[]> {
  const context: CrmWorkflowTriggerContext = {
    objectType: 'Contact',
    event: 'record_update',
    recordId: contact.id,
    record: contact as unknown as Record<string, unknown>,
    changedFields,
    previousValues,
  }

  return triggerCrmWorkflows(context)
}

// =====================================================
// CREATE ACTIVITY FROM WORKFLOW
// =====================================================

/**
 * Create a CRM Activity from a workflow step.
 * Used by workflow 'create_task' and 'create_record' actions.
 */
export async function createActivityFromWorkflow(input: {
  activityType: 'task' | 'call' | 'meeting' | 'email' | 'note'
  subject: string
  description?: string
  dueDate?: string
  relatedToType?: CrmObjectType
  relatedToId?: string
  whoId?: string // Contact or Lead ID
  ownerId?: string
  priority?: 'low' | 'normal' | 'high'
  workflowExecutionId?: string
}): Promise<{ data: CrmActivity | null; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const { data: activity, error } = await supabase
      .from('crm_activities')
      .insert({
        activity_type: input.activityType,
        subject: input.subject,
        description: input.description,
        due_date: input.dueDate,
        related_to_type: input.relatedToType,
        related_to_id: input.relatedToId,
        who_id: input.whoId,
        owner_id: input.ownerId,
        priority: input.priority || 'normal',
        status: input.dueDate ? 'scheduled' : 'open',
        created_by_workflow: input.workflowExecutionId ? true : false,
        workflow_execution_id: input.workflowExecutionId,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    // Trigger activity created workflows (but avoid infinite loops)
    if (!input.workflowExecutionId) {
      await onActivityCreated(activity as CrmActivity)
    }

    return { data: activity as CrmActivity, error: null }
  } catch (err) {
    console.error('Error creating activity from workflow:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
