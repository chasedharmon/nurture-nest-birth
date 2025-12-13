/**
 * CSV export utilities for list view exports
 */
import type { FilterCondition, ColumnConfig } from '@/lib/supabase/types'

export interface CSVExportOptions {
  filename: string
  columns?: ColumnConfig[]
  filters?: FilterCondition[]
  includeMetadata?: boolean
}

/**
 * Convert data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions
): void {
  const { filename, columns, filters, includeMetadata = true } = options

  // Build CSV content
  let csvContent = ''

  // Add metadata header if requested
  if (includeMetadata) {
    csvContent += `# Export Date: ${new Date().toLocaleString()}\n`
    csvContent += `# Total Records: ${data.length}\n`

    if (filters && filters.length > 0) {
      csvContent += `# Filters: ${filters.map(f => `${f.field} ${f.operator} ${f.value}`).join('; ')}\n`
    }

    csvContent += '#\n'
  }

  if (data.length === 0) {
    csvContent += 'No data to export'
    downloadCSV(csvContent, filename)
    return
  }

  // Determine headers based on columns or data keys
  const firstRow = data[0]!
  const headers = columns
    ? columns.map(col => col.label || col.field)
    : Object.keys(firstRow).map(formatHeader)

  const fields = columns ? columns.map(col => col.field) : Object.keys(firstRow)

  // Add header row
  csvContent += headers.map(escapeCSVValue).join(',') + '\n'

  // Add data rows
  data.forEach(row => {
    const values = fields.map(field => {
      const value = row[field]
      return escapeCSVValue(formatCellValue(value))
    })
    csvContent += values.join(',') + '\n'
  })

  // Trigger download
  downloadCSV(csvContent, filename)
}

/**
 * Format cell value for CSV
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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
 * Download CSV content as file
 */
function downloadCSV(content: string, filename: string): void {
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}_${timestamp}.csv`

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', fullFilename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert data to CSV blob (for server-side generation)
 */
export function dataToCSVBlob<T extends Record<string, unknown>>(
  data: T[],
  options: Omit<CSVExportOptions, 'filename'>
): Blob {
  const { columns, filters, includeMetadata = true } = options

  let csvContent = ''

  if (includeMetadata) {
    csvContent += `# Export Date: ${new Date().toLocaleString()}\n`
    csvContent += `# Total Records: ${data.length}\n`

    if (filters && filters.length > 0) {
      csvContent += `# Filters: ${filters.map(f => `${f.field} ${f.operator} ${f.value}`).join('; ')}\n`
    }

    csvContent += '#\n'
  }

  if (data.length === 0) {
    csvContent += 'No data to export'
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  const firstRow = data[0]!
  const headers = columns
    ? columns.map(col => col.label || col.field)
    : Object.keys(firstRow).map(formatHeader)

  const fields = columns ? columns.map(col => col.field) : Object.keys(firstRow)

  csvContent += headers.map(escapeCSVValue).join(',') + '\n'

  data.forEach(row => {
    const values = fields.map(field => {
      const value = row[field]
      return escapeCSVValue(formatCellValue(value))
    })
    csvContent += values.join(',') + '\n'
  })

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}
