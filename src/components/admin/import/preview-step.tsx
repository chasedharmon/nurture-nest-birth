'use client'

import { useMemo, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible'
import { validateAllRows } from '@/lib/import/validators'
import { FIELD_DEFINITIONS } from '@/lib/import/field-definitions'
import type {
  ImportObjectType,
  ParsedFile,
  ImportPreviewRow,
} from '@/lib/import/types'

interface PreviewStepProps {
  parsedFile: ParsedFile
  objectType: ImportObjectType
  mapping: Record<string, string | null>
  onRowSelectionChange: (selectedRows: number[]) => void
  selectedRows: number[]
}

export function PreviewStep({
  parsedFile,
  objectType,
  mapping,
  onRowSelectionChange,
  selectedRows,
}: PreviewStepProps) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)

  // Validate all rows
  const previewRows = useMemo(
    () => validateAllRows(parsedFile.rows, mapping, objectType),
    [parsedFile.rows, mapping, objectType]
  )

  // Get mapped fields for display
  const mappedFields = useMemo(() => {
    const fields = FIELD_DEFINITIONS[objectType]
    const mapped = Object.values(mapping).filter(Boolean) as string[]
    return fields.filter(f => mapped.includes(f.field))
  }, [objectType, mapping])

  // Stats
  const validCount = previewRows.filter(r => r.isValid).length
  const errorCount = previewRows.filter(r => !r.isValid).length
  const totalCount = previewRows.length

  // Filter rows if showing only errors
  const displayRows = showOnlyErrors
    ? previewRows.filter(r => !r.isValid)
    : previewRows.slice(0, 100) // Limit display for performance

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const validRowNumbers = previewRows
        .filter(r => r.isValid)
        .map(r => r.rowNumber)
      onRowSelectionChange(validRowNumbers)
    } else {
      onRowSelectionChange([])
    }
  }

  const handleSelectRow = (rowNumber: number, checked: boolean) => {
    if (checked) {
      onRowSelectionChange([...selectedRows, rowNumber])
    } else {
      onRowSelectionChange(selectedRows.filter(r => r !== rowNumber))
    }
  }

  const allValidSelected = previewRows
    .filter(r => r.isValid)
    .every(r => selectedRows.includes(r.rowNumber))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preview & Validate</h2>
        <p className="text-sm text-muted-foreground">
          Review your data before importing. You can deselect rows to skip them.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
              <span className="text-lg font-bold text-blue-600">
                {totalCount}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Rows</p>
              <p className="font-medium">in file</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Rows</p>
              <p className="font-medium">{validCount} ready to import</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-950">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invalid Rows</p>
              <p className="font-medium">{errorCount} have errors</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toggle */}
      {errorCount > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-errors"
            checked={showOnlyErrors}
            onCheckedChange={checked => setShowOnlyErrors(!!checked)}
          />
          <label htmlFor="show-errors" className="cursor-pointer text-sm">
            Show only rows with errors ({errorCount})
          </label>
        </div>
      )}

      {/* Data Preview Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-12 p-3">
                  <Checkbox
                    checked={allValidSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all valid rows"
                  />
                </th>
                <th className="w-16 p-3 text-left text-sm font-medium">Row</th>
                <th className="w-24 p-3 text-left text-sm font-medium">
                  Status
                </th>
                {mappedFields.map(field => (
                  <th
                    key={field.field}
                    className="min-w-[120px] p-3 text-left text-sm font-medium"
                  >
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <PreviewRow
                  key={row.rowNumber}
                  row={row}
                  mappedFields={mappedFields}
                  isSelected={selectedRows.includes(row.rowNumber)}
                  onSelectChange={checked =>
                    handleSelectRow(row.rowNumber, checked)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        {!showOnlyErrors && previewRows.length > 100 && (
          <div className="border-t bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            Showing first 100 rows of {previewRows.length} total
          </div>
        )}
      </Card>

      {/* Selection Summary */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
        <p className="text-sm">
          <span className="font-medium">{selectedRows.length}</span> rows
          selected for import
        </p>
        {selectedRows.length < validCount && (
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              onRowSelectionChange(
                previewRows.filter(r => r.isValid).map(r => r.rowNumber)
              )
            }
          >
            Select all valid rows
          </Button>
        )}
      </div>
    </div>
  )
}

function PreviewRow({
  row,
  mappedFields,
  isSelected,
  onSelectChange,
}: {
  row: ImportPreviewRow
  mappedFields: { field: string; label: string }[]
  isSelected: boolean
  onSelectChange: (checked: boolean) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <tr
        className={`border-b transition-colors ${
          !row.isValid ? 'bg-red-50/50 dark:bg-red-950/20' : ''
        } ${isSelected ? 'bg-primary/5' : ''}`}
      >
        <td className="p-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectChange}
            disabled={!row.isValid}
            aria-label={`Select row ${row.rowNumber}`}
          />
        </td>
        <td className="p-3 text-sm">{row.rowNumber}</td>
        <td className="p-3">
          {row.isValid ? (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Valid
            </Badge>
          ) : (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-red-600 hover:bg-transparent"
                >
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {row.errors.length} error(s)
                    {isExpanded ? (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronRight className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </td>
        {mappedFields.map(field => {
          const value = row.data[field.field]
          const hasError = row.errors.some(e => e.field === field.field)
          return (
            <td
              key={field.field}
              className={`max-w-[200px] truncate p-3 text-sm ${
                hasError ? 'text-red-600' : ''
              }`}
              title={String(value || '')}
            >
              {value ? (
                String(value)
              ) : (
                <span className="italic text-muted-foreground">—</span>
              )}
            </td>
          )
        })}
      </tr>
      {!row.isValid && isExpanded && (
        <tr className="bg-red-50/30 dark:bg-red-950/10">
          <td colSpan={mappedFields.length + 3} className="p-3">
            <ul className="space-y-1 text-sm text-red-600">
              {row.errors.map((error, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {error.message}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}
