'use client'

/**
 * ColumnSelector - Drag-and-drop column configuration for list views
 *
 * Features:
 * - Toggle column visibility
 * - Drag-and-drop reordering
 * - Reset to default
 * - Integrates with CRM field metadata
 */

import { useState, useEffect } from 'react'
import { GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { FieldWithPicklistValues } from '@/lib/crm/types'

export interface ColumnConfig {
  fieldId: string
  apiName: string
  label: string
  visible: boolean
  sortable: boolean
  width?: number
}

interface ColumnSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: FieldWithPicklistValues[]
  columns: ColumnConfig[]
  onApply: (columns: ColumnConfig[]) => void
}

export function ColumnSelector({
  open,
  onOpenChange,
  fields,
  columns,
  onApply,
}: ColumnSelectorProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Sync local state when props change
  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const handleToggleColumn = (apiName: string) => {
    setLocalColumns(
      localColumns.map(col =>
        col.apiName === apiName ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Set drag image to be invisible (we'll show custom styling)
    const dragImage = document.createElement('div')
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newColumns = [...localColumns]
    const draggedColumn = newColumns[draggedIndex]
    if (!draggedColumn) return

    // Remove from old position and insert at new position
    newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedColumn)

    setLocalColumns(newColumns)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleReset = () => {
    // Reset to default columns based on field metadata
    const defaultColumns: ColumnConfig[] = fields
      .filter(f => f.is_visible && f.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(field => ({
        fieldId: field.id,
        apiName: field.api_name,
        label: field.label,
        visible: true,
        sortable: !['textarea', 'rich_text', 'multipicklist'].includes(
          field.data_type
        ),
      }))
    setLocalColumns(defaultColumns)
  }

  const handleApply = () => {
    onApply(localColumns)
    onOpenChange(false)
  }

  const handleShowAll = () => {
    setLocalColumns(localColumns.map(col => ({ ...col, visible: true })))
  }

  const handleHideAll = () => {
    // Keep at least one column visible
    setLocalColumns(
      localColumns.map((col, idx) => ({
        ...col,
        visible: idx === 0,
      }))
    )
  }

  const visibleCount = localColumns.filter(col => col.visible).length
  const totalCount = localColumns.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
          <DialogDescription>
            Select which columns to display and drag to reorder them.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Quick actions */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {visibleCount} of {totalCount} columns visible
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowAll}
                disabled={visibleCount === totalCount}
              >
                <Eye className="mr-1 h-3 w-3" />
                Show all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHideAll}
                disabled={visibleCount === 1}
              >
                <EyeOff className="mr-1 h-3 w-3" />
                Hide all
              </Button>
            </div>
          </div>

          {/* Column list */}
          <div className="max-h-[400px] space-y-1 overflow-y-auto">
            {localColumns.map((column, index) => (
              <div
                key={column.apiName}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-3 rounded-md border border-transparent p-2 transition-all',
                  draggedIndex === index && 'opacity-50',
                  dragOverIndex === index &&
                    'border-primary bg-primary/5 border-dashed',
                  draggedIndex !== index &&
                    dragOverIndex !== index &&
                    'hover:bg-muted/50'
                )}
              >
                <div className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </div>

                <Checkbox
                  id={`col-${column.apiName}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.apiName)}
                  disabled={column.visible && visibleCount === 1}
                />

                <Label
                  htmlFor={`col-${column.apiName}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {column.label}
                </Label>

                {column.sortable && (
                  <span className="text-xs text-muted-foreground">
                    Sortable
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
