import type { Node, Edge } from '@xyflow/react'

// ============================================================================
// Database Types (match migration schema)
// ============================================================================

export type WorkflowObjectType =
  | 'lead'
  | 'meeting'
  | 'payment'
  | 'invoice'
  | 'service'
  | 'document'
  | 'contract'
  | 'intake_form'

export type WorkflowTriggerType =
  | 'record_create'
  | 'record_update'
  | 'field_change'
  | 'scheduled'
  | 'manual'
  | 'form_submit'
  | 'payment_received'

export type WorkflowStepType =
  | 'trigger'
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'update_field'
  | 'create_record'
  | 'wait'
  | 'decision'
  | 'send_message'
  | 'webhook'
  | 'end'

export type WorkflowExecutionStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting'
  | 'cancelled'

export type StepExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export type WorkflowTemplateCategory =
  | 'onboarding'
  | 'reminders'
  | 'follow_up'
  | 'notifications'
  | 'billing'
  | 'custom'

// ============================================================================
// Database Row Types
// ============================================================================

export interface Workflow {
  id: string
  created_by: string | null
  name: string
  description: string | null
  object_type: WorkflowObjectType
  trigger_type: WorkflowTriggerType
  trigger_config: TriggerConfig
  is_active: boolean
  is_template: boolean
  evaluation_order: number
  canvas_data: CanvasData
  execution_count: number
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  step_order: number
  step_key: string
  step_type: WorkflowStepType
  step_config: StepConfig
  condition: StepCondition | null
  position_x: number
  position_y: number
  branches: StepBranch[] | null
  next_step_key: string | null
  created_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  record_type: string
  record_id: string
  status: WorkflowExecutionStatus
  current_step_key: string | null
  context: ExecutionContext
  error_message: string | null
  retry_count: number
  started_at: string
  completed_at: string | null
  next_run_at: string | null
  waiting_for: string | null
}

export interface WorkflowStepExecution {
  id: string
  execution_id: string
  step_id: string
  status: StepExecutionStatus
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string | null
  category: WorkflowTemplateCategory
  icon: string
  template_data: WorkflowTemplateData
  object_type: WorkflowObjectType
  trigger_type: WorkflowTriggerType
  is_active: boolean
  created_at: string
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface TriggerConfig {
  field?: string
  from_value?: string
  to_value?: string
  schedule?: {
    cron?: string
    relative_days?: number
    relative_field?: string
  }
}

export interface StepConfig {
  // Send Email
  template_id?: string
  template_name?: string
  to_field?: string
  to_type?: 'client' | 'admin' | 'custom'
  to_email?: string
  subject?: string
  body?: string // Email body content with variable support
  content?: string // Alias for body
  cta_text?: string // Call-to-action button text
  cta_url?: string // Call-to-action button URL

  // Create Task
  tasks?: TaskConfig[]
  title?: string
  action_type?: string
  assigned_to?: string

  // Update Field
  field?: string
  value?: string

  // Wait
  wait_days?: number
  wait_hours?: number
  wait_until_field?: string

  // Decision
  condition_field?: string
  condition_operator?:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
  condition_value?: string

  // Create Record
  record_type?: string
  record_data?: Record<string, unknown>

  // Webhook
  webhook_url?: string
  webhook_method?: 'GET' | 'POST' | 'PUT'
  webhook_headers?: Record<string, string>
  webhook_body?: Record<string, unknown>
}

export interface TaskConfig {
  title: string
  action_type: string
  priority?: number
  due_days?: number
}

export interface StepCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty'
  value?: string
}

export interface StepBranch {
  condition: string // 'true', 'false', or expression
  next_step_key: string
}

export interface ExecutionContext {
  trigger_type: string
  triggered_at: string
  record_data: Record<string, unknown>
  step_results?: Record<string, unknown>
}

export interface CanvasData {
  zoom?: number
  position?: { x: number; y: number }
  viewport?: { x: number; y: number; zoom: number }
}

export interface WorkflowTemplateData {
  workflow: {
    name: string
    description?: string
  }
  trigger_config?: TriggerConfig
  steps: Array<{
    step_key: string
    step_type: WorkflowStepType
    step_order: number
    position_x: number
    position_y: number
    step_config?: StepConfig
    condition?: StepCondition
    branches?: StepBranch[]
    next_step_key?: string
  }>
}

// ============================================================================
// Canvas Node Types (for @xyflow/react)
// ============================================================================

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  stepType: WorkflowStepType
  stepKey: string
  config: StepConfig
  condition?: StepCondition
  branches?: StepBranch[]
  isSelected?: boolean
  isRunning?: boolean
  isCompleted?: boolean
  isFailed?: boolean
}

export type WorkflowNode = Node<WorkflowNodeData, WorkflowStepType>

