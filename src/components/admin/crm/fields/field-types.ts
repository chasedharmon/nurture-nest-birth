/**
 * Shared types and interfaces for CRM field renderers
 */

import type {
  FieldDefinition,
  FieldWithPicklistValues,
  FieldTypeConfig,
  TextFieldConfig,
  NumberFieldConfig,
  CurrencyFieldConfig,
  PicklistFieldConfig,
  LookupFieldConfig,
  FormulaFieldConfig,
  AutoNumberFieldConfig,
} from '@/lib/crm/types'

/**
 * Props common to all field renderers
 */
export interface BaseFieldProps {
  /** The field definition with metadata */
  field: FieldWithPicklistValues
  /** Current field value */
  value: unknown
  /** Callback when value changes */
  onChange: (value: unknown) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether to show the field in read-only mode */
  readOnly?: boolean
  /** Error message to display */
  error?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Type guard for TextFieldConfig
 */
export function isTextFieldConfig(
  config: FieldTypeConfig
): config is TextFieldConfig {
  return config !== null && typeof config === 'object' && 'maxLength' in config
}

/**
 * Type guard for NumberFieldConfig
 */
export function isNumberFieldConfig(
  config: FieldTypeConfig
): config is NumberFieldConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    ('precision' in config ||
      'scale' in config ||
      'min' in config ||
      'max' in config)
  )
}

/**
 * Type guard for CurrencyFieldConfig
 */
export function isCurrencyFieldConfig(
  config: FieldTypeConfig
): config is CurrencyFieldConfig {
  return (
    config !== null && typeof config === 'object' && 'currencyCode' in config
  )
}

/**
 * Type guard for PicklistFieldConfig
 */
export function isPicklistFieldConfig(
  config: FieldTypeConfig
): config is PicklistFieldConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    ('allowBlank' in config || 'controllingFieldId' in config)
  )
}

/**
 * Type guard for LookupFieldConfig
 */
export function isLookupFieldConfig(
  config: FieldTypeConfig
): config is LookupFieldConfig {
  return (
    config !== null && typeof config === 'object' && 'relatedObjectId' in config
  )
}

/**
 * Type guard for FormulaFieldConfig
 */
export function isFormulaFieldConfig(
  config: FieldTypeConfig
): config is FormulaFieldConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    'formula' in config &&
    'returnType' in config
  )
}

/**
 * Type guard for AutoNumberFieldConfig
 */
export function isAutoNumberFieldConfig(
  config: FieldTypeConfig
): config is AutoNumberFieldConfig {
  return config !== null && typeof config === 'object' && 'format' in config
}

/**
 * Format a value for display based on field type
 */
export function formatDisplayValue(
  value: unknown,
  field: FieldDefinition
): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (field.data_type) {
    case 'currency': {
      const config = field.type_config as CurrencyFieldConfig
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return ''
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: config?.currencyCode || 'USD',
      }).format(num)
    }

    case 'percent': {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return ''
      return `${num}%`
    }

    case 'date': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString()
    }

    case 'datetime': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return ''
      return date.toLocaleString()
    }

    case 'checkbox':
      return value ? 'Yes' : 'No'

    case 'multipicklist':
      return Array.isArray(value) ? value.join(', ') : String(value)

    default:
      return String(value)
  }
}
