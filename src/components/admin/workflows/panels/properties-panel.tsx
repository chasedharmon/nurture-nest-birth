'use client'

import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import { VariablePicker } from '../variable-picker'
import type {
  WorkflowNode,
  StepConfig,
  WorkflowObjectType,
} from '@/lib/workflows/types'

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null
  onUpdateNode: (nodeId: string, config: StepConfig) => void
  onDeleteNode: (nodeId: string) => void
  emailTemplates?: { id: string; name: string }[]
  objectType?: WorkflowObjectType
}

export function PropertiesPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  emailTemplates = [],
  objectType,
}: PropertiesPanelProps) {
  const form = useForm<StepConfig>({
    defaultValues: selectedNode?.data.config || {},
  })

  useEffect(() => {
    if (selectedNode) {
      form.reset(selectedNode.data.config || {})
    }
  }, [selectedNode, form])

  const handleSubmit = useCallback(
    (data: StepConfig) => {
      if (selectedNode) {
        onUpdateNode(selectedNode.id, data)
      }
    },
    [selectedNode, onUpdateNode]
  )

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (selectedNode) {
      const values = form.getValues()
      onUpdateNode(selectedNode.id, values)
    }
  }, [selectedNode, form, onUpdateNode])

  if (!selectedNode) {
    return (
      <div className="w-72 border-l bg-muted/30 flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a node to view and edit its properties
        </p>
      </div>
    )
  }

  const stepType = selectedNode.data.stepType

  return (
    <div className="w-72 border-l bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">{selectedNode.data.label}</h3>
        <p className="text-xs text-muted-foreground capitalize">
          {stepType.replace('_', ' ')}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-3 space-y-4"
        >
          {/* Common configuration based on step type */}
          {stepType === 'send_email' && (
            <SendEmailConfig
              form={form}
              onBlur={handleBlur}
              emailTemplates={emailTemplates}
              objectType={objectType}
            />
          )}

          {stepType === 'send_sms' && (
            <SendSmsConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'create_task' && (
            <CreateTaskConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'update_field' && (
            <UpdateFieldConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'wait' && (
            <WaitConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'decision' && (
            <DecisionConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'webhook' && (
            <WebhookConfig form={form} onBlur={handleBlur} />
          )}

          {stepType === 'trigger' && (
            <div className="text-sm text-muted-foreground">
              The trigger node is configured at the workflow level.
            </div>
          )}

          {stepType === 'end' && (
            <div className="text-sm text-muted-foreground">
              The end node marks the completion of this workflow path.
            </div>
          )}
        </form>
      </ScrollArea>

      {/* Delete button */}
      {stepType !== 'trigger' && (
        <div className="p-3 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onDeleteNode(selectedNode.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Node
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Step-specific config components
// ============================================================================

interface ConfigProps {
  form: ReturnType<typeof useForm<StepConfig>>
  onBlur: () => void
  emailTemplates?: { id: string; name: string }[]
  objectType?: WorkflowObjectType
}

function SendEmailConfig({
  form,
  onBlur,
  emailTemplates = [],
  objectType,
}: ConfigProps) {
  // Append variable to the end of a field value
  const insertVariable = (variable: string, field: 'subject' | 'body') => {
    const currentValue = form.getValues(field) || ''
    form.setValue(field, currentValue + variable)
    onBlur()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="template_name" className="text-xs">
          Email Template
        </Label>
        <Select
          value={form.watch('template_name') || ''}
          onValueChange={value => {
            form.setValue('template_name', value)
            onBlur()
          }}
        >
          <SelectTrigger id="template_name">
            <SelectValue placeholder="Select template (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No template (custom content)</SelectItem>
            {emailTemplates.map(template => (
              <SelectItem key={template.id} value={template.name}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="to_type" className="text-xs">
          Send To
        </Label>
        <Select
          value={form.watch('to_type') || 'client'}
          onValueChange={value => {
            form.setValue('to_type', value as 'client' | 'admin' | 'custom')
            onBlur()
          }}
        >
          <SelectTrigger id="to_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client (from record)</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="custom">Custom email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.watch('to_type') === 'custom' && (
        <div className="space-y-1.5">
          <Label htmlFor="to_email" className="text-xs">
            Email Address
          </Label>
          <Input
            id="to_email"
            placeholder="email@example.com"
            {...form.register('to_email')}
            onBlur={onBlur}
          />
        </div>
      )}

      {form.watch('to_type') === 'client' && (
        <div className="space-y-1.5">
          <Label htmlFor="to_field" className="text-xs">
            Email Field
          </Label>
          <Input
            id="to_field"
            placeholder="email"
            {...form.register('to_field')}
            onBlur={onBlur}
          />
          <p className="text-xs text-muted-foreground">
            Field name on the record containing the email
          </p>
        </div>
      )}

      <Separator />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="subject" className="text-xs">
            Subject
          </Label>
          <VariablePicker
            objectType={objectType}
            onSelect={v => insertVariable(v, 'subject')}
          />
        </div>
        <Input
          id="subject"
          placeholder="Welcome to {{doula_name}}!"
          {...form.register('subject')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="body" className="text-xs">
            Email Body
          </Label>
          <VariablePicker
            objectType={objectType}
            onSelect={v => insertVariable(v, 'body')}
          />
        </div>
        <Textarea
          id="body"
          placeholder="Hi {{first_name}},\n\nWelcome to our practice!"
          rows={5}
          className="text-xs resize-none"
          {...form.register('body')}
          onBlur={onBlur}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{variable}}'} syntax for dynamic content
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cta_text" className="text-xs">
          Button Text (optional)
        </Label>
        <Input
          id="cta_text"
          placeholder="View Portal"
          {...form.register('cta_text')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cta_url" className="text-xs">
          Button URL (optional)
        </Label>
        <Input
          id="cta_url"
          placeholder="{{portal_url}}"
          {...form.register('cta_url')}
          onBlur={onBlur}
        />
      </div>
    </div>
  )
}

function SendSmsConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="to_field" className="text-xs">
          Phone Field
        </Label>
        <Input
          id="to_field"
          placeholder="phone"
          {...form.register('to_field')}
          onBlur={onBlur}
        />
        <p className="text-xs text-muted-foreground">
          Field name on the record containing the phone number
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="template_name" className="text-xs">
          SMS Template
        </Label>
        <Input
          id="template_name"
          placeholder="Template name"
          {...form.register('template_name')}
          onBlur={onBlur}
        />
      </div>
    </div>
  )
}

function CreateTaskConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs">
          Task Title
        </Label>
        <Input
          id="title"
          placeholder="Review intake form"
          {...form.register('title')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="action_type" className="text-xs">
          Action Type
        </Label>
        <Select
          value={form.watch('action_type') || 'custom'}
          onValueChange={value => {
            form.setValue('action_type', value)
            onBlur()
          }}
        >
          <SelectTrigger id="action_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="intake_form">Complete Intake Form</SelectItem>
            <SelectItem value="sign_contract">Sign Contract</SelectItem>
            <SelectItem value="upload_document">Upload Document</SelectItem>
            <SelectItem value="schedule_meeting">Schedule Meeting</SelectItem>
            <SelectItem value="make_payment">Make Payment</SelectItem>
            <SelectItem value="review_document">Review Document</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assigned_to" className="text-xs">
          Assign To
        </Label>
        <Select
          value={form.watch('assigned_to') || 'owner'}
          onValueChange={value => {
            form.setValue('assigned_to', value)
            onBlur()
          }}
        >
          <SelectTrigger id="assigned_to">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Record Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function UpdateFieldConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="field" className="text-xs">
          Field to Update
        </Label>
        <Input
          id="field"
          placeholder="status"
          {...form.register('field')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="value" className="text-xs">
          New Value
        </Label>
        <Input
          id="value"
          placeholder="client"
          {...form.register('value')}
          onBlur={onBlur}
        />
      </div>
    </div>
  )
}

function WaitConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="wait_days" className="text-xs">
          Wait Days
        </Label>
        <Input
          id="wait_days"
          type="number"
          min={0}
          placeholder="3"
          {...form.register('wait_days', { valueAsNumber: true })}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wait_hours" className="text-xs">
          Wait Hours
        </Label>
        <Input
          id="wait_hours"
          type="number"
          min={0}
          max={23}
          placeholder="0"
          {...form.register('wait_hours', { valueAsNumber: true })}
          onBlur={onBlur}
        />
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="wait_until_field" className="text-xs">
          Or Wait Until (Date Field)
        </Label>
        <Input
          id="wait_until_field"
          placeholder="expected_due_date"
          {...form.register('wait_until_field')}
          onBlur={onBlur}
        />
        <p className="text-xs text-muted-foreground">
          Wait until the specified date field on the record
        </p>
      </div>
    </div>
  )
}

function DecisionConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="condition_field" className="text-xs">
          Field to Check
        </Label>
        <Input
          id="condition_field"
          placeholder="status"
          {...form.register('condition_field')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condition_operator" className="text-xs">
          Operator
        </Label>
        <Select
          value={form.watch('condition_operator') || 'equals'}
          onValueChange={value => {
            form.setValue(
              'condition_operator',
              value as StepConfig['condition_operator']
            )
            onBlur()
          }}
        >
          <SelectTrigger id="condition_operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="greater_than">Greater Than</SelectItem>
            <SelectItem value="less_than">Less Than</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condition_value" className="text-xs">
          Value
        </Label>
        <Input
          id="condition_value"
          placeholder="client"
          {...form.register('condition_value')}
          onBlur={onBlur}
        />
      </div>

      <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
        <p>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />
          Green handle = condition is true
        </p>
        <p className="mt-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" />
          Red handle = condition is false
        </p>
      </div>
    </div>
  )
}

function WebhookConfig({ form, onBlur }: ConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="webhook_url" className="text-xs">
          Webhook URL
        </Label>
        <Input
          id="webhook_url"
          placeholder="https://api.example.com/webhook"
          {...form.register('webhook_url')}
          onBlur={onBlur}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="webhook_method" className="text-xs">
          HTTP Method
        </Label>
        <Select
          value={form.watch('webhook_method') || 'POST'}
          onValueChange={value => {
            form.setValue('webhook_method', value as 'GET' | 'POST' | 'PUT')
            onBlur()
          }}
        >
          <SelectTrigger id="webhook_method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
