'use client'

/**
 * Create Custom Object Wizard
 *
 * A multi-step wizard dialog for creating new custom CRM objects.
 * Follows the Salesforce-like metadata-driven architecture where
 * objects are defined in the database rather than code.
 *
 * Steps:
 * 1. Basic Info - Label, plural label, API name, description
 * 2. Features - Activities, notes, attachments, sharing model
 * 3. Appearance - Icon and color selection
 * 4. Fields - Add initial custom fields (optional)
 * 5. Review - Summary before creation
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Palette,
  Layers,
  Check,
  Plus,
  X,
  AlertCircle,
  Loader2,
  // Icons for object selection
  Box,
  Briefcase,
  Calendar,
  ClipboardList,
  FileSpreadsheet,
  Folder,
  Heart,
  Home,
  MapPin,
  Package,
  Star,
  Tag,
  Users,
  Zap,
} from 'lucide-react'
import type { SharingModel, FieldDataType } from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

interface WizardField {
  id: string
  label: string
  apiName: string
  dataType: FieldDataType
  isRequired: boolean
  description?: string
  picklistValues?: string[]
}

interface WizardData {
  // Step 1: Basic Info
  label: string
  pluralLabel: string
  apiName: string
  description: string

  // Step 2: Features
  hasActivities: boolean
  hasNotes: boolean
  hasAttachments: boolean
  sharingModel: SharingModel

  // Step 3: Appearance
  iconName: string
  color: string

  // Step 4: Fields
  fields: WizardField[]
}

interface CreateObjectWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// =====================================================
// CONSTANTS
// =====================================================

const STEPS = [
  { id: 1, name: 'Basic Info', icon: FileText },
  { id: 2, name: 'Features', icon: Layers },
  { id: 3, name: 'Appearance', icon: Palette },
  { id: 4, name: 'Fields', icon: Database },
  { id: 5, name: 'Review', icon: Check },
]

const ICON_OPTIONS = [
  { name: 'box', icon: Box, label: 'Box' },
  { name: 'briefcase', icon: Briefcase, label: 'Briefcase' },
  { name: 'calendar', icon: Calendar, label: 'Calendar' },
  { name: 'clipboard-list', icon: ClipboardList, label: 'Checklist' },
  { name: 'database', icon: Database, label: 'Database' },
  { name: 'file-spreadsheet', icon: FileSpreadsheet, label: 'Spreadsheet' },
  { name: 'folder', icon: Folder, label: 'Folder' },
  { name: 'heart', icon: Heart, label: 'Heart' },
  { name: 'home', icon: Home, label: 'Home' },
  { name: 'map-pin', icon: MapPin, label: 'Location' },
  { name: 'package', icon: Package, label: 'Package' },
  { name: 'star', icon: Star, label: 'Star' },
  { name: 'tag', icon: Tag, label: 'Tag' },
  { name: 'users', icon: Users, label: 'Users' },
  { name: 'zap', icon: Zap, label: 'Lightning' },
]

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Slate', value: '#64748B' },
]

const FIELD_TYPES: {
  value: FieldDataType
  label: string
  description: string
}[] = [
  {
    value: 'text',
    label: 'Text',
    description: 'Single line text up to 255 characters',
  },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  {
    value: 'currency',
    label: 'Currency',
    description: 'Money values with currency symbol',
  },
  { value: 'date', label: 'Date', description: 'Date without time' },
  { value: 'datetime', label: 'Date/Time', description: 'Date with time' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/False value' },
  {
    value: 'picklist',
    label: 'Picklist',
    description: 'Single selection from predefined values',
  },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'url', label: 'URL', description: 'Web address' },
]

const SHARING_MODEL_OPTIONS: {
  value: SharingModel
  label: string
  description: string
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only record owner and admins can access',
  },
  {
    value: 'read',
    label: 'Read Only',
    description: 'All users can view, only owner can edit',
  },
  {
    value: 'read_write',
    label: 'Read/Write',
    description: 'All users can view and edit',
  },
  {
    value: 'full_access',
    label: 'Full Access',
    description: 'All users have full access including delete',
  },
]

const INITIAL_DATA: WizardData = {
  label: '',
  pluralLabel: '',
  apiName: '',
  description: '',
  hasActivities: true,
  hasNotes: true,
  hasAttachments: true,
  sharingModel: 'private',
  iconName: 'database',
  color: '#3B82F6',
  fields: [],
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateApiName(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

function generatePluralLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return ''

  // Simple pluralization rules
  if (
    trimmed.endsWith('y') &&
    !['a', 'e', 'i', 'o', 'u'].includes(
      trimmed.charAt(trimmed.length - 2).toLowerCase()
    )
  ) {
    return trimmed.slice(0, -1) + 'ies'
  }
  if (
    trimmed.endsWith('s') ||
    trimmed.endsWith('x') ||
    trimmed.endsWith('z') ||
    trimmed.endsWith('ch') ||
    trimmed.endsWith('sh')
  ) {
    return trimmed + 'es'
  }
  return trimmed + 's'
}

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// =====================================================
// COMPONENT
// =====================================================

export function CreateObjectWizard({
  open,
  onOpenChange,
}: CreateObjectWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Field being edited in step 4
  const [editingField, setEditingField] = useState<WizardField | null>(null)
  const [showFieldForm, setShowFieldForm] = useState(false)

  // Reset wizard when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setData(INITIAL_DATA)
      setErrors({})
      setSubmitError(null)
      setEditingField(null)
      setShowFieldForm(false)
    }
  }, [open])

  // Auto-generate API name and plural label from label
  const handleLabelChange = useCallback((label: string) => {
    setData(prev => ({
      ...prev,
      label,
      apiName: generateApiName(label),
      pluralLabel: generatePluralLabel(label),
    }))
    setErrors(prev => ({ ...prev, label: '', apiName: '', pluralLabel: '' }))
  }, [])

  // Update data
  const updateData = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData(prev => ({ ...prev, [key]: value }))
      setErrors(prev => ({ ...prev, [key]: '' }))
    },
    []
  )

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1: // Basic Info
        if (!data.label.trim()) {
          newErrors.label = 'Label is required'
        }
        if (!data.pluralLabel.trim()) {
          newErrors.pluralLabel = 'Plural label is required'
        }
        if (!data.apiName.trim()) {
          newErrors.apiName = 'API name is required'
        } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.apiName)) {
          newErrors.apiName =
            'API name must start with a letter and contain only letters, numbers, and underscores'
        }
        break

      case 2: // Features - no required fields
        break

      case 3: // Appearance
        if (!data.iconName) {
          newErrors.iconName = 'Please select an icon'
        }
        if (!data.color) {
          newErrors.color = 'Please select a color'
        }
        break

      case 4: // Fields - optional, but validate any fields that exist
        for (const field of data.fields) {
          if (!field.label.trim()) {
            newErrors[`field_${field.id}_label`] = 'Field label is required'
          }
          if (!field.apiName.trim()) {
            newErrors[`field_${field.id}_apiName`] =
              'Field API name is required'
          }
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, data])

  // Navigate steps
  const goToNextStep = useCallback(() => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }, [validateStep])

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  // Add a new field
  const addField = useCallback(() => {
    const newField: WizardField = {
      id: generateFieldId(),
      label: '',
      apiName: '',
      dataType: 'text',
      isRequired: false,
      description: '',
      picklistValues: [],
    }
    setEditingField(newField)
    setShowFieldForm(true)
  }, [])

  // Save field being edited
  const saveField = useCallback((field: WizardField) => {
    setData(prev => {
      const existingIndex = prev.fields.findIndex(f => f.id === field.id)
      if (existingIndex >= 0) {
        const newFields = [...prev.fields]
        newFields[existingIndex] = field
        return { ...prev, fields: newFields }
      }
      return { ...prev, fields: [...prev.fields, field] }
    })
    setEditingField(null)
    setShowFieldForm(false)
  }, [])

  // Remove a field
  const removeField = useCallback((fieldId: string) => {
    setData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }))
  }, [])

  // Submit the wizard
  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Dynamic import to avoid SSR issues
      const { createCustomObjectWithFields } =
        await import('@/app/actions/custom-objects')

      const result = await createCustomObjectWithFields({
        label: data.label.trim(),
        pluralLabel: data.pluralLabel.trim(),
        apiName: data.apiName.trim(),
        description: data.description.trim() || null,
        hasActivities: data.hasActivities,
        hasNotes: data.hasNotes,
        hasAttachments: data.hasAttachments,
        sharingModel: data.sharingModel,
        iconName: data.iconName,
        color: data.color,
        fields: data.fields.map(f => ({
          label: f.label.trim(),
          apiName: f.apiName.trim(),
          dataType: f.dataType,
          isRequired: f.isRequired,
          description: f.description?.trim() || null,
          picklistValues:
            f.dataType === 'picklist' ? f.picklistValues : undefined,
        })),
      })

      if (result.error) {
        setSubmitError(result.error)
        return
      }

      // Success! Close dialog and redirect
      onOpenChange(false)
      router.push(`/admin/setup/objects/${result.data?.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error creating custom object:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, validateStep, onOpenChange, router])

  // Get icon component by name
  const getIconComponent = useCallback((iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.name === iconName)
    return iconOption?.icon || Database
  }, [])

  const SelectedIcon = getIconComponent(data.iconName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Create Custom Object
          </DialogTitle>
          <DialogDescription>
            Define a new custom object to store data specific to your business
            needs.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isActive &&
                        'border-primary bg-primary text-primary-foreground',
                      isCompleted &&
                        'border-primary bg-primary/10 text-primary',
                      !isActive &&
                        !isCompleted &&
                        'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-1 text-xs',
                      isActive && 'text-primary font-medium',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-12 mx-2 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Error Alert */}
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">
                  Object Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="label"
                  placeholder="e.g., Birth Plan, Insurance Claim"
                  value={data.label}
                  onChange={e => handleLabelChange(e.target.value)}
                  className={errors.label ? 'border-destructive' : ''}
                />
                {errors.label && (
                  <p className="text-sm text-destructive">{errors.label}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The singular name displayed in the UI
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pluralLabel">
                  Plural Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pluralLabel"
                  placeholder="e.g., Birth Plans, Insurance Claims"
                  value={data.pluralLabel}
                  onChange={e => updateData('pluralLabel', e.target.value)}
                  className={errors.pluralLabel ? 'border-destructive' : ''}
                />
                {errors.pluralLabel && (
                  <p className="text-sm text-destructive">
                    {errors.pluralLabel}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Used for list views and navigation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiName">
                  API Name <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="apiName"
                    placeholder="e.g., birth_plan"
                    value={data.apiName}
                    onChange={e =>
                      updateData('apiName', e.target.value.toLowerCase())
                    }
                    className={cn(
                      'flex-1',
                      errors.apiName ? 'border-destructive' : ''
                    )}
                  />
                  <Badge variant="secondary" className="shrink-0">
                    __c
                  </Badge>
                </div>
                {errors.apiName && (
                  <p className="text-sm text-destructive">{errors.apiName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Unique identifier used in code. The &quot;__c&quot; suffix
                  will be added automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this object is used for..."
                  value={data.description}
                  onChange={e => updateData('description', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional description to help users understand this object
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Features */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Enable Features</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which features to enable for this object.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Checkbox
                      id="hasActivities"
                      checked={data.hasActivities}
                      onCheckedChange={checked =>
                        updateData('hasActivities', !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="hasActivities"
                        className="font-medium cursor-pointer"
                      >
                        Activities
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Track tasks, events, calls, and emails related to
                        records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Checkbox
                      id="hasNotes"
                      checked={data.hasNotes}
                      onCheckedChange={checked =>
                        updateData('hasNotes', !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="hasNotes"
                        className="font-medium cursor-pointer"
                      >
                        Notes
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to add notes to records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Checkbox
                      id="hasAttachments"
                      checked={data.hasAttachments}
                      onCheckedChange={checked =>
                        updateData('hasAttachments', !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="hasAttachments"
                        className="font-medium cursor-pointer"
                      >
                        Attachments
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow file attachments on records
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="sharingModel">Sharing Model</Label>
                <Select
                  value={data.sharingModel}
                  onValueChange={value =>
                    updateData('sharingModel', value as SharingModel)
                  }
                >
                  <SelectTrigger id="sharingModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARING_MODEL_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls default access for records of this object type
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Appearance */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex items-center justify-center p-6 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: `${data.color}20` }}
                  >
                    <SelectedIcon
                      className="h-8 w-8"
                      style={{ color: data.color }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{data.label || 'Object Name'}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.pluralLabel || 'Object Names'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-3">
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(option => {
                    const Icon = option.icon
                    const isSelected = data.iconName === option.name

                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => updateData('iconName', option.name)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent hover:border-muted-foreground/30 hover:bg-muted/50'
                        )}
                        title={option.label}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: isSelected ? data.color : undefined }}
                        />
                        <span className="text-xs text-muted-foreground truncate w-full text-center">
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.iconName && (
                  <p className="text-sm text-destructive">{errors.iconName}</p>
                )}
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map(option => {
                    const isSelected = data.color === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateData('color', option.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors',
                          isSelected
                            ? 'border-foreground'
                            : 'border-transparent hover:border-muted-foreground/30'
                        )}
                        title={option.name}
                      >
                        <div
                          className="h-8 w-8 rounded-full"
                          style={{ backgroundColor: option.value }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {option.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.color && (
                  <p className="text-sm text-destructive">{errors.color}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Fields */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Custom Fields</h3>
                  <p className="text-sm text-muted-foreground">
                    Add fields to capture data for this object. You can add more
                    fields later.
                  </p>
                </div>
                {!showFieldForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                )}
              </div>

              {/* Field Form */}
              {showFieldForm && editingField && (
                <FieldForm
                  field={editingField}
                  onSave={saveField}
                  onCancel={() => {
                    setEditingField(null)
                    setShowFieldForm(false)
                  }}
                />
              )}

              {/* Field List */}
              {!showFieldForm && data.fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                  <Database className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No custom fields added yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A &quot;Name&quot; field will be created automatically
                  </p>
                </div>
              )}

              {!showFieldForm && data.fields.length > 0 && (
                <div className="space-y-2">
                  {data.fields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {FIELD_TYPES.find(t => t.value === field.dataType)
                            ?.label || field.dataType}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{field.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {field.apiName}__c
                            {field.isRequired && ' • Required'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingField(field)
                            setShowFieldForm(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Review the details below. Once created, the API name cannot be
                  changed.
                </AlertDescription>
              </Alert>

              {/* Object Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: `${data.color}20` }}
                  >
                    <SelectedIcon
                      className="h-8 w-8"
                      style={{ color: data.color }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{data.label}</p>
                    <p className="text-sm text-muted-foreground">
                      API Name: {data.apiName}__c
                    </p>
                  </div>
                </div>

                {data.description && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {data.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Features</p>
                    <div className="space-y-1">
                      {data.hasActivities && (
                        <Badge variant="secondary" className="mr-1">
                          Activities
                        </Badge>
                      )}
                      {data.hasNotes && (
                        <Badge variant="secondary" className="mr-1">
                          Notes
                        </Badge>
                      )}
                      {data.hasAttachments && (
                        <Badge variant="secondary" className="mr-1">
                          Attachments
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Sharing Model</p>
                    <p className="text-sm text-muted-foreground">
                      {
                        SHARING_MODEL_OPTIONS.find(
                          o => o.value === data.sharingModel
                        )?.label
                      }
                    </p>
                  </div>
                </div>

                {data.fields.length > 0 && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-2">
                      Custom Fields ({data.fields.length})
                    </p>
                    <div className="space-y-1">
                      {data.fields.map(field => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Badge variant="outline" className="text-xs">
                            {
                              FIELD_TYPES.find(t => t.value === field.dataType)
                                ?.label
                            }
                          </Badge>
                          <span>{field.label}</span>
                          {field.isRequired && (
                            <span className="text-destructive">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  A &quot;Name&quot; field will be created automatically as the
                  primary identifier for records.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={goToNextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Object
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// FIELD FORM COMPONENT
// =====================================================

interface FieldFormProps {
  field: WizardField
  onSave: (field: WizardField) => void
  onCancel: () => void
}

function FieldForm({ field: initialField, onSave, onCancel }: FieldFormProps) {
  const [field, setField] = useState<WizardField>(initialField)
  const [picklistInput, setPicklistInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleLabelChange = (label: string) => {
    setField(prev => ({
      ...prev,
      label,
      apiName: generateApiName(label),
    }))
    setErrors(prev => ({ ...prev, label: '', apiName: '' }))
  }

  const addPicklistValue = () => {
    const value = picklistInput.trim()
    if (!value) return
    if (field.picklistValues?.includes(value)) {
      setErrors(prev => ({ ...prev, picklist: 'Value already exists' }))
      return
    }
    setField(prev => ({
      ...prev,
      picklistValues: [...(prev.picklistValues || []), value],
    }))
    setPicklistInput('')
    setErrors(prev => ({ ...prev, picklist: '' }))
  }

  const removePicklistValue = (value: string) => {
    setField(prev => ({
      ...prev,
      picklistValues: prev.picklistValues?.filter(v => v !== value) || [],
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!field.label.trim()) {
      newErrors.label = 'Label is required'
    }
    if (!field.apiName.trim()) {
      newErrors.apiName = 'API name is required'
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.apiName)) {
      newErrors.apiName =
        'API name must start with a letter and contain only letters, numbers, and underscores'
    }
    if (
      field.dataType === 'picklist' &&
      (!field.picklistValues || field.picklistValues.length === 0)
    ) {
      newErrors.picklist = 'At least one picklist value is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      onSave(field)
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">
          {initialField.label ? 'Edit Field' : 'Add Field'}
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldLabel">
            Field Label <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fieldLabel"
            placeholder="e.g., Start Date"
            value={field.label}
            onChange={e => handleLabelChange(e.target.value)}
            className={errors.label ? 'border-destructive' : ''}
          />
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldApiName">
            API Name <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="fieldApiName"
              placeholder="e.g., start_date"
              value={field.apiName}
              onChange={e =>
                setField(prev => ({
                  ...prev,
                  apiName: e.target.value.toLowerCase(),
                }))
              }
              className={cn(
                'flex-1',
                errors.apiName ? 'border-destructive' : ''
              )}
            />
            <Badge variant="secondary" className="shrink-0">
              __c
            </Badge>
          </div>
          {errors.apiName && (
            <p className="text-sm text-destructive">{errors.apiName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldType">Field Type</Label>
        <Select
          value={field.dataType}
          onValueChange={value =>
            setField(prev => ({ ...prev, dataType: value as FieldDataType }))
          }
        >
          <SelectTrigger id="fieldType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span>{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Picklist Values */}
      {field.dataType === 'picklist' && (
        <div className="space-y-2">
          <Label>Picklist Values</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter a value and press Add"
              value={picklistInput}
              onChange={e => setPicklistInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPicklistValue()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPicklistValue}
            >
              Add
            </Button>
          </div>
          {errors.picklist && (
            <p className="text-sm text-destructive">{errors.picklist}</p>
          )}
          {field.picklistValues && field.picklistValues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {field.picklistValues.map(value => (
                <Badge key={value} variant="secondary" className="gap-1">
                  {value}
                  <button
                    type="button"
                    onClick={() => removePicklistValue(value)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fieldDescription">Description</Label>
        <Input
          id="fieldDescription"
          placeholder="Optional description..."
          value={field.description || ''}
          onChange={e =>
            setField(prev => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="fieldRequired"
          checked={field.isRequired}
          onCheckedChange={checked =>
            setField(prev => ({ ...prev, isRequired: !!checked }))
          }
        />
        <Label htmlFor="fieldRequired" className="cursor-pointer">
          Required field
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          {initialField.label ? 'Update Field' : 'Add Field'}
        </Button>
      </div>
    </div>
  )
}
