/**
 * Excel export utilities using xlsx library
 */
import * as XLSX from 'xlsx'
import type { FilterCondition, ColumnConfig } from '@/lib/supabase/types'

export interface ExcelExportOptions {
  filename: string
  sheetName?: string
  columns?: ColumnConfig[]
  filters?: FilterCondition[]
  includeMetadata?: boolean
}

/**
 * Convert data to Excel workbook and trigger download
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions
): void {
  const {
    filename,
    sheetName = 'Data',
    columns,
    filters,
    includeMetadata = true,
  } = options

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Prepare data with column ordering
  const orderedData = columns
    ? data.map(row => {
        const orderedRow: Record<string, unknown> = {}
        columns.forEach(col => {
          orderedRow[col.label || col.field] = formatCellValue(row[col.field])
        })
        return orderedRow
      })
    : data.map(row => {
        const formattedRow: Record<string, unknown> = {}
        Object.entries(row).forEach(([key, value]) => {
          formattedRow[formatHeader(key)] = formatCellValue(value)
        })
        return formattedRow
      })

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(orderedData)

  // Set column widths based on content
  const colWidths = calculateColumnWidths(orderedData)
  worksheet['!cols'] = colWidths

  // Add data sheet
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Add metadata sheet if requested
  if (includeMetadata) {
    const metadataSheet = createMetadataSheet(data.length, filters)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info')
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}_${timestamp}.xlsx`

  // Trigger download
  XLSX.writeFile(workbook, fullFilename)
}

/**
 * Format cell value for Excel
 */
function formatCellValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return ''

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value as string | number | boolean
}

/**
 * Format header name (snake_case to Title Case)
 */
function formatHeader(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Calculate optimal column widths based on content
 */
function calculateColumnWidths(
  data: Record<string, unknown>[]
): { wch: number }[] {
  if (data.length === 0) return []

  const firstRow = data[0]!
  const headers = Object.keys(firstRow)
  return headers.map(header => {
    // Get max length of header and all values
    let maxLength = header.length

    data.forEach(row => {
      const value = row[header]
      const strValue = value?.toString() || ''
      maxLength = Math.max(maxLength, strValue.length)
    })

    // Cap at reasonable max width (50 chars)
    return { wch: Math.min(maxLength + 2, 50) }
  })
}

/**
 * Create metadata sheet with export info
 */
function createMetadataSheet(
  recordCount: number,
  filters?: FilterCondition[]
): XLSX.WorkSheet {
  const metadata = [
    ['Export Information'],
    [''],
    ['Export Date', new Date().toLocaleString()],
    ['Total Records', recordCount],
    [''],
  ]

  if (filters && filters.length > 0) {
    metadata.push(['Applied Filters'])
    filters.forEach(filter => {
      metadata.push([`${filter.field} ${filter.operator} ${filter.value}`, ''])
    })
  } else {
    metadata.push(['Filters', 'None (all records)'])
  }

  return XLSX.utils.aoa_to_sheet(metadata)
}

/**
 * Convert data to Excel blob (for server-side generation)
 */
export function dataToExcelBlob<T extends Record<string, unknown>>(
  data: T[],
  options: Omit<ExcelExportOptions, 'filename'>
): Blob {
  const {
    sheetName = 'Data',
    columns,
    filters,
    includeMetadata = true,
  } = options

  const workbook = XLSX.utils.book_new()

  const orderedData = columns
    ? data.map(row => {
        const orderedRow: Record<string, unknown> = {}
        columns.forEach(col => {
          orderedRow[col.label || col.field] = formatCellValue(row[col.field])
        })
        return orderedRow
      })
    : data.map(row => {
        const formattedRow: Record<string, unknown> = {}
        Object.entries(row).forEach(([key, value]) => {
          formattedRow[formatHeader(key)] = formatCellValue(value)
        })
        return formattedRow
      })

  const worksheet = XLSX.utils.json_to_sheet(orderedData)
  worksheet['!cols'] = calculateColumnWidths(orderedData)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  if (includeMetadata) {
    const metadataSheet = createMetadataSheet(data.length, filters)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info')
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
