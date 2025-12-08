'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Info } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import type { ObjectType, ColumnConfig } from '@/lib/supabase/types'

interface ReportGroupingStepProps {
  objectType: ObjectType
  selectedColumns: ColumnConfig[]
  groupings: string[]
  onChange: (groupings: string[]) => void
}

// Fields that can be grouped by (typically categorical or date fields)
const GROUPABLE_FIELDS: Record<ObjectType, { value: string; label: string }[]> =
  {
    leads: [
      { value: 'status', label: 'Status' },
      { value: 'source', label: 'Source' },
      { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
      { value: 'client_type', label: 'Client Type' },
      { value: 'created_at', label: 'Created Date' },
      { value: 'expected_due_date', label: 'Due Date' },
    ],
    clients: [
      { value: 'journey_phase', label: 'Journey Phase' },
      { value: 'expected_due_date', label: 'Due Date' },
      { value: 'created_at', label: 'Created Date' },
    ],
    invoices: [
      { value: 'status', label: 'Status' },
      { value: 'issue_date', label: 'Issue Date' },
      { value: 'due_date', label: 'Due Date' },
    ],
    meetings: [
      { value: 'meeting_type', label: 'Meeting Type' },
      { value: 'status', label: 'Status' },
      { value: 'scheduled_at', label: 'Scheduled Date' },
    ],
    team_members: [
      { value: 'role', label: 'Role' },
      { value: 'is_active', label: 'Active Status' },
      { value: 'is_accepting_clients', label: 'Accepting Clients' },
    ],
    payments: [
      { value: 'status', label: 'Status' },
      { value: 'payment_method', label: 'Payment Method' },
      { value: 'payment_date', label: 'Payment Date' },
    ],
    services: [
      { value: 'service_type', label: 'Service Type' },
      { value: 'status', label: 'Status' },
      { value: 'start_date', label: 'Start Date' },
    ],
  }

function SortableGrouping({
  field,
  label,
  onRemove,
}: {
  field: string
  label: string
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3',
        isDragging && 'opacity-50'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1">
        <span className="font-medium">{label}</span>
        <span className="ml-2 text-xs text-muted-foreground">({field})</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ReportGroupingStep({
  objectType,
  selectedColumns: _selectedColumns,
  groupings,
  onChange,
}: ReportGroupingStepProps) {
  // _selectedColumns reserved for future: allow grouping by any selected column
  const groupableFields = GROUPABLE_FIELDS[objectType] || []
  const [selectedField, setSelectedField] = useState<string>('')

  // Filter to show only fields not already added
  const availableFields = groupableFields.filter(
    f => !groupings.includes(f.value)
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = groupings.findIndex(g => g === active.id)
      const newIndex = groupings.findIndex(g => g === over.id)
      onChange(arrayMove(groupings, oldIndex, newIndex))
    }
  }

  const addGrouping = () => {
    if (selectedField && !groupings.includes(selectedField)) {
      onChange([...groupings, selectedField])
      setSelectedField('')
    }
  }

  const removeGrouping = (field: string) => {
    onChange(groupings.filter(g => g !== field))
  }

  const getFieldLabel = (field: string) => {
    return groupableFields.find(f => f.value === field)?.label || field
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Group Data</h3>
          <p className="text-sm text-muted-foreground">
            Add groupings to create subtotals and organize your data
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
                Groupings organize your data into categories. For example,
                grouping leads by &quot;Status&quot; will show separate sections
                for each status with subtotals.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Add grouping form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="sr-only">Select field to group by</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger>
              <SelectValue placeholder="Select a field to group by..." />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map(field => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={addGrouping} disabled={!selectedField}>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      {/* Groupings list */}
      {groupings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No groupings added</p>
          <p className="text-sm text-muted-foreground">
            Your report will show data as a flat list without groupings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Drag to reorder. First grouping is the primary group.
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupings}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {groupings.map((field, index) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <SortableGrouping
                        field={field}
                        label={getFieldLabel(field)}
                        onRemove={() => removeGrouping(field)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Preview of grouping hierarchy */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">Grouping Preview</h4>
            <div className="text-sm text-muted-foreground">
              Data will be grouped by:{' '}
              {groupings.map((g, i) => (
                <span key={g}>
                  <span className="font-medium text-foreground">
                    {getFieldLabel(g)}
                  </span>
                  {i < groupings.length - 1 && ' → '}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
