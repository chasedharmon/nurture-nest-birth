'use client'

import { Plus, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  ObjectType,
  FilterCondition,
  FilterOperator,
} from '@/lib/supabase/types'

interface ReportFilterStepProps {
  objectType: ObjectType
  filters: FilterCondition[]
  onChange: (filters: FilterCondition[]) => void
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not equals',
  contains: 'Contains',
  not_contains: 'Does not contain',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_or_equal: 'Greater or equal',
  less_or_equal: 'Less or equal',
  is_null: 'Is empty',
  is_not_null: 'Is not empty',
  in: 'Is one of',
  not_in: 'Is not one of',
  between: 'Between',
  this_week: 'This week',
  this_month: 'This month',
  this_quarter: 'This quarter',
  last_n_days: 'Last N days',
}

const FIELD_OPTIONS: Record<
  ObjectType,
  { value: string; label: string; type: string }[]
> = {
  leads: [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'source', label: 'Source', type: 'select' },
    { value: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
    { value: 'expected_due_date', label: 'Due Date', type: 'date' },
  ],
  clients: [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'journey_phase', label: 'Journey Phase', type: 'select' },
    { value: 'expected_due_date', label: 'Due Date', type: 'date' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  invoices: [
    { value: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'total', label: 'Total', type: 'number' },
    { value: 'issue_date', label: 'Issue Date', type: 'date' },
    { value: 'due_date', label: 'Due Date', type: 'date' },
  ],
  meetings: [
    { value: 'meeting_type', label: 'Type', type: 'select' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'scheduled_at', label: 'Scheduled Date', type: 'date' },
  ],
  team_members: [
    { value: 'display_name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'role', label: 'Role', type: 'select' },
    { value: 'is_active', label: 'Is Active', type: 'boolean' },
  ],
  payments: [
    { value: 'amount', label: 'Amount', type: 'number' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'payment_method', label: 'Payment Method', type: 'select' },
    { value: 'payment_date', label: 'Payment Date', type: 'date' },
  ],
  services: [
    { value: 'package_name', label: 'Package Name', type: 'text' },
    { value: 'service_type', label: 'Service Type', type: 'select' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'price', label: 'Price', type: 'number' },
  ],
}

function getOperatorsForFieldType(type: string): FilterOperator[] {
  switch (type) {
    case 'text':
      return [
        'equals',
        'not_equals',
        'contains',
        'starts_with',
        'is_null',
        'is_not_null',
      ]
    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_or_equal',
        'less_or_equal',
        'between',
      ]
    case 'date':
      return [
        'equals',
        'greater_than',
        'less_than',
        'between',
        'this_week',
        'this_month',
        'this_quarter',
        'last_n_days',
        'is_null',
        'is_not_null',
      ]
    case 'select':
      return ['equals', 'not_equals', 'in', 'is_null', 'is_not_null']
    case 'boolean':
      return ['equals']
    default:
      return ['equals', 'not_equals']
  }
}

export function ReportFilterStep({
  objectType,
  filters,
  onChange,
}: ReportFilterStepProps) {
  const fieldOptions = FIELD_OPTIONS[objectType] || []

  const addFilter = () => {
    const firstField = fieldOptions[0]
    if (!firstField) return
    onChange([
      ...filters,
      {
        id: crypto.randomUUID(),
        field: firstField.value,
        operator: 'equals',
        value: '',
        logic: 'AND',
      },
    ])
  }

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onChange(filters.map(f => (f.id === id ? { ...f, ...updates } : f)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Filter Data</h3>
          <p className="text-sm text-muted-foreground">
            Add conditions to filter the report results
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Filters narrow down your data. For example, filter leads by
                status &quot;client&quot; to only see clients in your report.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {filters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No filters applied. Your report will include all records.
          </p>
          <Button onClick={addFilter}>
            <Plus className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filters.map((filter, index) => {
            const fieldConfig = fieldOptions.find(f => f.value === filter.field)
            const operators: FilterOperator[] = fieldConfig
              ? getOperatorsForFieldType(fieldConfig.type)
              : ['equals']
            const needsValue = ![
              'is_null',
              'is_not_null',
              'this_week',
              'this_month',
              'this_quarter',
            ].includes(filter.operator)

            return (
              <div
                key={filter.id}
                className="rounded-lg border bg-card p-4 space-y-4"
              >
                <div className="flex items-center gap-4">
                  {/* Logic operator (for filters after first) */}
                  {index > 0 && (
                    <div className="w-20">
                      <Label className="text-xs text-muted-foreground">
                        Logic
                      </Label>
                      <Select
                        value={filter.logic || 'AND'}
                        onValueChange={value =>
                          updateFilter(filter.id, {
                            logic: value as 'AND' | 'OR',
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Field */}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Field
                    </Label>
                    <Select
                      value={filter.field}
                      onValueChange={value =>
                        updateFilter(filter.id, { field: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator */}
                  <div className="w-44">
                    <Label className="text-xs text-muted-foreground">
                      Operator
                    </Label>
                    <Select
                      value={filter.operator}
                      onValueChange={value =>
                        updateFilter(filter.id, {
                          operator: value as FilterOperator,
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op} value={op}>
                            {OPERATOR_LABELS[op]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  {needsValue && (
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Value
                      </Label>
                      <Input
                        type={
                          filter.operator === 'last_n_days'
                            ? 'number'
                            : fieldConfig?.type === 'date'
                              ? 'date'
                              : fieldConfig?.type === 'number'
                                ? 'number'
                                : 'text'
                        }
                        value={filter.value as string}
                        onChange={e =>
                          updateFilter(filter.id, { value: e.target.value })
                        }
                        className="h-9"
                        placeholder={
                          filter.operator === 'last_n_days'
                            ? 'Number of days'
                            : 'Enter value...'
                        }
                      />
                    </div>
                  )}

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-5 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Human-readable description */}
                <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                  {index > 0 && (
                    <span className="font-medium">{filter.logic} </span>
                  )}
                  Show records where{' '}
                  <span className="font-medium">
                    {fieldConfig?.label || filter.field}
                  </span>{' '}
                  <span className="font-medium">
                    {OPERATOR_LABELS[filter.operator].toLowerCase()}
                  </span>
                  {needsValue &&
                    filter.value !== undefined &&
                    filter.value !== '' && (
                      <span className="font-medium">
                        {' '}
                        &quot;{String(filter.value)}&quot;
                      </span>
                    )}
                </div>
              </div>
            )
          })}

          <Button variant="outline" onClick={addFilter}>
            <Plus className="mr-2 h-4 w-4" />
            Add Another Filter
          </Button>
        </div>
      )}
    </div>
  )
}
