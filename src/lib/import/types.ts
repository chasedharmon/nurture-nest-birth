/**
 * Import types for CSV/Excel import wizard
 */

export type ImportObjectType =
  | 'leads'
  | 'clients'
  | 'invoices'
  | 'meetings'
  | 'services'

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ParsedFile {
  filename: string
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  previewRows: Record<string, string>[]
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string | null
  isRequired: boolean
}

export interface FieldDefinition {
  field: string
  label: string
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select'
  required: boolean
  options?: { value: string; label: string }[]
}

export interface ValidationError {
  row: number
  field: string
  value: string
  message: string
}

export interface ImportPreviewRow {
  rowNumber: number
  data: Record<string, unknown>
  isValid: boolean
  errors: ValidationError[]
  isDuplicate: boolean
  duplicateOf?: string
}

export interface ImportResult {
  success: boolean
  totalRows: number
  successfulRows: number
  failedRows: number
  skippedRows: number
  errors: Array<{
    row: number
    message: string
    data?: Record<string, unknown>
  }>
}

export interface MappingTemplate {
  id: string
  name: string
  description?: string
  objectType: ImportObjectType
  mappings: Record<string, string>
  createdAt: string
}

export interface ImportJob {
  id: string
  objectType: ImportObjectType
  fileName: string
  fileSize?: number
  totalRows: number
  successfulRows: number
  failedRows: number
  skippedRows: number
  status: ImportStatus
  mapping: Record<string, string>
  errorLog: Array<{ row: number; message: string }>
  createdBy?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
}
