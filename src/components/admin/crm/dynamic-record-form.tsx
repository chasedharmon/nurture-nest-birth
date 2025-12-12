'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import type {
  FieldDefinition,
  FieldWithPicklistValues,
  PageLayout,
  FieldDataType,
} from '@/lib/crm/types'

import {
  TextField,
  EmailField,
  PhoneField,
  UrlField,
  TextAreaField,
  RichTextField,
  NumberField,
  CurrencyField,
  PercentField,
  DateField,
  DateTimeField,
  CheckboxField,
  PicklistField,
  MultiPicklistField,
  LookupField,
  MasterDetailField,
  FormulaField,
  AutoNumberField,
  type BaseFieldProps,
  type LookupSearchProps,
  type LookupRecord,
} from './fields'

// =====================================================
// TYPES
// =====================================================

interface DynamicRecordFormProps {
  /** The page layout configuration */
  layout: PageLayout | null
  /** All field definitions for the object */
  fields: FieldWithPicklistValues[]
  /** Current record data (for edit mode) */
  initialData?: Record<string, unknown>
  /** Whether the form is in edit mode (vs create) */
  mode?: 'create' | 'edit'
  /** Whether to show fields as read-only */
  readOnly?: boolean
  /** Submit handler */
  onSubmit?: (data: Record<string, unknown>) => Promise<void>
  /** Cancel handler */
  onCancel?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Search function for lookup fields */
  onLookupSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
  /** Click handler for lookup record links */
  onLookupRecordClick?: (recordId: string, objectApiName: string) => void
  /** Custom submit button text */
  submitLabel?: string
  /** Additional CSS classes */
  className?: string
}

interface FormSection {
  id: string
  name: string
  columns: 1 | 2
  collapsed: boolean
  fields: FieldWithPicklistValues[]
}

type ValidationErrors = Record<string, string>

// =====================================================
// FIELD RENDERER MAPPING
// =====================================================

const FIELD_RENDERERS: Record<
  FieldDataType,
  React.ComponentType<
    BaseFieldProps & {
      onSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
      onRecordClick?: (recordId: string, objectApiName: string) => void
    }
  >
> = {
  text: TextField,
  textarea: TextAreaField,
  rich_text: RichTextField,
  number: NumberField,
  currency: CurrencyField,
  percent: PercentField,
  date: DateField,
  datetime: DateTimeField,
  checkbox: CheckboxField,
  picklist: PicklistField,
  multipicklist: MultiPicklistField,
  lookup: LookupField,
  master_detail: MasterDetailField,
  email: EmailField,
  phone: PhoneField,
  url: UrlField,
  formula: FormulaField,
  auto_number: AutoNumberField,
}

// =====================================================
// MAIN COMPONENT
// =====================================================

/**
 * DynamicRecordForm - Renders CRM record forms based on page layouts
 *
 * This component dynamically renders a form based on:
 * - Page layout sections (from layout_config)
 * - Field definitions (type, constraints, etc.)
 * - Picklist values for selection fields
 *
 * Features:
 * - Create and edit modes
 * - Section collapsibility
 * - 1 or 2 column layouts per section
 * - Required field validation
 * - Custom field support via JSONB
 */
