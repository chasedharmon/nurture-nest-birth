/**
 * CRM Field Renderers
 *
 * This module exports all field type components used by DynamicRecordForm.
 * Each field type handles its own rendering, validation display, and state.
 */

// Types and utilities
export * from './field-types'

// Text fields
export { TextField, EmailField, PhoneField, UrlField } from './text-field'
export { TextAreaField } from './textarea-field'
export { RichTextField } from './rich-text-field'

// Number fields
export { NumberField, CurrencyField, PercentField } from './number-field'

// Date fields
export { DateField, DateTimeField } from './date-field'

// Boolean field
export { CheckboxField } from './checkbox-field'

// Selection fields
export { PicklistField, MultiPicklistField } from './picklist-field'

// Relationship fields
export { LookupField, MasterDetailField } from './lookup-field'
export type { LookupRecord, LookupSearchProps } from './lookup-field'

// Computed fields (read-only)
export { FormulaField } from './formula-field'
export { AutoNumberField } from './auto-number-field'
