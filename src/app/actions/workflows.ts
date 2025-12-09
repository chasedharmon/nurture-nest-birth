'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStepExecution,
  WorkflowTemplate,
  WorkflowFormData,
  WorkflowWithSteps,
  TriggerConfig,
  StepConfig,
  StepCondition,
  StepBranch,
  CanvasData,
} from '@/lib/workflows/types'

// ============================================================================
// Workflow CRUD Operations
// ============================================================================

export async function getWorkflows() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Workflows] Failed to fetch workflows:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Workflow[], error: null }
}

export async function getWorkflow(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Workflows] Failed to fetch workflow:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Workflow, error: null }
}

export async function getWorkflowWithSteps(id: string) {
  const supabase = await createClient()

  // Fetch workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (workflowError) {
    console.error('[Workflows] Failed to fetch workflow:', workflowError)
    return { data: null, error: workflowError.message }
  }

  // Fetch steps
  const { data: steps, error: stepsError } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', id)
    .order('step_order', { ascending: true })

  if (stepsError) {
    console.error('[Workflows] Failed to fetch steps:', stepsError)
    return { data: null, error: stepsError.message }
  }

  return {
    data: {
      ...workflow,
      steps: steps as WorkflowStep[],
    } as WorkflowWithSteps,
    error: null,
  }
}

export async function createWorkflow(formData: WorkflowFormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      name: formData.name,
      description: formData.description || null,
      object_type: formData.object_type,
      trigger_type: formData.trigger_type,
      trigger_config: formData.trigger_config || {},
      is_active: formData.is_active,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[Workflows] Failed to create workflow:', error)
    return { data: null, error: error.message }
  }

  // Create initial trigger node
  const { error: stepError } = await supabase.from('workflow_steps').insert({
    workflow_id: data.id,
    step_key: 'trigger',
    step_type: 'trigger',
    step_order: 1,
    position_x: 250,
    position_y: 50,
    step_config: {},
  })

  if (stepError) {
    console.error('[Workflows] Failed to create trigger step:', stepError)
  }

  revalidatePath('/admin/workflows')
  return { data: data as Workflow, error: null }
}

export async function updateWorkflow(
  id: string,
  formData: Partial<WorkflowFormData>
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}

  if (formData.name !== undefined) updateData.name = formData.name
  if (formData.description !== undefined)
    updateData.description = formData.description
  if (formData.object_type !== undefined)
    updateData.object_type = formData.object_type
  if (formData.trigger_type !== undefined)
    updateData.trigger_type = formData.trigger_type
  if (formData.trigger_config !== undefined)
    updateData.trigger_config = formData.trigger_config
  if (formData.is_active !== undefined)
    updateData.is_active = formData.is_active

  const { data, error } = await supabase
    .from('workflows')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Workflows] Failed to update workflow:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/admin/workflows')
  revalidatePath(`/admin/workflows/${id}`)
  return { data: data as Workflow, error: null }
}

