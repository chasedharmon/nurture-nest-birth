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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, X, GitBranch, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type {
  StepConfig,
  DecisionBranch,
  DecisionConditionGroup,
  DecisionCondition,
  DecisionConditionOperator,
  WorkflowObjectType,
} from '@/lib/workflows/types'
import {
  OBJECT_FIELDS,
  DECISION_CONDITION_OPERATORS,
} from '@/lib/workflows/types'

interface EnhancedDecisionConfigProps {
  config: StepConfig
  onChange: (config: StepConfig) => void
  objectType?: WorkflowObjectType
}

// Generate a unique ID
function generateId(): string {
  return `branch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Default branch with empty condition
function createDefaultBranch(label: string = 'Branch'): DecisionBranch {
  return {
    id: generateId(),
    label,
    condition_groups: [
      {
        match_type: 'all',
        conditions: [
          {
            field: '',
            operator: 'equals',
            value: '',
          },
        ],
      },
    ],
    match_type: 'all',
  }
}

export function EnhancedDecisionConfig({
  config,
  onChange,
  objectType,
}: EnhancedDecisionConfigProps) {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    new Set()
  )

  const isAdvancedMode = config.decision_mode === 'advanced'
  const branches = config.decision_branches || []
  const fields = objectType ? OBJECT_FIELDS[objectType] || [] : []

  // Toggle between simple and advanced mode
  const toggleMode = () => {
    if (isAdvancedMode) {
      // Switch to simple mode
      onChange({
        ...config,
        decision_mode: 'simple',
      })
    } else {
      // Switch to advanced mode - convert simple condition to branch
      const initialBranches: DecisionBranch[] = config.condition_field
        ? [
            {
              id: generateId(),
              label: 'Yes',
              condition_groups: [
                {
                  match_type: 'all',
                  conditions: [
                    {
                      field: config.condition_field,
                      operator: (config.condition_operator ||
                        'equals') as DecisionConditionOperator,
                      value: config.condition_value,
                    },
                  ],
                },
              ],
              match_type: 'all',
            },
          ]
        : [createDefaultBranch('Yes')]

      onChange({
        ...config,
        decision_mode: 'advanced',
        decision_branches: initialBranches,
        default_branch_label: 'No / Default',
      })
      // Expand the first branch
      setExpandedBranches(new Set([initialBranches[0]!.id]))
    }
  }

  // Add a new branch
  const addBranch = () => {
    const newBranch = createDefaultBranch(`Branch ${branches.length + 1}`)
    onChange({
      ...config,
      decision_branches: [...branches, newBranch],
    })
    setExpandedBranches(prev => new Set([...prev, newBranch.id]))
  }

  // Remove a branch
  const removeBranch = (branchId: string) => {
    onChange({
      ...config,
      decision_branches: branches.filter(b => b.id !== branchId),
    })
  }

  // Update a branch
  const updateBranch = (branchId: string, updates: Partial<DecisionBranch>) => {
    onChange({
      ...config,
      decision_branches: branches.map(b =>
        b.id === branchId ? { ...b, ...updates } : b
      ),
    })
  }

  // Add condition group to a branch
  const addConditionGroup = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const newGroup: DecisionConditionGroup = {
      match_type: 'all',
      conditions: [{ field: '', operator: 'equals', value: '' }],
    }

    updateBranch(branchId, {
      condition_groups: [...branch.condition_groups, newGroup],
    })
  }

  // Remove condition group from a branch
  const removeConditionGroup = (branchId: string, groupIndex: number) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    updateBranch(branchId, {
      condition_groups: branch.condition_groups.filter(
        (_, i) => i !== groupIndex
      ),
    })
  }

  // Update a condition group
  const updateConditionGroup = (
    branchId: string,
    groupIndex: number,
    updates: Partial<DecisionConditionGroup>
  ) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    updateBranch(branchId, {
      condition_groups: branch.condition_groups.map((g, i) =>
        i === groupIndex ? { ...g, ...updates } : g
      ),
    })
  }

  // Add condition to a group
  const addCondition = (branchId: string, groupIndex: number) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const group = branch.condition_groups[groupIndex]
    if (!group) return

    updateConditionGroup(branchId, groupIndex, {
      conditions: [
        ...group.conditions,
        { field: '', operator: 'equals', value: '' },
      ],
    })
  }

  // Remove condition from a group
  const removeCondition = (
    branchId: string,
    groupIndex: number,
    conditionIndex: number
  ) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const group = branch.condition_groups[groupIndex]
    if (!group) return

    updateConditionGroup(branchId, groupIndex, {
      conditions: group.conditions.filter((_, i) => i !== conditionIndex),
    })
  }

  // Update a condition
  const updateCondition = (
    branchId: string,
    groupIndex: number,
    conditionIndex: number,
    updates: Partial<DecisionCondition>
  ) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const group = branch.condition_groups[groupIndex]
    if (!group) return

    updateConditionGroup(branchId, groupIndex, {
      conditions: group.conditions.map((c, i) =>
        i === conditionIndex ? { ...c, ...updates } : c
      ),
    })
  }

  const toggleBranchExpanded = (branchId: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branchId)) {
        next.delete(branchId)
      } else {
        next.add(branchId)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Decision Mode</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleMode}
          className="text-xs"
        >
          {isAdvancedMode ? 'Switch to Simple' : 'Switch to Advanced'}
        </Button>
      </div>

      {!isAdvancedMode ? (
        // Simple Mode - existing UI
        <SimpleDecisionConfig
          config={config}
          onChange={onChange}
          fields={fields}
        />
      ) : (
        // Advanced Mode - multi-branch
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Create multiple branches with complex conditions. Each branch can
            have multiple condition groups.
          </p>

          {/* Branches List */}
          <div className="space-y-2">
            {branches.map(branch => (
              <Card key={branch.id} className="overflow-hidden">
                <CardHeader
                  className="p-3 cursor-pointer hover:bg-accent/50"
                  onClick={() => toggleBranchExpanded(branch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={branch.label}
                        onChange={e => {
                          e.stopPropagation()
                          updateBranch(branch.id, { label: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="h-7 w-32 text-sm font-medium"
                        placeholder="Branch name"
                      />
                      <Badge variant="secondary" className="text-xs">
                        {branch.condition_groups.reduce(
                          (acc, g) => acc + g.conditions.length,
                          0
                        )}{' '}
                        condition(s)
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {branches.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={e => {
                            e.stopPropagation()
                            removeBranch(branch.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {expandedBranches.has(branch.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedBranches.has(branch.id) && (
                  <CardContent className="p-3 pt-0 space-y-3">
                    {/* Match type for multiple groups */}
                    {branch.condition_groups.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Match:</Label>
                        <Select
                          value={branch.match_type}
                          onValueChange={(v: 'all' | 'any') =>
                            updateBranch(branch.id, { match_type: v })
                          }
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All groups</SelectItem>
                            <SelectItem value="any">Any group</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Condition Groups */}
                    {branch.condition_groups.map((group, groupIndex) => (
                      <div key={groupIndex} className="space-y-2">
                        {groupIndex > 0 && (
                          <div className="flex items-center gap-2 py-1">
                            <Separator className="flex-1" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {branch.match_type === 'all' ? 'AND' : 'OR'}
                            </span>
                            <Separator className="flex-1" />
                          </div>
                        )}

                        <div className="rounded-md border p-2 space-y-2">
                          {/* Group match type */}
                          {group.conditions.length > 1 && (
                            <div className="flex items-center justify-between">
                              <Select
                                value={group.match_type}
                                onValueChange={(v: 'all' | 'any') =>
                                  updateConditionGroup(branch.id, groupIndex, {
                                    match_type: v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-6 w-20 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="any">Any</SelectItem>
                                </SelectContent>
                              </Select>
                              {branch.condition_groups.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    removeConditionGroup(branch.id, groupIndex)
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Conditions */}
                          {group.conditions.map((condition, conditionIndex) => (
                            <ConditionRow
                              key={conditionIndex}
                              condition={condition}
                              fields={fields}
                              onUpdate={updates =>
                                updateCondition(
                                  branch.id,
                                  groupIndex,
                                  conditionIndex,
                                  updates
                                )
                              }
                              onRemove={
                                group.conditions.length > 1
                                  ? () =>
                                      removeCondition(
                                        branch.id,
                                        groupIndex,
                                        conditionIndex
                                      )
                                  : undefined
                              }
                              showMatchLabel={
                                conditionIndex > 0 &&
                                group.conditions.length > 1
                              }
                              matchType={group.match_type}
                            />
                          ))}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addCondition(branch.id, groupIndex)}
                            className="h-7 text-xs w-full"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Condition
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionGroup(branch.id)}
                      className="h-7 text-xs w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Condition Group
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Add Branch Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBranch}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>

          {/* Default Branch */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <Label className="text-xs font-medium">Default Branch</Label>
            </div>
            <Input
              value={config.default_branch_label || 'Default'}
              onChange={e =>
                onChange({ ...config, default_branch_label: e.target.value })
              }
              placeholder="Label for default branch"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Used when no other branch conditions match
            </p>
          </div>

          {/* Handle colors legend */}
          <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Branch Handles</p>
            {branches.map((branch, i) => (
              <p key={branch.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: getBranchColor(i) }}
                />
                {branch.label || `Branch ${i + 1}`}
              </p>
            ))}
            <p className="flex items-center gap-1 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
              {config.default_branch_label || 'Default'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple decision config (existing functionality)
function SimpleDecisionConfig({
  config,
  onChange,
  fields,
}: {
  config: StepConfig
  onChange: (config: StepConfig) => void
  fields: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="condition_field" className="text-xs">
          Field to Check
        </Label>
        {fields.length > 0 ? (
          <Select
            value={config.condition_field || ''}
            onValueChange={value =>
              onChange({ ...config, condition_field: value })
            }
          >
            <SelectTrigger>
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
        ) : (
          <Input
            id="condition_field"
            placeholder="status"
            value={config.condition_field || ''}
            onChange={e =>
              onChange({ ...config, condition_field: e.target.value })
            }
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condition_operator" className="text-xs">
          Operator
        </Label>
        <Select
          value={config.condition_operator || 'equals'}
          onValueChange={value =>
            onChange({
              ...config,
              condition_operator: value as StepConfig['condition_operator'],
            })
          }
        >
          <SelectTrigger>
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
          value={config.condition_value || ''}
          onChange={e =>
            onChange({ ...config, condition_value: e.target.value })
          }
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

// Individual condition row component
function ConditionRow({
  condition,
  fields,
  onUpdate,
  onRemove,
  showMatchLabel,
  matchType,
}: {
  condition: DecisionCondition
  fields: { value: string; label: string }[]
  onUpdate: (updates: Partial<DecisionCondition>) => void
  onRemove?: () => void
  showMatchLabel?: boolean
  matchType?: 'all' | 'any'
}) {
  const operatorConfig = DECISION_CONDITION_OPERATORS.find(
    o => o.value === condition.operator
  )

  return (
    <div className="space-y-1">
      {showMatchLabel && (
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {matchType === 'all' ? 'AND' : 'OR'}
        </span>
      )}
      <div className="flex items-center gap-1">
        {/* Field */}
        <div className="flex-1">
          {fields.length > 0 ? (
            <Select
              value={condition.field}
              onValueChange={value => onUpdate({ field: value })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={condition.field}
              onChange={e => onUpdate({ field: e.target.value })}
              placeholder="Field"
              className="h-8 text-xs"
            />
          )}
        </div>

        {/* Operator */}
        <div className="flex-1">
          <Select
            value={condition.operator}
            onValueChange={(value: DecisionConditionOperator) =>
              onUpdate({ operator: value })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DECISION_CONDITION_OPERATORS.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        {operatorConfig?.requiresValue && (
          <div className="flex-1">
            <Input
              value={condition.value || ''}
              onChange={e => onUpdate({ value: e.target.value })}
              placeholder="Value"
              className="h-8 text-xs"
            />
          </div>
        )}

        {/* Remove */}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Branch color palette
const BRANCH_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
]

export function getBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length] || BRANCH_COLORS[0]!
}
