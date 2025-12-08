'use client'

import { Plus, Trash2, Info, Calculator } from 'lucide-react'
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
  AggregationConfig,
  AggregationType,
} from '@/lib/supabase/types'

interface ReportAggregationStepProps {
  objectType: ObjectType
  aggregations: AggregationConfig[]
  onChange: (aggregations: AggregationConfig[]) => void
}

const AGGREGATION_TYPES: {
  value: AggregationType
  label: string
  description: string
}[] = [
  {
    value: 'count',
    label: 'Count',
    description: 'Count the number of records',
  },
  { value: 'sum', label: 'Sum', description: 'Add up all values' },
  {
    value: 'avg',
    label: 'Average',
    description: 'Calculate the average value',
  },
  { value: 'min', label: 'Minimum', description: 'Find the lowest value' },
  { value: 'max', label: 'Maximum', description: 'Find the highest value' },
  {
    value: 'count_distinct',
    label: 'Count Distinct',
    description: 'Count unique values',
  },
]

// Numeric fields that can be aggregated (SUM, AVG, etc.)
const NUMERIC_FIELDS: Record<ObjectType, { value: string; label: string }[]> = {
  leads: [],
  clients: [],
  invoices: [
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'tax_amount', label: 'Tax Amount' },
    { value: 'total', label: 'Total' },
    { value: 'amount_paid', label: 'Amount Paid' },
  ],
  meetings: [{ value: 'duration_minutes', label: 'Duration (minutes)' }],
  team_members: [],
  payments: [{ value: 'amount', label: 'Amount' }],
  services: [{ value: 'price', label: 'Price' }],
}

// All fields (for COUNT and COUNT_DISTINCT)
const ALL_FIELDS: Record<ObjectType, { value: string; label: string }[]> = {
  leads: [
    { value: 'id', label: 'Lead ID' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'status', label: 'Status' },
    { value: 'source', label: 'Source' },
  ],
  clients: [
    { value: 'id', label: 'Client ID' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'journey_phase', label: 'Journey Phase' },
  ],
  invoices: [
    { value: 'id', label: 'Invoice ID' },
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'status', label: 'Status' },
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'total', label: 'Total' },
  ],
  meetings: [
    { value: 'id', label: 'Meeting ID' },
    { value: 'meeting_type', label: 'Meeting Type' },
    { value: 'status', label: 'Status' },
  ],
  team_members: [
    { value: 'id', label: 'Team Member ID' },
    { value: 'display_name', label: 'Name' },
    { value: 'role', label: 'Role' },
  ],
  payments: [
    { value: 'id', label: 'Payment ID' },
    { value: 'status', label: 'Status' },
    { value: 'payment_method', label: 'Payment Method' },
    { value: 'amount', label: 'Amount' },
  ],
  services: [
    { value: 'id', label: 'Service ID' },
    { value: 'package_name', label: 'Package Name' },
    { value: 'service_type', label: 'Service Type' },
    { value: 'status', label: 'Status' },
  ],
}