export interface WorkflowEdgeData extends Record<string, unknown> {
  condition?: string
  isActive?: boolean
}

export type WorkflowEdge = Edge<WorkflowEdgeData>

// ============================================================================
// UI Types
// ============================================================================

export interface NodePaletteItem {
  type: WorkflowStepType
  label: string
  description: string
  icon: string
  category: 'trigger' | 'action' | 'logic' | 'utility'
}

export const NODE_PALETTE: NodePaletteItem[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Entry point for the workflow',
    icon: 'Zap',
    category: 'trigger',
  },
  // Actions
  {
    type: 'send_email',
    label: 'Send Email',
    description: 'Send an email using a template',
    icon: 'Mail',
    category: 'action',
  },
  {
    type: 'send_sms',
    label: 'Send SMS',
    description: 'Send a text message',
    icon: 'MessageSquare',
    category: 'action',
  },
  {
    type: 'create_task',
    label: 'Create Task',
    description: 'Create an action item for the client',
    icon: 'CheckSquare',
    category: 'action',
  },
  {
    type: 'update_field',
    label: 'Update Field',
    description: 'Update a field on the record',
    icon: 'Edit',
    category: 'action',
  },
  {
    type: 'create_record',
    label: 'Create Record',
    description: 'Create a related record',
    icon: 'Plus',
    category: 'action',
  },
  {
    type: 'send_message',
    label: 'Portal Message',
    description: 'Send an in-app message',
    icon: 'MessageCircle',
    category: 'action',
  },
  // Logic
  {
    type: 'decision',
    label: 'Decision',
    description: 'Branch based on a condition',
    icon: 'GitBranch',
    category: 'logic',
  },
  {
    type: 'wait',
    label: 'Wait',
    description: 'Pause the workflow',
    icon: 'Clock',
    category: 'logic',
  },
  // Utility
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Call an external API',
    icon: 'Globe',
    category: 'utility',
  },
  {
    type: 'end',
    label: 'End',
    description: 'End the workflow',
    icon: 'Square',
    category: 'utility',
  },
]

export const OBJECT_TYPE_OPTIONS: {
  value: WorkflowObjectType
  label: string
}[] = [
  { value: 'lead', label: 'Lead / Client' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'payment', label: 'Payment' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'service', label: 'Service' },
  { value: 'document', label: 'Document' },
  { value: 'contract', label: 'Contract' },
  { value: 'intake_form', label: 'Intake Form' },
]

export const TRIGGER_TYPE_OPTIONS: {
  value: WorkflowTriggerType
  label: string
  description: string
}[] = [
  {
    value: 'record_create',
    label: 'Record Created',
    description: 'When a new record is created',
  },
  {
    value: 'record_update',
    label: 'Record Updated',
    description: 'When any field on a record changes',
  },
  {
    value: 'field_change',
    label: 'Field Changed',
    description: 'When a specific field changes value',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    description: 'Run on a schedule or relative to a date',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Triggered manually by a user',
  },
  {
    value: 'form_submit',
    label: 'Form Submitted',
    description: 'When a form is submitted',
  },
  {
    value: 'payment_received',
    label: 'Payment Received',
    description: 'When a payment is completed',
  },
]

// Field options per object type for trigger configuration
export const OBJECT_FIELDS: Record<
  WorkflowObjectType,
  { value: string; label: string }[]
> = {
  lead: [
    { value: 'status', label: 'Status' },
    { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
    { value: 'assigned_to_user_id', label: 'Assigned To' },
    { value: 'client_type', label: 'Client Type' },
    { value: 'service_interest', label: 'Service Interest' },
  ],
  meeting: [
    { value: 'status', label: 'Status' },
    { value: 'meeting_type', label: 'Meeting Type' },
  ],
  payment: [
    { value: 'status', label: 'Status' },
    { value: 'payment_method', label: 'Payment Method' },
  ],
  invoice: [
    { value: 'status', label: 'Status' },
    { value: 'payment_status', label: 'Payment Status' },
  ],
  service: [
    { value: 'status', label: 'Status' },
    { value: 'service_type', label: 'Service Type' },
  ],
  document: [{ value: 'document_type', label: 'Document Type' }],
  contract: [{ value: 'status', label: 'Status' }],
  intake_form: [{ value: 'status', label: 'Status' }],
}

// ============================================================================
// Form Types
// ============================================================================

export interface WorkflowFormData {
  name: string
  description: string
  object_type: WorkflowObjectType
  trigger_type: WorkflowTriggerType
  trigger_config: TriggerConfig
  is_active: boolean
}

export interface WorkflowWithSteps extends Workflow {
  steps: WorkflowStep[]
}

export interface WorkflowExecutionWithDetails extends WorkflowExecution {
  workflow: Workflow
  step_executions: WorkflowStepExecution[]
}
