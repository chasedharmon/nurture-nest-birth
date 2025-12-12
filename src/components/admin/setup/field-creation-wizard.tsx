'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  Link2,
  Mail,
  Phone,
  Globe,
  AlignLeft,
  DollarSign,
  Percent,
  Calculator,
  Binary,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { createFieldDefinition } from '@/app/actions/field-definitions'
import { createPicklistValue } from '@/app/actions/field-definitions'
import type {
  FieldDataType,
  ObjectDefinition,
  FieldTypeConfig,
  TextFieldConfig,
  NumberFieldConfig,
  CurrencyFieldConfig,
  PicklistFieldConfig,
  LookupFieldConfig,
} from '@/lib/crm/types'

interface FieldCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectDefinition: ObjectDefinition
  existingFields: { api_name: string }[]
  relatedObjects?: { id: string; api_name: string; label: string }[]
}

type WizardStep = 'type' | 'details' | 'options' | 'review'

interface FieldTypeOption {
  value: FieldDataType
  label: string
  description: string
  icon: React.ReactNode
  category: 'text' | 'number' | 'date' | 'choice' | 'relationship' | 'special'
}

const fieldTypeOptions: FieldTypeOption[] = [
  {
    value: 'text',
    label: 'Text',
    description: 'Single line of text up to 255 characters',
    icon: <Type className="h-5 w-5" />,
    category: 'text',
  },
  {
    value: 'textarea',
    label: 'Text Area',
    description: 'Multi-line text for longer content',
    icon: <AlignLeft className="h-5 w-5" />,
    category: 'text',
  },
  {
    value: 'email',
    label: 'Email',
    description: 'Email address with validation',
    icon: <Mail className="h-5 w-5" />,
    category: 'text',
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Phone number with formatting',
    icon: <Phone className="h-5 w-5" />,
    category: 'text',
  },
  {
    value: 'url',
    label: 'URL',
    description: 'Web address with link support',
    icon: <Globe className="h-5 w-5" />,
    category: 'text',
  },
  {
    value: 'number',
    label: 'Number',
    description: 'Numeric values with precision',
    icon: <Hash className="h-5 w-5" />,
    category: 'number',
  },
  {
    value: 'currency',
    label: 'Currency',
    description: 'Money amounts with currency symbol',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'number',
  },
  {
    value: 'percent',
    label: 'Percent',
    description: 'Percentage values',
    icon: <Percent className="h-5 w-5" />,
    category: 'number',
  },
  {
    value: 'date',
    label: 'Date',
    description: 'Date without time',
    icon: <Calendar className="h-5 w-5" />,
    category: 'date',
  },
  {
    value: 'datetime',
    label: 'Date/Time',
    description: 'Date with time of day',
    icon: <Calendar className="h-5 w-5" />,
    category: 'date',
  },
  {
    value: 'checkbox',
    label: 'Checkbox',
    description: 'True/false toggle',
    icon: <CheckSquare className="h-5 w-5" />,
    category: 'choice',
  },
  {
    value: 'picklist',
    label: 'Picklist',
    description: 'Single selection from predefined values',
    icon: <List className="h-5 w-5" />,
    category: 'choice',
  },
  {
    value: 'multipicklist',
    label: 'Multi-Select Picklist',
    description: 'Multiple selections from predefined values',
    icon: <List className="h-5 w-5" />,
    category: 'choice',
  },
  {
    value: 'lookup',
    label: 'Lookup',
    description: 'Reference to another object',
    icon: <Link2 className="h-5 w-5" />,
    category: 'relationship',
  },
  {
    value: 'formula',
    label: 'Formula',
    description: 'Calculated value (read-only)',
    icon: <Calculator className="h-5 w-5" />,
    category: 'special',
  },
  {
    value: 'auto_number',
    label: 'Auto Number',
    description: 'Auto-incrementing number',
    icon: <Binary className="h-5 w-5" />,
    category: 'special',
  },
]

const categoryLabels: Record<string, string> = {
  text: 'Text Fields',
  number: 'Numeric Fields',
  date: 'Date & Time',
  choice: 'Selection Fields',
  relationship: 'Relationship Fields',
  special: 'Special Fields',
}

