/**
 * Data validation utilities for import
 */
import type {
  ImportObjectType,
  ValidationError,
  ImportPreviewRow,
  FieldDefinition,
} from './types'
import { FIELD_DEFINITIONS } from './field-definitions'

/**
 * Validate a single row of data
 */
export function validateRow(
  rowNumber: number,
  data: Record<string, string>,
  mapping: Record<string, string | null>,
  objectType: ImportObjectType
): ValidationError[] {
  const errors: ValidationError[] = []
  const fieldDefs = FIELD_DEFINITIONS[objectType]
  const mappedData = applyMapping(data, mapping)

  for (const fieldDef of fieldDefs) {
    const value = mappedData[fieldDef.field]

    // Check required fields
    if (fieldDef.required && (!value || value.trim() === '')) {
      errors.push({
        row: rowNumber,
        field: fieldDef.field,
        value: value || '',
        message: `${fieldDef.label} is required`,
      })
      continue
    }

    // Skip validation for empty optional fields
    if (!value || value.trim() === '') continue

    // Type-specific validation
    const typeError = validateFieldType(rowNumber, fieldDef, value)
    if (typeError) {
      errors.push(typeError)
    }
  }

  return errors
}

/**
 * Validate field value based on type
 */
function validateFieldType(
  rowNumber: number,
  fieldDef: FieldDefinition,
  value: string
): ValidationError | null {
  switch (fieldDef.type) {
    case 'email':
      if (!isValidEmail(value)) {
        return {
          row: rowNumber,
          field: fieldDef.field,
          value,
          message: `Invalid email address: ${value}`,
        }
      }
      break

    case 'phone':
      if (!isValidPhone(value)) {
        return {
          row: rowNumber,
          field: fieldDef.field,
          value,
          message: `Invalid phone number: ${value}`,
        }
      }
      break

    case 'date':
      if (!isValidDate(value)) {
        return {
          row: rowNumber,
          field: fieldDef.field,
          value,
          message: `Invalid date: ${value}. Use YYYY-MM-DD format.`,
        }
      }
      break

    case 'number':
      if (isNaN(parseFloat(value))) {
        return {
          row: rowNumber,
          field: fieldDef.field,
          value,
          message: `Invalid number: ${value}`,
        }
      }
      break

    case 'select':
      if (fieldDef.options) {
        const validValues = fieldDef.options.map(o => o.value.toLowerCase())
        if (!validValues.includes(value.toLowerCase())) {
          return {
            row: rowNumber,
            field: fieldDef.field,
            value,
            message: `Invalid value: ${value}. Expected one of: ${fieldDef.options.map(o => o.label).join(', ')}`,
          }
        }
      }
      break
  }

  return null
}

/**
 * Apply column mapping to transform source data
 */
export function applyMapping(
  sourceData: Record<string, string>,
  mapping: Record<string, string | null>
): Record<string, string> {
  const result: Record<string, string> = {}

  Object.entries(mapping).forEach(([sourceCol, targetField]) => {
    if (targetField && sourceData[sourceCol] !== undefined) {
      result[targetField] = sourceData[sourceCol]
    }
  })

  return result
}

/**
 * Validate all rows and generate preview
 */
export function validateAllRows(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  objectType: ImportObjectType
): ImportPreviewRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 1
    const errors = validateRow(rowNumber, row, mapping, objectType)
    const mappedData = applyMapping(row, mapping)

    return {
      rowNumber,
      data: mappedData,
      isValid: errors.length === 0,
      errors,
      isDuplicate: false, // Will be set by duplicate detection
    }
  })
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Phone validation (flexible - accepts various formats)
 */
function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '')
  // Should be at least 10 digits
  return /^\d{10,15}$/.test(cleaned)
}

/**
 * Date validation
 */
function isValidDate(dateStr: string): boolean {
  // Try to parse various formats
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) return true

  // Try MM/DD/YYYY format
  const parts = dateStr.split(/[\/\-]/)
  if (parts.length === 3) {
    const [month, day, year] = parts as [string, string, string]
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return !isNaN(parsed.getTime())
  }

  return false
}

/**
 * Normalize date to ISO format
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null

  // Try ISO format first
  let date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]!
  }

  // Try MM/DD/YYYY format
  const parts = dateStr.split(/[\/\-]/)
  if (parts.length === 3) {
    const [month, day, year] = parts
    date = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!))
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]!
    }
  }

  return null
}

/**
 * Normalize phone number
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+')
  const digits = phone.replace(/\D/g, '')

  // If US number without country code, don't add +1
  if (digits.length === 10) {
    return digits
  }

  // If has country code
  if (hasPlus || digits.length > 10) {
    return '+' + digits
  }

  return digits
}

/**
 * Transform row data for database insertion
 */
export function transformRowForInsert(
  data: Record<string, string>,
  objectType: ImportObjectType
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const fieldDefs = FIELD_DEFINITIONS[objectType]

  for (const fieldDef of fieldDefs) {
    const value = data[fieldDef.field]
    if (!value || value.trim() === '') continue

    switch (fieldDef.type) {
      case 'date':
        result[fieldDef.field] = normalizeDate(value)
        break
      case 'phone':
        result[fieldDef.field] = normalizePhone(value)
        break
      case 'number':
        result[fieldDef.field] = parseFloat(value)
        break
      case 'select':
        // Normalize select values to lowercase
        result[fieldDef.field] = value.toLowerCase()
        break
      default:
        result[fieldDef.field] = value.trim()
    }
  }

  return result
}
