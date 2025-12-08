'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type {
  FilterCondition,
  FilterOperator,
  ObjectType,
} from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectType: ObjectType
  filters: FilterCondition[]
  onApply: (filters: FilterCondition[]) => void
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
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'source', label: 'Source', type: 'select' },
    { value: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select' },
    { value: 'client_type', label: 'Client Type', type: 'select' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
    { value: 'expected_due_date', label: 'Due Date', type: 'date' },
  ],
  clients: [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'expected_due_date', label: 'Due Date', type: 'date' },
    { value: 'journey_phase', label: 'Journey Phase', type: 'select' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  invoices: [
    { value: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'total', label: 'Total', type: 'number' },
    { value: 'balance_due', label: 'Balance Due', type: 'number' },
    { value: 'issue_date', label: 'Issue Date', type: 'date' },
    { value: 'due_date', label: 'Due Date', type: 'date' },
  ],
  meetings: [
    { value: 'title', label: 'Title', type: 'text' },
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
    { value: 'total_amount', label: 'Amount', type: 'number' },
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

export function FilterBuilder({
  open,
  onOpenChange,
  objectType,
  filters,
  onApply,
}: FilterBuilderProps) {
  const [localFilters, setLocalFilters] = useState<FilterCondition[]>(filters)

  const handleAddFilter = () => {
    const fieldOptions = FIELD_OPTIONS[objectType]
    const firstField = fieldOptions?.[0]
    if (!firstField) return
    setLocalFilters([
      ...localFilters,
      {
        id: crypto.randomUUID(),
        field: firstField.value,
        operator: 'equals',
        value: '',
        logic: 'AND',
      },
    ])
  }

  const handleRemoveFilter = (id: string) => {
    setLocalFilters(localFilters.filter(f => f.id !== id))
  }

  const handleUpdateFilter = (
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    setLocalFilters(
      localFilters.map(f => (f.id === id ? { ...f, ...updates } : f))
    )
  }

  const handleApply = () => {
    // Filter out empty values
    const validFilters = localFilters.filter(
      f =>
        [
          'is_null',
          'is_not_null',
          'this_week',
          'this_month',
          'this_quarter',
        ].includes(f.operator) ||
        (f.value !== '' && f.value !== null && f.value !== undefined)
    )
    onApply(validFilters)
  }

  const handleClear = () => {
    setLocalFilters([])
  }

  const fieldOptions = FIELD_OPTIONS[objectType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {localFilters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No filters applied. Click &quot;Add Filter&quot; to get started.
            </p>
          ) : (
            localFilters.map((filter, index) => {
              const fieldConfig = fieldOptions.find(
                f => f.value === filter.field
              )
              const operators = fieldConfig
                ? getOperatorsForFieldType(fieldConfig.type)
                : ['equals']

              return (
                <div
                  key={filter.id}
                  className="flex items-end gap-2 rounded-lg border border-border p-3"
                >
                  {/* Logic operator (for filters after first) */}
                  {index > 0 && (
                    <div className="w-20">
                      <Label className="text-xs text-muted-foreground">
                        Logic
                      </Label>
                      <Select
                        value={filter.logic || 'AND'}
                        onValueChange={value =>
                          handleUpdateFilter(filter.id, {
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

                  {/* Field selector */}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Field
                    </Label>
                    <Select
                      value={filter.field}
                      onValueChange={value =>
                        handleUpdateFilter(filter.id, { field: value })
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

                  {/* Operator selector */}
                  <div className="w-40">
                    <Label className="text-xs text-muted-foreground">
                      Operator
                    </Label>
                    <Select
                      value={filter.operator}
                      onValueChange={value =>
                        handleUpdateFilter(filter.id, {
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
                            {OPERATOR_LABELS[op as FilterOperator]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value input (hidden for some operators) */}
                  {![
                    'is_null',
                    'is_not_null',
                    'this_week',
                    'this_month',
                    'this_quarter',
                  ].includes(filter.operator) && (
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
                          handleUpdateFilter(filter.id, {
                            value: e.target.value,
                          })
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

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddFilter}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Filter
          </Button>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={localFilters.length === 0}
          >
            <X className="mr-1 h-4 w-4" />
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
