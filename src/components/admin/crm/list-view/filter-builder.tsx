'use client'

/**
 * FilterBuilder - Advanced filter configuration for list views
 *
 * Features:
 * - Dynamic field selection based on object metadata
 * - Type-aware operators (text, number, date, picklist)
 * - AND/OR logic between conditions
 * - Picklist value suggestions
 * - Date presets (this week, this month, etc.)
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  FieldWithPicklistValues,
  FilterCondition,
  FilterOperator,
  FieldDataType,
} from '@/lib/crm/types'

interface FilterBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: FieldWithPicklistValues[]
  filters: FilterCondition[]
  onApply: (filters: FilterCondition[]) => void
}

// Operator labels for display
const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not equals',
  contains: 'Contains',
  not_contains: 'Does not contain',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than',
  greater_than_or_equal: 'Greater or equal',
  less_than: 'Less than',
  less_than_or_equal: 'Less or equal',
  is_null: 'Is empty',
  is_not_null: 'Is not empty',
  in: 'Is one of',
  not_in: 'Is not one of',
  between: 'Between',
}

// Get operators based on field type
function getOperatorsForFieldType(dataType: FieldDataType): FilterOperator[] {
  switch (dataType) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'is_null',
        'is_not_null',
      ]
    case 'number':
    case 'currency':
    case 'percent':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'greater_than_or_equal',
        'less_than',
        'less_than_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ]
    case 'date':
    case 'datetime':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'greater_than_or_equal',
        'less_than',
        'less_than_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ]
    case 'picklist':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null']
    case 'multipicklist':
      return ['contains', 'not_contains', 'is_null', 'is_not_null']
    case 'checkbox':
      return ['equals']
    case 'lookup':
    case 'master_detail':
      return ['equals', 'not_equals', 'is_null', 'is_not_null']
    default:
      return ['equals', 'not_equals', 'is_null', 'is_not_null']
  }
}

// Operators that don't require a value input
const NO_VALUE_OPERATORS: FilterOperator[] = ['is_null', 'is_not_null']

export function FilterBuilder({
  open,
  onOpenChange,
  fields,
  filters,
  onApply,
}: FilterBuilderProps) {
  // Initialize with prop filters - use callback form for stable initialization
  const [localFilters, setLocalFilters] = useState<FilterCondition[]>(() => [
    ...filters,
  ])

  // Get filterable fields (exclude certain system fields)
  const filterableFields = fields.filter(
    f =>
      f.is_active &&
      !['rich_text', 'formula', 'auto_number'].includes(f.data_type) &&
      !['id', 'organization_id', 'custom_fields'].includes(f.api_name)
  )

  // Reset local filters when dialog is opened (via onOpenChange handler)
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        // Reset to prop filters when opening
        setLocalFilters([...filters])
      }
      onOpenChange(newOpen)
    },
    [filters, onOpenChange]
  )

  const handleAddFilter = () => {
    const firstField = filterableFields[0]
    if (!firstField) return

    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: firstField.api_name,
      operator: 'equals',
      value: '',
      logic: localFilters.length > 0 ? 'AND' : undefined,
    }
    setLocalFilters([...localFilters, newFilter])
  }

  const handleRemoveFilter = (id: string) => {
    const newFilters = localFilters.filter(f => f.id !== id)
    // Remove logic from first filter if it becomes first
    if (newFilters.length > 0 && newFilters[0]) {
      newFilters[0] = { ...newFilters[0], logic: undefined }
    }
    setLocalFilters(newFilters)
  }

  const handleUpdateFilter = (
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    setLocalFilters(
      localFilters.map(f => {
        if (f.id !== id) return f

        // If field changed, reset operator and value
        if (updates.field && updates.field !== f.field) {
          const newField = filterableFields.find(
            field => field.api_name === updates.field
          )
          const operators = newField
            ? getOperatorsForFieldType(newField.data_type)
            : (['equals'] as FilterOperator[])
          return {
            ...f,
            ...updates,
            operator: operators[0] ?? 'equals',
            value: '',
          }
        }

        // If operator changed to no-value operator, clear value
        if (
          updates.operator &&
          NO_VALUE_OPERATORS.includes(updates.operator as FilterOperator)
        ) {
          return { ...f, ...updates, value: '' }
        }

        return { ...f, ...updates }
      })
    )
  }

  const handleApply = () => {
    // Filter out invalid filters (empty values for operators that need them)
    const validFilters = localFilters.filter(f => {
      if (NO_VALUE_OPERATORS.includes(f.operator)) return true
      if (f.operator === 'between') {
        const val = f.value as { start?: unknown; end?: unknown }
        return val?.start !== undefined || val?.end !== undefined
      }
      return f.value !== '' && f.value !== null && f.value !== undefined
    })
    onApply(validFilters)
    onOpenChange(false)
  }

  const handleClear = () => {
    setLocalFilters([])
  }

  const renderValueInput = (
    filter: FilterCondition,
    field: FieldWithPicklistValues
  ) => {
    // No input needed for null operators
    if (NO_VALUE_OPERATORS.includes(filter.operator)) {
      return (
        <div className="flex-1 text-sm text-muted-foreground italic">
          No value needed
        </div>
      )
    }

    // Picklist dropdown
    if (
      field.data_type === 'picklist' &&
      field.picklist_values &&
      ['equals', 'not_equals'].includes(filter.operator)
    ) {
      return (
        <Select
          value={filter.value as string}
          onValueChange={value => handleUpdateFilter(filter.id, { value })}
        >
          <SelectTrigger className="h-9 flex-1">
            <SelectValue placeholder="Select value..." />
          </SelectTrigger>
          <SelectContent>
            {field.picklist_values
              .filter(pv => pv.is_active)
              .sort((a, b) => a.display_order - b.display_order)
              .map(pv => (
                <SelectItem key={pv.value} value={pv.value}>
                  {pv.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )
    }

    // Checkbox (boolean)
    if (field.data_type === 'checkbox') {
      return (
        <Select
          value={String(filter.value)}
          onValueChange={value =>
            handleUpdateFilter(filter.id, { value: value === 'true' })
          }
        >
          <SelectTrigger className="h-9 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    // Between operator - two inputs
    if (filter.operator === 'between') {
      const betweenValue =
        (filter.value as { start?: string; end?: string }) || {}
      return (
        <div className="flex flex-1 gap-2">
          <Input
            type={
              field.data_type === 'date' || field.data_type === 'datetime'
                ? 'date'
                : field.data_type === 'number' ||
                    field.data_type === 'currency' ||
                    field.data_type === 'percent'
                  ? 'number'
                  : 'text'
            }
            value={betweenValue.start || ''}
            onChange={e =>
              handleUpdateFilter(filter.id, {
                value: { ...betweenValue, start: e.target.value },
              })
            }
            className="h-9"
            placeholder="From..."
          />
          <Input
            type={
              field.data_type === 'date' || field.data_type === 'datetime'
                ? 'date'
                : field.data_type === 'number' ||
                    field.data_type === 'currency' ||
                    field.data_type === 'percent'
                  ? 'number'
                  : 'text'
            }
            value={betweenValue.end || ''}
            onChange={e =>
              handleUpdateFilter(filter.id, {
                value: { ...betweenValue, end: e.target.value },
              })
            }
            className="h-9"
            placeholder="To..."
          />
        </div>
      )
    }

    // Default input based on field type
    const inputType =
      field.data_type === 'date' || field.data_type === 'datetime'
        ? 'date'
        : field.data_type === 'number' ||
            field.data_type === 'currency' ||
            field.data_type === 'percent'
          ? 'number'
          : 'text'

    return (
      <Input
        type={inputType}
        value={filter.value as string}
        onChange={e => handleUpdateFilter(filter.id, { value: e.target.value })}
        className="h-9 flex-1"
        placeholder="Enter value..."
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Build complex filters to find exactly what you&apos;re looking for.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-4 overflow-y-auto py-4">
          {localFilters.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No filters applied. Click &quot;Add Filter&quot; to get started.
            </p>
          ) : (
            localFilters.map((filter, index) => {
              const fieldConfig = filterableFields.find(
                f => f.api_name === filter.field
              )
              if (!fieldConfig) return null

              const operators = getOperatorsForFieldType(fieldConfig.data_type)

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
                  <div className="min-w-[140px] flex-1">
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
                        {filterableFields.map(field => (
                          <SelectItem
                            key={field.api_name}
                            value={field.api_name}
                          >
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
                            {OPERATOR_LABELS[op]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value input */}
                  <div className="min-w-[160px] flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Value
                    </Label>
                    {renderValueInput(filter, fieldConfig)}
                  </div>

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
            disabled={filterableFields.length === 0}
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
            <Button onClick={handleApply}>
              Apply Filters
              {localFilters.length > 0 && ` (${localFilters.length})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
