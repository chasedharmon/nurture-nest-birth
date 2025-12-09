'use client'

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
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Filter } from 'lucide-react'
import type {
  WorkflowObjectType,
  EntryCriteria,
  EntryCondition,
  EntryConditionOperator,
} from '@/lib/workflows/types'
import { OBJECT_FIELDS, ENTRY_CONDITION_OPERATORS } from '@/lib/workflows/types'

interface EntryCriteriaBuilderProps {
  objectType: WorkflowObjectType
  value: EntryCriteria
  onChange: (criteria: EntryCriteria) => void
}

export function EntryCriteriaBuilder({
  objectType,
  value,
  onChange,
}: EntryCriteriaBuilderProps) {
  const fields = OBJECT_FIELDS[objectType] || []

  const addCondition = () => {
    const newCondition: EntryCondition = {
      field: fields[0]?.value || '',
      operator: 'equals',
      value: '',
    }
    onChange({
      ...value,
      conditions: [...value.conditions, newCondition],
    })
  }

  const updateCondition = (
    index: number,
    updates: {
      field?: string
      operator?: EntryConditionOperator
      value?: string
    }
  ) => {
    const newConditions = [...value.conditions]
    const current = newConditions[index]
    if (!current) return
    newConditions[index] = {
      field: updates.field ?? current.field,
      operator: updates.operator ?? current.operator,
      value: updates.value ?? current.value,
    }
    onChange({ ...value, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    const newConditions = value.conditions.filter((_, i) => i !== index)
    onChange({ ...value, conditions: newConditions })
  }

  const getOperatorConfig = (operator: EntryConditionOperator) => {
    return ENTRY_CONDITION_OPERATORS.find(o => o.value === operator)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Entry Criteria</Label>
        </div>
        {value.conditions.length > 1 && (
          <Select
            value={value.match_type}
            onValueChange={(v: 'all' | 'any') =>
              onChange({ ...value, match_type: v })
            }
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Match All</SelectItem>
              <SelectItem value="any">Match Any</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Filter which records can enter this workflow. Leave empty to allow all
        records.
      </p>

      {value.conditions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              No entry criteria. All matching records will enter this workflow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {value.conditions.map((condition, index) => {
            const operatorConfig = getOperatorConfig(condition.operator)
            return (
              <Card key={index}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    {/* Field selector */}
                    <div className="flex-1">
                      <Select
                        value={condition.field}
                        onValueChange={field =>
                          updateCondition(index, { field })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator selector */}
                    <div className="flex-1">
                      <Select
                        value={condition.operator}
                        onValueChange={(op: EntryConditionOperator) =>
                          updateCondition(index, { operator: op })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTRY_CONDITION_OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value input (if required) */}
                    {operatorConfig?.requiresValue && (
                      <div className="flex-1">
                        <Input
                          value={condition.value || ''}
                          onChange={e =>
                            updateCondition(index, { value: e.target.value })
                          }
                          placeholder="Value"
                          className="h-9"
                        />
                      </div>
                    )}

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Show AND/OR between conditions */}
                  {index < value.conditions.length - 1 && (
                    <div className="mt-2 pt-2 border-t text-center">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {value.match_type === 'all' ? 'AND' : 'OR'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Condition
      </Button>
    </div>
  )
}