export function ReportAggregationStep({
  objectType,
  aggregations,
  onChange,
}: ReportAggregationStepProps) {
  const numericFields = NUMERIC_FIELDS[objectType] || []
  const allFields = ALL_FIELDS[objectType] || []

  const addAggregation = () => {
    const defaultField = allFields[0]?.value || 'id'
    onChange([
      ...aggregations,
      {
        id: crypto.randomUUID(),
        type: 'count',
        field: defaultField,
        label: 'Count',
      },
    ])
  }

  const removeAggregation = (id: string) => {
    onChange(aggregations.filter(a => a.id !== id))
  }

  const updateAggregation = (
    id: string,
    updates: Partial<AggregationConfig>
  ) => {
    onChange(aggregations.map(a => (a.id === id ? { ...a, ...updates } : a)))
  }

  const getFieldsForType = (type: AggregationType) => {
    // COUNT and COUNT_DISTINCT can use any field
    if (type === 'count' || type === 'count_distinct') {
      return allFields
    }
    // SUM, AVG, MIN, MAX need numeric fields
    return numericFields
  }

  const generateDefaultLabel = (type: AggregationType, field: string) => {
    const fieldLabel =
      allFields.find(f => f.value === field)?.label ||
      numericFields.find(f => f.value === field)?.label ||
      field
    const typeLabel =
      AGGREGATION_TYPES.find(t => t.value === type)?.label || type
    return `${typeLabel} of ${fieldLabel}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Aggregations</h3>
          <p className="text-sm text-muted-foreground">
            Add calculations like totals, averages, and counts
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
                Aggregations calculate summary values. For example, &quot;Sum of
                Total&quot; adds up all invoice totals, while &quot;Count&quot;
                shows how many records match your filters.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {aggregations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No aggregations added</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add calculations to summarize your data.
          </p>
          <Button onClick={addAggregation}>
            <Plus className="mr-2 h-4 w-4" />
            Add Aggregation
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {aggregations.map(agg => {
            const availableFields = getFieldsForType(agg.type)
            const needsNumericField = !['count', 'count_distinct'].includes(
              agg.type
            )
            const hasNoNumericFields =
              needsNumericField && numericFields.length === 0

            return (
              <div
                key={agg.id}
                className="rounded-lg border bg-card p-4 space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid gap-4 sm:grid-cols-3">
                    {/* Aggregation Type */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Function
                      </Label>
                      <Select
                        value={agg.type}
                        onValueChange={(value: AggregationType) => {
                          const newFields = getFieldsForType(value)
                          const newField = newFields[0]?.value || 'id'
                          updateAggregation(agg.id, {
                            type: value,
                            field: newField,
                            label: generateDefaultLabel(value, newField),
                          })
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGGREGATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Field Selection */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Field
                      </Label>
                      {hasNoNumericFields ? (
                        <div className="h-9 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
                          No numeric fields available
                        </div>
                      ) : (
                        <Select
                          value={agg.field}
                          onValueChange={value => {
                            updateAggregation(agg.id, {
                              field: value,
                              label: generateDefaultLabel(agg.type, value),
                            })
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Custom Label */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        value={agg.label}
                        onChange={e =>
                          updateAggregation(agg.id, { label: e.target.value })
                        }
                        className="h-9"
                        placeholder="Display label..."
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-5 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAggregation(agg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Formula description */}
                <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                  <span className="font-medium">{agg.label}:</span>{' '}
                  {
                    AGGREGATION_TYPES.find(t => t.value === agg.type)
                      ?.description
                  }{' '}
                  {agg.type !== 'count' && (
                    <>
                      for{' '}
                      <span className="font-medium">
                        {availableFields.find(f => f.value === agg.field)
                          ?.label || agg.field}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          <Button variant="outline" onClick={addAggregation}>
            <Plus className="mr-2 h-4 w-4" />
            Add Another Aggregation
          </Button>
        </div>
      )}

      {/* Quick add common aggregations */}
      {aggregations.length === 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-medium mb-3">Quick Add</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange([
                  {
                    id: crypto.randomUUID(),
                    type: 'count',
                    field: 'id',
                    label: 'Total Records',
                  },
                ])
              }}
            >
              Record Count
            </Button>
            {numericFields[0] && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const field = numericFields[0]
                    if (!field) return
                    onChange([
                      {
                        id: crypto.randomUUID(),
                        type: 'sum',
                        field: field.value,
                        label: `Total ${field.label}`,
                      },
                    ])
                  }}
                >
                  Sum {numericFields[0].label}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const field = numericFields[0]
                    if (!field) return
                    onChange([
                      {
                        id: crypto.randomUUID(),
                        type: 'avg',
                        field: field.value,
                        label: `Average ${field.label}`,
                      },
                    ])
                  }}
                >
                  Average {numericFields[0].label}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
