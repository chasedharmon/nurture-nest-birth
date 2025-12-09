'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Code } from 'lucide-react'
import type { WorkflowObjectType } from '@/lib/workflows/types'

interface VariablePickerProps {
  objectType?: WorkflowObjectType
  onSelect: (variable: string) => void
}

interface VariableGroup {
  label: string
  variables: Array<{
    name: string
    description: string
    example: string
  }>
}

// Variables available for each object type
const OBJECT_VARIABLES: Record<WorkflowObjectType, VariableGroup[]> = {
  lead: [
    {
      label: 'Client Info',
      variables: [
        { name: 'first_name', description: 'First name', example: 'Sarah' },
        { name: 'last_name', description: 'Last name', example: 'Johnson' },
        {
          name: 'full_name',
          description: 'Full name',
          example: 'Sarah Johnson',
        },
        {
          name: 'email',
          description: 'Email address',
          example: 'sarah@example.com',
        },
        {
          name: 'phone',
          description: 'Phone number',
          example: '(555) 123-4567',
        },
      ],
    },
    {
      label: 'Pregnancy Info',
      variables: [
        {
          name: 'expected_due_date',
          description: 'Due date',
          example: '2024-06-15',
        },
        {
          name: 'gestational_age',
          description: 'Weeks pregnant',
          example: '28',
        },
        {
          name: 'birth_location',
          description: 'Planned birth location',
          example: 'Memorial Hospital',
        },
        {
          name: 'birth_preferences',
          description: 'Birth preferences',
          example: 'Natural birth',
        },
      ],
    },
    {
      label: 'Status',
      variables: [
        { name: 'status', description: 'Lead status', example: 'qualified' },
        {
          name: 'lifecycle_stage',
          description: 'Lifecycle stage',
          example: 'client',
        },
        {
          name: 'service_interest',
          description: 'Service interest',
          example: 'birth_doula',
        },
      ],
    },
  ],
  meeting: [
    {
      label: 'Meeting Details',
      variables: [
        {
          name: 'title',
          description: 'Meeting title',
          example: 'Initial Consultation',
        },
        {
          name: 'meeting_type',
          description: 'Type of meeting',
          example: 'consultation',
        },
        {
          name: 'scheduled_at',
          description: 'Meeting date/time',
          example: '2024-03-15 10:00 AM',
        },
        { name: 'duration', description: 'Duration in minutes', example: '60' },
        { name: 'location', description: 'Meeting location', example: 'Zoom' },
        {
          name: 'meeting_link',
          description: 'Virtual meeting link',
          example: 'https://zoom.us/j/...',
        },
      ],
    },
  ],
  payment: [
    {
      label: 'Payment Details',
      variables: [
        { name: 'amount', description: 'Payment amount', example: '$500.00' },
        {
          name: 'description',
          description: 'Payment description',
          example: 'Birth Doula Deposit',
        },
        {
          name: 'payment_method',
          description: 'Payment method',
          example: 'credit_card',
        },
        { name: 'status', description: 'Payment status', example: 'completed' },
      ],
    },
  ],
  invoice: [
    {
      label: 'Invoice Details',
      variables: [
        {
          name: 'invoice_number',
          description: 'Invoice number',
          example: 'INV-2024-001',
        },
        { name: 'amount', description: 'Total amount', example: '$2,500.00' },
        { name: 'due_date', description: 'Due date', example: '2024-04-01' },
        { name: 'status', description: 'Invoice status', example: 'pending' },
      ],
    },
  ],
  service: [
    {
      label: 'Service Details',
      variables: [
        {
          name: 'name',
          description: 'Service name',
          example: 'Birth Doula Package',
        },
        {
          name: 'description',
          description: 'Service description',
          example: 'Full birth doula support',
        },
        { name: 'price', description: 'Service price', example: '$2,500.00' },
      ],
    },
  ],
  document: [
    {
      label: 'Document Details',
      variables: [
        { name: 'title', description: 'Document title', example: 'Birth Plan' },
        {
          name: 'document_type',
          description: 'Document type',
          example: 'birth_plan',
        },
        {
          name: 'created_at',
          description: 'Created date',
          example: '2024-03-10',
        },
      ],
    },
  ],
  contract: [
    {
      label: 'Contract Details',
      variables: [
        {
          name: 'title',
          description: 'Contract title',
          example: 'Birth Doula Agreement',
        },
        {
          name: 'status',
          description: 'Contract status',
          example: 'pending_signature',
        },
        { name: 'sent_at', description: 'Date sent', example: '2024-03-10' },
        {
          name: 'signed_at',
          description: 'Date signed',
          example: '2024-03-12',
        },
      ],
    },
  ],
  intake_form: [
    {
      label: 'Form Details',
      variables: [
        {
          name: 'form_name',
          description: 'Form name',
          example: 'Birth Doula Intake',
        },
        {
          name: 'submitted_at',
          description: 'Submission date',
          example: '2024-03-10',
        },
      ],
    },
  ],
}

// Common variables available for all object types
const COMMON_VARIABLES: VariableGroup = {
  label: 'Common',
  variables: [
    {
      name: 'doula_name',
      description: 'Your business name',
      example: 'Nurture Nest Birth',
    },
    {
      name: 'doula_email',
      description: 'Your email',
      example: 'hello@nurturenest.com',
    },
    {
      name: 'doula_phone',
      description: 'Your phone',
      example: '(555) 000-1234',
    },
    {
      name: 'portal_url',
      description: 'Client portal URL',
      example: 'https://yoursite.com/client',
    },
    {
      name: 'current_date',
      description: "Today's date",
      example: '2024-03-15',
    },
  ],
}

export function VariablePicker({ objectType, onSelect }: VariablePickerProps) {
  const [open, setOpen] = useState(false)

  const objectVariables = objectType ? OBJECT_VARIABLES[objectType] : []
  const allGroups = [...objectVariables, COMMON_VARIABLES]

  const handleSelect = (variableName: string) => {
    onSelect(`{{${variableName}}}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
        >
          <Code className="h-3 w-3" />
          Insert Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <p className="text-sm font-medium">Insert Variable</p>
          <p className="text-xs text-muted-foreground">
            Click a variable to insert it at cursor position
          </p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-3">
            {allGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.variables.map(variable => (
                    <button
                      key={variable.name}
                      type="button"
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm flex items-start gap-2 transition-colors"
                      onClick={() => handleSelect(variable.name)}
                    >
                      <code className="text-xs bg-muted px-1 py-0.5 rounded shrink-0">
                        {`{{${variable.name}}}`}
                      </code>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {variable.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

// Export the variable groups for use in other components
export { OBJECT_VARIABLES, COMMON_VARIABLES }
export type { VariableGroup }
