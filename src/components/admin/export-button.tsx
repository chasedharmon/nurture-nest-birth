'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV } from '@/lib/export/csv'
import { exportToExcel } from '@/lib/export/excel'
import type { FilterCondition, ColumnConfig } from '@/lib/supabase/types'

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[]
  filename: string
  columns?: ColumnConfig[]
  filters?: FilterCondition[]
  selectedIds?: Set<string>
  totalCount?: number
  disabled?: boolean
}

export function ExportButton<
  T extends Record<string, unknown> & { id: string },
>({
  data,
  filename,
  columns,
  filters,
  selectedIds,
  totalCount,
  disabled = false,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const hasSelection = selectedIds && selectedIds.size > 0
  const exportData = hasSelection
    ? data.filter(item => selectedIds.has(item.id))
    : data

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true)

    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 100))

      const exportOptions = {
        filename: hasSelection ? `${filename}_selected` : filename,
        columns,
        filters: hasSelection ? undefined : filters, // Don't include filters if exporting selection
        includeMetadata: true,
      }

      if (format === 'csv') {
        exportToCSV(exportData, exportOptions)
      } else {
        exportToExcel(exportData, exportOptions)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const recordCount = hasSelection
    ? selectedIds.size
    : (totalCount ?? data.length)
  const recordLabel = recordCount === 1 ? 'record' : 'records'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={disabled || isExporting || data.length === 0}
        >
          {isExporting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Download className="mr-1 h-3 w-3" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {hasSelection ? (
            <span>
              Export {selectedIds.size} selected {recordLabel}
            </span>
          ) : (
            <span>
              Export {recordCount} {recordLabel}
              {filters && filters.length > 0 && ' (filtered)'}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
          <span className="ml-auto text-xs text-muted-foreground">.csv</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
          <span className="ml-auto text-xs text-muted-foreground">.xlsx</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