export function DynamicRecordForm({
  layout,
  fields,
  initialData = {},
  mode = 'create',
  readOnly = false,
  onSubmit,
  onCancel,
  isLoading = false,
  onLookupSearch,
  onLookupRecordClick,
  submitLabel,
  className,
}: DynamicRecordFormProps) {
  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      const collapsed = new Set<string>()
      layout?.layout_config?.sections?.forEach(section => {
        if (section.collapsed) {
          collapsed.add(section.id)
        }
      })
      return collapsed
    }
  )

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(initialData)
    setErrors({})
    setSubmitError(null)
  }, [initialData])

  // Build sections from layout
  const sections = useMemo((): FormSection[] => {
    const fieldMap = new Map(fields.map(f => [f.api_name, f]))

    if (layout?.layout_config?.sections?.length) {
      return layout.layout_config.sections.map(section => ({
        ...section,
        fields: section.fields
          .map(apiName => fieldMap.get(apiName))
          .filter((f): f is FieldWithPicklistValues => f !== undefined),
      }))
    }

    // Default: single section with all visible fields
    const visibleFields = fields.filter(f => f.is_visible && f.is_active)
    return [
      {
        id: 'main',
        name: 'Information',
        columns: 2,
        collapsed: false,
        fields: visibleFields,
      },
    ]
  }, [layout, fields])

  // Handle field value change
  const handleFieldChange = useCallback(
    (field: FieldDefinition, value: unknown) => {
      setFormData(prev => {
        // Custom fields go into custom_fields JSONB
        if (field.is_custom_field) {
          const customFields = (prev.custom_fields || {}) as Record<
            string,
            unknown
          >
          return {
            ...prev,
            custom_fields: {
              ...customFields,
              [field.api_name]: value,
            },
          }
        }
        // Standard fields use column_name
        const key = field.column_name || field.api_name
        return { ...prev, [key]: value }
      })

      // Clear error when field is modified
      if (errors[field.api_name]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field.api_name]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Get field value from form data
  const getFieldValue = useCallback(
    (field: FieldDefinition): unknown => {
      if (field.is_custom_field) {
        const customFields = formData.custom_fields as
          | Record<string, unknown>
          | undefined
        return customFields?.[field.api_name]
      }
      const key = field.column_name || field.api_name
      return formData[key]
    },
    [formData]
  )

  // Validate required fields
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}

    fields.forEach(field => {
      if (field.is_required && !field.is_read_only) {
        const value = getFieldValue(field)
        const isEmpty =
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          newErrors[field.api_name] = `${field.label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [fields, getFieldValue])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)

      if (!validate()) {
        return
      }

      if (!onSubmit) return

      try {
        setIsSubmitting(true)
        await onSubmit(formData)
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'An error occurred while saving'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validate, onSubmit]
  )

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Check if a field should be read-only
  const isFieldReadOnly = (field: FieldDefinition): boolean => {
    if (readOnly) return true
    if (field.is_read_only) return true
    if (field.data_type === 'formula') return true
    if (field.data_type === 'auto_number') return true
    return false
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Failed to save
            </p>
            <p className="text-sm text-destructive/80">{submitError}</p>
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          isCollapsed={collapsedSections.has(section.id)}
          onToggle={() => toggleSection(section.id)}
          getFieldValue={getFieldValue}
          onFieldChange={handleFieldChange}
          errors={errors}
          isFieldReadOnly={isFieldReadOnly}
          onLookupSearch={onLookupSearch}
          onLookupRecordClick={onLookupRecordClick}
        />
      ))}

      {/* Form Actions */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {submitLabel || (mode === 'create' ? 'Create' : 'Save Changes')}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

// =====================================================
// SECTION RENDERER
// =====================================================

interface SectionRendererProps {
  section: FormSection
  isCollapsed: boolean
  onToggle: () => void
  getFieldValue: (field: FieldDefinition) => unknown
  onFieldChange: (field: FieldDefinition, value: unknown) => void
  errors: ValidationErrors
  isFieldReadOnly: (field: FieldDefinition) => boolean
  onLookupSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
  onLookupRecordClick?: (recordId: string, objectApiName: string) => void
}

function SectionRenderer({
  section,
  isCollapsed,
  onToggle,
  getFieldValue,
  onFieldChange,
  errors,
  isFieldReadOnly,
  onLookupSearch,
  onLookupRecordClick,
}: SectionRendererProps) {
  return (
    <Card>
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggle()}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between"
            >
              <CardTitle className="text-base">{section.name}</CardTitle>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div
              className={cn(
                'grid gap-4',
                section.columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'
              )}
            >
              {section.fields.map(field => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={getFieldValue(field)}
                  onChange={value => onFieldChange(field, value)}
                  error={errors[field.api_name]}
                  readOnly={isFieldReadOnly(field)}
                  onLookupSearch={onLookupSearch}
                  onLookupRecordClick={onLookupRecordClick}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// =====================================================
// FIELD RENDERER
// =====================================================

interface FieldRendererProps {
  field: FieldWithPicklistValues
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  readOnly: boolean
  onLookupSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
  onLookupRecordClick?: (recordId: string, objectApiName: string) => void
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  readOnly,
  onLookupSearch,
  onLookupRecordClick,
}: FieldRendererProps) {
  const FieldComponent = FIELD_RENDERERS[field.data_type]

  if (!FieldComponent) {
    console.warn(`No renderer found for field type: ${field.data_type}`)
    return null
  }

  // Checkbox fields have special label handling
  const showLabel = field.data_type !== 'checkbox'

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label
          htmlFor={`field-${field.id}`}
          className={cn('flex items-center gap-1', error && 'text-destructive')}
        >
          {field.label}
          {field.is_required && !readOnly && (
            <span className="text-destructive">*</span>
          )}
        </Label>
      )}

      <FieldComponent
        field={field}
        value={value}
        onChange={onChange}
        disabled={false}
        readOnly={readOnly}
        error={error}
        onSearch={onLookupSearch}
        onRecordClick={onLookupRecordClick}
      />

      {/* Help text */}
      {field.help_text && field.data_type !== 'checkbox' && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export type { DynamicRecordFormProps }