export async function deleteWorkflow(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('workflows').delete().eq('id', id)

  if (error) {
    console.error('[Workflows] Failed to delete workflow:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/workflows')
  return { success: true, error: null }
}

export interface WorkflowValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateWorkflow(
  id: string
): Promise<WorkflowValidationResult> {
  const { data: workflow, error } = await getWorkflowWithSteps(id)

  if (error || !workflow) {
    return {
      isValid: false,
      errors: ['Workflow not found'],
      warnings: [],
    }
  }

  const errors: string[] = []
  const warnings: string[] = []
  const steps = workflow.steps

  // Check 1: Must have a trigger node
  const triggerNode = steps.find(s => s.step_type === 'trigger')
  if (!triggerNode) {
    errors.push('Workflow must have a trigger node')
  }

  // Check 2: Must have at least one action node after trigger
  const actionNodes = steps.filter(s => s.step_type !== 'trigger')
  if (actionNodes.length === 0) {
    errors.push(
      'Workflow must have at least one action or step after the trigger'
    )
  }

  // Check 3: Check for orphaned nodes (nodes with no incoming connection except trigger)
  const connectedStepKeys = new Set<string>()
  connectedStepKeys.add('trigger') // Trigger is always the start

  steps.forEach(step => {
    if (step.next_step_key) {
      connectedStepKeys.add(step.next_step_key)
    }
    // Check branches for decision nodes
    if (step.branches) {
      step.branches.forEach(branch => {
        if (branch.next_step_key) {
          connectedStepKeys.add(branch.next_step_key)
        }
      })
    }
  })

  const orphanedNodes = steps.filter(
    s => s.step_type !== 'trigger' && !connectedStepKeys.has(s.step_key)
  )

  if (orphanedNodes.length > 0) {
    warnings.push(
      `${orphanedNodes.length} node(s) are not connected and will not be executed`
    )
  }

  // Check 4: Trigger must have a next step
  if (triggerNode && !triggerNode.next_step_key) {
    errors.push('Trigger must be connected to at least one step')
  }

  // Check 5: Decision nodes must have branches defined
  const decisionNodes = steps.filter(s => s.step_type === 'decision')
  decisionNodes.forEach(node => {
    if (!node.branches || node.branches.length === 0) {
      errors.push(`Decision node "${node.step_key}" has no branches defined`)
    } else {
      const hasTrueBranch = node.branches.some(b => b.condition === 'true')
      const hasFalseBranch = node.branches.some(b => b.condition === 'false')
      if (!hasTrueBranch || !hasFalseBranch) {
        warnings.push(
          `Decision node "${node.step_key}" is missing Yes or No branch`
        )
      }
    }
  })

  // Check 6: Send email nodes should have template or body configured
  const emailNodes = steps.filter(s => s.step_type === 'send_email')
  emailNodes.forEach(node => {
    const config = node.step_config
    if (!config.template_id && !config.body && !config.content) {
      warnings.push(
        `Email node "${node.step_key}" has no template or content configured`
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export async function toggleWorkflowActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  // If activating, validate the workflow first
  if (isActive) {
    const validation = await validateWorkflow(id)
    if (!validation.isValid) {
      return {
        data: null,
        error: `Cannot activate workflow: ${validation.errors.join('. ')}`,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
      }
    }
  }

  const { data, error } = await supabase
    .from('workflows')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Workflows] Failed to toggle workflow:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/admin/workflows')
  return { data: data as Workflow, error: null }
}

export async function duplicateWorkflow(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get original workflow with steps
  const { data: original, error: fetchError } = await getWorkflowWithSteps(id)

  if (fetchError || !original) {
    return { data: null, error: fetchError || 'Workflow not found' }
  }

  // Create new workflow
  const { data: newWorkflow, error: createError } = await supabase
    .from('workflows')
    .insert({
      name: `${original.name} (Copy)`,
      description: original.description,
      object_type: original.object_type,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      is_active: false, // Start inactive
      canvas_data: original.canvas_data,
      created_by: user?.id,
    })
    .select()
    .single()

  if (createError) {
    console.error('[Workflows] Failed to duplicate workflow:', createError)
    return { data: null, error: createError.message }
  }

  // Copy steps
  if (original.steps.length > 0) {
    const newSteps = original.steps.map(step => ({
      workflow_id: newWorkflow.id,
      step_key: step.step_key,
      step_type: step.step_type,
      step_order: step.step_order,
      step_config: step.step_config,
      condition: step.condition,
      position_x: step.position_x,
      position_y: step.position_y,
      branches: step.branches,
      next_step_key: step.next_step_key,
    }))

    const { error: stepsError } = await supabase
      .from('workflow_steps')
      .insert(newSteps)

    if (stepsError) {
      console.error('[Workflows] Failed to copy steps:', stepsError)
    }
  }

  revalidatePath('/admin/workflows')
  return { data: newWorkflow as Workflow, error: null }
}

// ============================================================================
// Workflow Steps CRUD
// ============================================================================

export async function getWorkflowSteps(workflowId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_order', { ascending: true })

  if (error) {
    console.error('[Workflows] Failed to fetch steps:', error)
    return { data: null, error: error.message }
  }

  return { data: data as WorkflowStep[], error: null }
}

export async function createWorkflowStep(
  workflowId: string,
  step: {
    step_key: string
    step_type: string
    step_order: number
    step_config?: StepConfig
    condition?: StepCondition | null
    position_x?: number
    position_y?: number
    branches?: StepBranch[] | null
    next_step_key?: string | null
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflow_steps')
    .insert({
      workflow_id: workflowId,
      step_key: step.step_key,
      step_type: step.step_type,
      step_order: step.step_order,
      step_config: step.step_config || {},
      condition: step.condition || null,
      position_x: step.position_x || 0,
      position_y: step.position_y || 0,
      branches: step.branches || null,
      next_step_key: step.next_step_key || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Workflows] Failed to create step:', error)
    return { data: null, error: error.message }
  }

  return { data: data as WorkflowStep, error: null }
}

export async function updateWorkflowStep(
  stepId: string,
  updates: Partial<{
    step_order: number
    step_config: StepConfig
    condition: StepCondition | null
    position_x: number
    position_y: number
    branches: StepBranch[] | null
    next_step_key: string | null
  }>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflow_steps')
    .update(updates)
    .eq('id', stepId)
    .select()
    .single()

  if (error) {
    console.error('[Workflows] Failed to update step:', error)
    return { data: null, error: error.message }
  }

  return { data: data as WorkflowStep, error: null }
}

export async function deleteWorkflowStep(stepId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workflow_steps')
    .delete()
    .eq('id', stepId)

  if (error) {
    console.error('[Workflows] Failed to delete step:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function saveWorkflowCanvas(
  workflowId: string,
  steps: Array<{
    id?: string
    step_key: string
    step_type: string
    step_order: number
    step_config: StepConfig
    condition?: StepCondition | null
    position_x: number
    position_y: number
    branches?: StepBranch[] | null
    next_step_key?: string | null
  }>,
  canvasData: CanvasData
) {
  const supabase = await createClient()

  // Start a transaction-like operation
  // First, update the workflow canvas data
  const { error: workflowError } = await supabase
    .from('workflows')
    .update({ canvas_data: canvasData })
    .eq('id', workflowId)

  if (workflowError) {
    console.error('[Workflows] Failed to update canvas data:', workflowError)
    return { success: false, error: workflowError.message }
  }

  // Get existing steps
  const { data: existingSteps } = await supabase
    .from('workflow_steps')
    .select('id, step_key')
    .eq('workflow_id', workflowId)

  const existingStepMap = new Map(
    (existingSteps || []).map(s => [s.step_key, s.id])
  )

  // Process each step
  for (const step of steps) {
    const existingId = existingStepMap.get(step.step_key)

    if (existingId) {
      // Update existing step
      const { error } = await supabase
        .from('workflow_steps')
        .update({
          step_order: step.step_order,
          step_config: step.step_config,
          condition: step.condition || null,
          position_x: step.position_x,
          position_y: step.position_y,
          branches: step.branches || null,
          next_step_key: step.next_step_key || null,
        })
        .eq('id', existingId)

      if (error) {
        console.error('[Workflows] Failed to update step:', error)
      }

      // Remove from map so we know it's been processed
      existingStepMap.delete(step.step_key)
    } else {
      // Create new step
      const { error } = await supabase.from('workflow_steps').insert({
        workflow_id: workflowId,
        step_key: step.step_key,
        step_type: step.step_type,
        step_order: step.step_order,
        step_config: step.step_config,
        condition: step.condition || null,
        position_x: step.position_x,
        position_y: step.position_y,
        branches: step.branches || null,
        next_step_key: step.next_step_key || null,
      })

      if (error) {
        console.error('[Workflows] Failed to create step:', error)
      }
    }
  }

  // Delete steps that are no longer in the canvas
  for (const [, stepId] of existingStepMap) {
    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', stepId)

    if (error) {
      console.error('[Workflows] Failed to delete step:', error)
    }
  }

  revalidatePath(`/admin/workflows/${workflowId}`)
  return { success: true, error: null }
}

// ============================================================================
// Workflow Templates
// ============================================================================

export async function getWorkflowTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflow_templates')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })

  if (error) {
    console.error('[Workflows] Failed to fetch templates:', error)
    return { data: null, error: error.message }
  }

  return { data: data as WorkflowTemplate[], error: null }
}

export async function createWorkflowFromTemplate(templateId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('workflow_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    return { data: null, error: templateError?.message || 'Template not found' }
  }

  const templateData = template.template_data as {
    workflow: { name: string; description?: string }
    trigger_config?: TriggerConfig
    steps: Array<{
      step_key: string
      step_type: string
      step_order: number
      position_x: number
      position_y: number
      step_config?: StepConfig
      condition?: StepCondition
      branches?: StepBranch[]
      next_step_key?: string
    }>
  }

  // Create workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .insert({
      name: templateData.workflow.name,
      description: templateData.workflow.description || null,
      object_type: template.object_type,
      trigger_type: template.trigger_type,
      trigger_config: templateData.trigger_config || {},
      is_active: false,
      created_by: user?.id,
    })
    .select()
    .single()

  if (workflowError) {
    console.error(
      '[Workflows] Failed to create workflow from template:',
      workflowError
    )
    return { data: null, error: workflowError.message }
  }

  // Create steps
  const steps = templateData.steps.map(step => ({
    workflow_id: workflow.id,
    step_key: step.step_key,
    step_type: step.step_type,
    step_order: step.step_order,
    step_config: step.step_config || {},
    condition: step.condition || null,
    position_x: step.position_x,
    position_y: step.position_y,
    branches: step.branches || null,
    next_step_key: step.next_step_key || null,
  }))

  const { error: stepsError } = await supabase
    .from('workflow_steps')
    .insert(steps)

  if (stepsError) {
    console.error(
      '[Workflows] Failed to create steps from template:',
      stepsError
    )
  }

  revalidatePath('/admin/workflows')
  return { data: workflow as Workflow, error: null }
}

// ============================================================================
// Workflow Executions
// ============================================================================

export async function getWorkflowExecutions(workflowId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Workflows] Failed to fetch executions:', error)
    return { data: null, error: error.message }
  }

  return { data: data as WorkflowExecution[], error: null }
}

export async function getWorkflowExecution(executionId: string) {
  const supabase = await createClient()

  const { data: execution, error: executionError } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single()

  if (executionError) {
    console.error('[Workflows] Failed to fetch execution:', executionError)
    return { data: null, error: executionError.message }
  }

  const { data: stepExecutions, error: stepsError } = await supabase
    .from('workflow_step_executions')
    .select('*')
    .eq('execution_id', executionId)
    .order('started_at', { ascending: true })

  if (stepsError) {
    console.error('[Workflows] Failed to fetch step executions:', stepsError)
  }

  return {
    data: {
      ...execution,
      step_executions: stepExecutions || [],
    } as WorkflowExecution & { step_executions: WorkflowStepExecution[] },
    error: null,
  }
}

export async function cancelWorkflowExecution(executionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workflow_executions')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId)

  if (error) {
    console.error('[Workflows] Failed to cancel execution:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function retryWorkflowExecution(executionId: string) {
  const supabase = await createClient()

  // Get the execution
  const { data: execution, error: fetchError } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single()

  if (fetchError || !execution) {
    return {
      success: false,
      error: fetchError?.message || 'Execution not found',
    }
  }

  // Reset the execution
  const { error: updateError } = await supabase
    .from('workflow_executions')
    .update({
      status: 'running',
      error_message: null,
      retry_count: execution.retry_count + 1,
      completed_at: null,
    })
    .eq('id', executionId)

  if (updateError) {
    console.error('[Workflows] Failed to retry execution:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true, error: null }
}

// ============================================================================
// Manual Workflow Execution
// ============================================================================

export async function triggerWorkflowManually(
  workflowId: string,
  recordType: string,
  recordId: string
) {
  const supabase = await createClient()

  // Get the workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single()

  if (workflowError || !workflow) {
    return { data: null, error: workflowError?.message || 'Workflow not found' }
  }

  if (!workflow.is_active) {
    return { data: null, error: 'Workflow is not active' }
  }

  // Get the record data
  const { data: record, error: recordError } = await supabase
    .from(recordType === 'lead' ? 'leads' : `${recordType}s`)
    .select('*')
    .eq('id', recordId)
    .single()

  if (recordError) {
    console.error('[Workflows] Failed to fetch record:', recordError)
    return { data: null, error: recordError.message }
  }

  // Create execution
  const { data: execution, error: executionError } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      record_type: recordType,
      record_id: recordId,
      status: 'running',
      context: {
        trigger_type: 'manual',
        triggered_at: new Date().toISOString(),
        record_data: record,
      },
    })
    .select()
    .single()

  if (executionError) {
    console.error('[Workflows] Failed to create execution:', executionError)
    return { data: null, error: executionError.message }
  }

  // Update workflow stats
  await supabase
    .from('workflows')
    .update({
      execution_count: workflow.execution_count + 1,
      last_executed_at: new Date().toISOString(),
    })
    .eq('id', workflowId)

  return { data: execution as WorkflowExecution, error: null }
}

export async function getRecordsForTrigger(objectType: string): Promise<{
  data: Array<{ id: string; name: string; email?: string }> | null
  error: string | null
}> {
  const supabase = await createClient()

  // Map object types to their table names and fields
  const tableConfig: Record<
    string,
    { table: string; nameField: string; emailField?: string }
  > = {
    lead: { table: 'leads', nameField: 'full_name', emailField: 'email' },
    meeting: { table: 'meetings', nameField: 'title' },
    payment: { table: 'payments', nameField: 'description' },
    invoice: { table: 'invoices', nameField: 'invoice_number' },
    service: { table: 'services', nameField: 'name' },
    document: { table: 'documents', nameField: 'title' },
    contract: { table: 'contracts', nameField: 'title' },
    intake_form: { table: 'intake_form_submissions', nameField: 'id' },
  }

  const config = tableConfig[objectType]
  if (!config) {
    return { data: null, error: `Unknown object type: ${objectType}` }
  }

  // Build select fields
  const selectFields = config.emailField
    ? `id, ${config.nameField}, ${config.emailField}`
    : `id, ${config.nameField}`

  const { data, error } = await supabase
    .from(config.table)
    .select(selectFields)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error(`[Workflows] Failed to fetch ${objectType} records:`, error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: [], error: null }
  }

  // Transform the data to have consistent name/email fields
  const records = data.map(row => {
    const record = row as unknown as Record<string, unknown>
    const id = record.id as string
    const name = (record[config.nameField] as string) || id
    const email = config.emailField
      ? (record[config.emailField] as string | undefined)
      : undefined
    return { id, name, email }
  })

  return { data: records, error: null }
}
