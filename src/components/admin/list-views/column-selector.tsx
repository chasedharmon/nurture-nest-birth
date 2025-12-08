'use client'

import { useState } from 'react'
import { GripVertical, RotateCcw } from 'lucide-react'
import type { ColumnConfig } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface ColumnSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig[]
  defaultColumns: ColumnConfig[]
  onApply: (columns: ColumnConfig[]) => void
}

export function ColumnSelector({
  open,
  onOpenChange,
  columns,
  defaultColumns,
  onApply,
}: ColumnSelectorProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleToggleColumn = (field: string) => {
    setLocalColumns(
      localColumns.map(col =>
        col.field === field ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newColumns = [...localColumns]
    const draggedColumn = newColumns[draggedIndex]
    if (!draggedColumn) return
    newColumns.splice(draggedIndex, 1)
    newColumns.splice(index, 0, draggedColumn)

    setLocalColumns(newColumns)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleReset = () => {
    setLocalColumns(defaultColumns)
  }

  const handleApply = () => {
    onApply(localColumns)
  }

  const visibleCount = localColumns.filter(col => col.visible).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Select and reorder columns. Drag to change order.
          </p>

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {localColumns.map((column, index) => (
              <div
                key={column.field}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 rounded-md border border-transparent p-2 transition-colors ${
                  draggedIndex === index
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>

                <Checkbox
                  id={`col-${column.field}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.field)}
                />

                <Label
                  htmlFor={`col-${column.field}`}
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

          <p className="mt-4 text-sm text-muted-foreground">
            {visibleCount} of {localColumns.length} columns visible
          </p>
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
