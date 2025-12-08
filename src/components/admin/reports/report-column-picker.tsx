'use client'

import { GripVertical, Eye, EyeOff, HelpCircle, Info } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ObjectType, ColumnConfig } from '@/lib/supabase/types'

interface ReportColumnPickerProps {
  objectType: ObjectType
  selectedColumns: ColumnConfig[]
  onChange: (columns: ColumnConfig[]) => void
}

// Available fields per object type
const AVAILABLE_FIELDS: Record<
  ObjectType,
  { field: string; label: string; type: string }[]
> = {
  leads: [
    { field: 'name', label: 'Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'phone', label: 'Phone', type: 'text' },
    { field: 'status', label: 'Status', type: 'badge' },
    { field: 'source', label: 'Source', type: 'badge' },
    { field: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'badge' },
    { field: 'client_type', label: 'Client Type', type: 'badge' },
    { field: 'expected_due_date', label: 'Due Date', type: 'date' },
    { field: 'partner_name', label: 'Partner Name', type: 'text' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
    { field: 'updated_at', label: 'Last Updated', type: 'datetime' },
  ],
  clients: [
    { field: 'name', label: 'Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'phone', label: 'Phone', type: 'text' },
    { field: 'expected_due_date', label: 'Due Date', type: 'date' },
    { field: 'journey_phase', label: 'Journey Phase', type: 'badge' },
    { field: 'partner_name', label: 'Partner Name', type: 'text' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
  invoices: [
    { field: 'invoice_number', label: 'Invoice #', type: 'text' },
    { field: 'status', label: 'Status', type: 'badge' },
    { field: 'subtotal', label: 'Subtotal', type: 'currency' },
    { field: 'tax_amount', label: 'Tax', type: 'currency' },
    { field: 'total', label: 'Total', type: 'currency' },
    { field: 'amount_paid', label: 'Amount Paid', type: 'currency' },
    { field: 'issue_date', label: 'Issue Date', type: 'date' },
    { field: 'due_date', label: 'Due Date', type: 'date' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
  meetings: [
    { field: 'meeting_type', label: 'Type', type: 'badge' },
    { field: 'status', label: 'Status', type: 'badge' },
    { field: 'scheduled_at', label: 'Scheduled At', type: 'datetime' },
    { field: 'duration_minutes', label: 'Duration (min)', type: 'text' },
    { field: 'location', label: 'Location', type: 'text' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
  team_members: [
    { field: 'display_name', label: 'Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'role', label: 'Role', type: 'badge' },
    { field: 'is_active', label: 'Active', type: 'boolean' },
    {
      field: 'is_accepting_clients',
      label: 'Accepting Clients',
      type: 'boolean',
    },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
  payments: [
    { field: 'amount', label: 'Amount', type: 'currency' },
    { field: 'status', label: 'Status', type: 'badge' },
    { field: 'payment_method', label: 'Payment Method', type: 'badge' },
    { field: 'payment_date', label: 'Payment Date', type: 'date' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
  services: [
    { field: 'package_name', label: 'Package Name', type: 'text' },
    { field: 'service_type', label: 'Service Type', type: 'badge' },
    { field: 'status', label: 'Status', type: 'badge' },
    { field: 'price', label: 'Price', type: 'currency' },
    { field: 'start_date', label: 'Start Date', type: 'date' },
    { field: 'end_date', label: 'End Date', type: 'date' },
    { field: 'contract_signed', label: 'Contract Signed', type: 'boolean' },
    { field: 'created_at', label: 'Created Date', type: 'datetime' },
  ],
}

function SortableColumn({
  column,
  onToggle,
}: {
  column: ColumnConfig
  onToggle: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.field })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors',
        isDragging && 'opacity-50',
        column.visible && 'border-primary/50 bg-primary/5'
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

      <Checkbox
        id={column.field}
        checked={column.visible}
        onCheckedChange={onToggle}
      />

      <label htmlFor={column.field} className="flex-1 cursor-pointer">
        <span className="font-medium">{column.label}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          ({column.field})
        </span>
      </label>

      {column.visible ? (
        <Eye className="h-4 w-4 text-primary" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  )
}

// Format type descriptions for tooltips
const FORMAT_DESCRIPTIONS: Record<string, string> = {
  text: 'Plain text value',
  badge: 'Displayed as a colored label',
  currency: 'Formatted as dollar amount',
  date: 'Formatted as date (mm/dd/yyyy)',
  datetime: 'Formatted with date and time',
  boolean: 'Displayed as Yes/No',
  number: 'Numeric value',
}

export function ReportColumnPicker({
  objectType,
  selectedColumns,
  onChange,
}: ReportColumnPickerProps) {
  const availableFields = AVAILABLE_FIELDS[objectType] || []

  // Initialize columns if empty
  const columns: ColumnConfig[] =
    selectedColumns.length > 0
      ? selectedColumns
      : availableFields.map(f => ({
          field: f.field,
          label: f.label,
          visible: false,
          format: f.type as ColumnConfig['format'],
        }))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.field === active.id)
      const newIndex = columns.findIndex(c => c.field === over.id)
      onChange(arrayMove(columns, oldIndex, newIndex))
    }
  }

  const toggleColumn = (field: string) => {
    onChange(
      columns.map(c => (c.field === field ? { ...c, visible: !c.visible } : c))
    )
  }

  const selectAll = () => {
    onChange(columns.map(c => ({ ...c, visible: true })))
  }

  const selectNone = () => {
    onChange(columns.map(c => ({ ...c, visible: false })))
  }

  const visibleCount = columns.filter(c => c.visible).length

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-lg font-medium">Select Fields</h3>
              <p className="text-sm text-muted-foreground">
                Choose which fields to include. Drag to reorder columns.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    How field selection works:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Check fields to add them as columns</li>
                    <li>• Drag the grip handle to reorder</li>
                    <li>• Order here = column order in report</li>
                    <li>• At least one field is required</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Selection status with visual indicator */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{visibleCount}</span> of{' '}
            <span className="font-medium">{columns.length}</span> fields
            selected
            {visibleCount === 0 && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                — Select at least one field to continue
              </span>
            )}
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(c => c.field)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {columns.map(column => (
                <Tooltip key={column.field}>
                  <TooltipTrigger asChild>
                    <div>
                      <SortableColumn
                        column={column}
                        onToggle={() => toggleColumn(column.field)}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{column.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Field:{' '}
                      <code className="bg-muted px-1 rounded">
                        {column.field}
                      </code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format:{' '}
                      {FORMAT_DESCRIPTIONS[column.format || 'text'] ||
                        column.format}
                    </p>
                    {column.visible && (
                      <p className="text-xs text-primary mt-1">
                        Column position:{' '}
                        {columns
                          .filter(c => c.visible)
                          .findIndex(c => c.field === column.field) + 1}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </TooltipProvider>
  )
}