interface PicklistValueInput {
  value: string
  label: string
  isDefault: boolean
}

export function FieldCreationWizard({
  open,
  onOpenChange,
  objectDefinition,
  existingFields,
  relatedObjects = [],
}: FieldCreationWizardProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<WizardStep>('type')
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedType, setSelectedType] = useState<FieldDataType | null>(null)
  const [label, setLabel] = useState('')
  const [apiName, setApiName] = useState('')
  const [description, setDescription] = useState('')
  const [helpText, setHelpText] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [defaultValue, setDefaultValue] = useState('')

  // Type-specific options
  const [maxLength, setMaxLength] = useState(255)
  const [precision, setPrecision] = useState(18)
  const [scale, setScale] = useState(2)
  const [relatedObjectId, setRelatedObjectId] = useState('')
  const [picklistValues, setPicklistValues] = useState<PicklistValueInput[]>([
    { value: '', label: '', isDefault: false },
  ])

  const steps: WizardStep[] = ['type', 'details', 'options', 'review']
  const currentStepIndex = steps.indexOf(step)

  const resetForm = () => {
    setStep('type')
    setSelectedType(null)
    setLabel('')
    setApiName('')
    setDescription('')
    setHelpText('')
    setIsRequired(false)
    setIsUnique(false)
    setDefaultValue('')
    setMaxLength(255)
    setPrecision(18)
    setScale(2)
    setRelatedObjectId('')
    setPicklistValues([{ value: '', label: '', isDefault: false }])
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const generateApiName = (labelValue: string) => {
    return labelValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
  }

  const handleLabelChange = (value: string) => {
    setLabel(value)
    if (!apiName || apiName === generateApiName(label)) {
      setApiName(generateApiName(value))
    }
  }

  const validateApiName = (name: string): string | null => {
    if (!name) return 'API name is required'
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      return 'API name must start with a letter and contain only letters, numbers, and underscores'
    }
    const fullApiName = name.endsWith('__c') ? name : `${name}__c`
    if (existingFields.some(f => f.api_name === fullApiName)) {
      return 'A field with this API name already exists'
    }
    return null
  }

  const canProceed = (): boolean => {
    switch (step) {
      case 'type':
        return selectedType !== null
      case 'details':
        return (
          label.trim() !== '' &&
          apiName.trim() !== '' &&
          !validateApiName(apiName)
        )
      case 'options':
        if (selectedType === 'lookup' && !relatedObjectId) return false
        if (
          (selectedType === 'picklist' || selectedType === 'multipicklist') &&
          picklistValues.filter(v => v.value.trim()).length === 0
        )
          return false
        return true
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step === 'type') setStep('details')
    else if (step === 'details') setStep('options')
    else if (step === 'options') setStep('review')
  }

  const handleBack = () => {
    if (step === 'details') setStep('type')
    else if (step === 'options') setStep('details')
    else if (step === 'review') setStep('options')
  }

  const buildTypeConfig = (): FieldTypeConfig => {
    switch (selectedType) {
      case 'text':
      case 'textarea':
        return { maxLength } as TextFieldConfig
      case 'number':
        return { precision, scale } as NumberFieldConfig
      case 'currency':
        return { precision, scale, currencyCode: 'USD' } as CurrencyFieldConfig
      case 'percent':
        return { precision, scale } as NumberFieldConfig
      case 'picklist':
      case 'multipicklist':
        return { allowBlank: !isRequired } as PicklistFieldConfig
      case 'lookup':
        const relatedObj = relatedObjects.find(o => o.id === relatedObjectId)
        return {
          relatedObjectId,
          relatedObjectApiName: relatedObj?.api_name || '',
          relatedDisplayField: 'name',
        } as LookupFieldConfig
      default:
        return {}
    }
  }

  const handleCreate = async () => {
    if (!selectedType) return

    setError(null)
    startTransition(async () => {
      try {
        // Determine display_order (add at end)
        const displayOrder = existingFields.length + 1

        const result = await createFieldDefinition({
          object_definition_id: objectDefinition.id,
          organization_id: objectDefinition.organization_id,
          api_name: apiName,
          label,
          description: description || null,
          help_text: helpText || null,
          data_type: selectedType,
          type_config: buildTypeConfig(),
          column_name: null,
          is_custom_field: true,
          is_required: isRequired,
          is_unique: isUnique,
          default_value: defaultValue || null,
          is_visible: true,
          is_read_only:
            selectedType === 'formula' || selectedType === 'auto_number',
          display_order: displayOrder,
          is_audited: false,
          is_name_field: false,
          is_sensitive: false,
          is_active: true,
        })

        if (result.error) {
          setError(result.error)
          return
        }

        // Create picklist values if applicable
        if (
          result.data &&
          (selectedType === 'picklist' || selectedType === 'multipicklist')
        ) {
          const validValues = picklistValues.filter(v => v.value.trim())
          for (const [index, pv] of validValues.entries()) {
            await createPicklistValue({
              field_definition_id: result.data.id,
              value: pv.value.trim(),
              label: pv.label.trim() || pv.value.trim(),
              description: null,
              display_order: index + 1,
              is_default: pv.isDefault,
              is_active: true,
              controlling_field_id: null,
              controlling_values: null,
              color: null,
            })
          }
        }

        handleClose()
      } catch (err) {
        setError('An unexpected error occurred')
        console.error(err)
      }
    })
  }

  const addPicklistValue = () => {
    setPicklistValues([
      ...picklistValues,
      { value: '', label: '', isDefault: false },
    ])
  }

  const removePicklistValue = (index: number) => {
    setPicklistValues(picklistValues.filter((_, i) => i !== index))
  }

  const updatePicklistValue = (
    index: number,
    field: keyof PicklistValueInput,
    value: string | boolean
  ) => {
    setPicklistValues(
      picklistValues.map((pv, i) => {
        if (i === index) {
          return { ...pv, [field]: value }
        }
        // If setting a new default, unset others
        if (field === 'isDefault' && value === true) {
          return { ...pv, isDefault: false }
        }
        return pv
      })
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i < currentStepIndex
                ? 'bg-primary text-primary-foreground'
                : i === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-8 ${
                i < currentStepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderTypeStep = () => {
    const categories = [
      'text',
      'number',
      'date',
      'choice',
      'relationship',
      'special',
    ]

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the type of data this field will store.
        </p>
        {categories.map(category => {
          const categoryOptions = fieldTypeOptions.filter(
            o => o.category === category
          )
          if (categoryOptions.length === 0) return null

          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {categoryLabels[category]}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedType(option.value)}
                    className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                      selectedType === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`rounded-md p-1.5 ${
                        selectedType === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDetailsStep = () => {
    const apiNameError = apiName ? validateApiName(apiName) : null

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">
            Field Label <span className="text-destructive">*</span>
          </Label>
          <Input
            id="label"
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="e.g., Emergency Contact"
          />
          <p className="text-xs text-muted-foreground">
            The label shown to users in forms and reports
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiName">
            API Name <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="apiName"
              value={apiName}
              onChange={e => setApiName(e.target.value)}
              placeholder="e.g., emergency_contact"
              className="font-mono text-sm"
            />
            <Badge variant="secondary" className="shrink-0">
              __c
            </Badge>
          </div>
          {apiNameError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {apiNameError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Used for integrations and formulas. Cannot be changed after
            creation.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the purpose of this field"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="helpText">Help Text</Label>
          <Input
            id="helpText"
            value={helpText}
            onChange={e => setHelpText(e.target.value)}
            placeholder="Displayed as a tooltip when hovering over the field"
          />
        </div>
      </div>
    )
  }

  const renderOptionsStep = () => {
    return (
      <div className="space-y-6">
        {/* Common options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Field Behavior</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Required</Label>
              <p className="text-xs text-muted-foreground">
                Users must fill in this field
              </p>
            </div>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {(selectedType === 'text' ||
            selectedType === 'email' ||
            selectedType === 'phone') && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Unique</Label>
                <p className="text-xs text-muted-foreground">
                  No two records can have the same value
                </p>
              </div>
              <Switch checked={isUnique} onCheckedChange={setIsUnique} />
            </div>
          )}
        </div>

        {/* Type-specific options */}
        {(selectedType === 'text' || selectedType === 'textarea') && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Text Options</h4>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Maximum Length</Label>
              <Input
                id="maxLength"
                type="number"
                value={maxLength}
                onChange={e => setMaxLength(parseInt(e.target.value) || 255)}
                min={1}
                max={selectedType === 'textarea' ? 32000 : 255}
              />
            </div>
          </div>
        )}

        {(selectedType === 'number' ||
          selectedType === 'currency' ||
          selectedType === 'percent') && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Number Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precision">Precision (total digits)</Label>
                <Input
                  id="precision"
                  type="number"
                  value={precision}
                  onChange={e => setPrecision(parseInt(e.target.value) || 18)}
                  min={1}
                  max={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scale">Scale (decimal places)</Label>
                <Input
                  id="scale"
                  type="number"
                  value={scale}
                  onChange={e => setScale(parseInt(e.target.value) || 0)}
                  min={0}
                  max={precision}
                />
              </div>
            </div>
          </div>
        )}

        {selectedType === 'lookup' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Lookup Options</h4>
            <div className="space-y-2">
              <Label>
                Related Object <span className="text-destructive">*</span>
              </Label>
              <Select
                value={relatedObjectId}
                onValueChange={setRelatedObjectId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an object" />
                </SelectTrigger>
                <SelectContent>
                  {relatedObjects.map(obj => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The object this field will reference
              </p>
            </div>
          </div>
        )}

        {(selectedType === 'picklist' || selectedType === 'multipicklist') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Picklist Values <span className="text-destructive">*</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPicklistValue}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Value
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {picklistValues.map((pv, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={pv.value}
                    onChange={e =>
                      updatePicklistValue(index, 'value', e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Input
                    value={pv.label}
                    onChange={e =>
                      updatePicklistValue(index, 'label', e.target.value)
                    }
                    placeholder="Label (optional)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={pv.isDefault ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updatePicklistValue(index, 'isDefault', !pv.isDefault)
                    }
                    title="Set as default"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePicklistValue(index)}
                    disabled={picklistValues.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the values users can select from. Click the checkmark to set
              a default.
            </p>
          </div>
        )}

        {/* Default value for simple types */}
        {(selectedType === 'text' ||
          selectedType === 'number' ||
          selectedType === 'email' ||
          selectedType === 'phone' ||
          selectedType === 'url') && (
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            <Input
              id="defaultValue"
              type={selectedType === 'number' ? 'number' : 'text'}
              value={defaultValue}
              onChange={e => setDefaultValue(e.target.value)}
              placeholder="Optional default value"
            />
          </div>
        )}
      </div>
    )
  }

  const renderReviewStep = () => {
    const selectedTypeInfo = fieldTypeOptions.find(
      o => o.value === selectedType
    )
    const relatedObj = relatedObjects.find(o => o.id === relatedObjectId)
    const validPicklistValues = picklistValues.filter(v => v.value.trim())

    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              {selectedTypeInfo?.icon}
            </div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {apiName}__c
              </p>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span>{selectedTypeInfo?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Object</span>
              <span>{objectDefinition.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Required</span>
              <span>{isRequired ? 'Yes' : 'No'}</span>
            </div>
            {isUnique && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unique</span>
                <span>Yes</span>
              </div>
            )}
            {description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right max-w-[200px] truncate">
                  {description}
                </span>
              </div>
            )}
            {selectedType === 'lookup' && relatedObj && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Related To</span>
                <span>{relatedObj.label}</span>
              </div>
            )}
            {(selectedType === 'picklist' ||
              selectedType === 'multipicklist') &&
              validPicklistValues.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Values</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {validPicklistValues.map((pv, i) => (
                      <Badge
                        key={i}
                        variant={pv.isDefault ? 'default' : 'secondary'}
                      >
                        {pv.label || pv.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    )
  }

  const stepTitles: Record<WizardStep, string> = {
    type: 'Choose Field Type',
    details: 'Field Details',
    options: 'Configure Options',
    review: 'Review & Create',
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription>
            Adding a custom field to {objectDefinition.label}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[300px]">
          {step === 'type' && renderTypeStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'options' && renderOptionsStep()}
          {step === 'review' && renderReviewStep()}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={step === 'type' ? handleClose : handleBack}
          >
            {step === 'type' ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {step === 'review' ? (
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Field
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
