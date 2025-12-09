'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createIntakeFormTemplate,
  updateIntakeFormTemplate,
  type IntakeFormTemplate,
  type IntakeFormField,
  type IntakeFormSchema,
} from '@/app/actions/setup'
import {
  Plus,
  Loader2,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Upload,
  Hash,
  Mail,
  Phone,
  Eye,
  Settings,
} from 'lucide-react'
import type { ServiceType } from '@/lib/supabase/types'

// Validation schema for the form metadata
const formMetadataSchema = z.object({
  name: z
    .string()
    .min(1, 'Form name is required')
    .min(2, 'Form name must be at least 2 characters')
    .max(100, 'Form name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  service_type: z.string().optional(),
  is_active: z.boolean(),
})

type FormMetadata = z.infer<typeof formMetadataSchema>

interface IntakeFormBuilderDialogProps {
  template?: IntakeFormTemplate
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const FIELD_TYPES: {
  value: IntakeFormField['type']
  label: string
  icon: React.ElementType
  description: string
}[] = [
  {
    value: 'text',
    label: 'Short Text',
    icon: Type,
    description: 'Single line text input',
  },
  {
    value: 'textarea',
    label: 'Long Text',
    icon: AlignLeft,
    description: 'Multi-line text input',
  },
  {
    value: 'select',
    label: 'Dropdown',
    icon: List,
    description: 'Select from a list',
  },
  {
    value: 'checkbox',
    label: 'Checkboxes',
    icon: CheckSquare,
    description: 'Multiple choice selection',
  },
  {
    value: 'radio',
    label: 'Radio Buttons',
    icon: Circle,
    description: 'Single choice selection',
  },
  {
    value: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date picker',
  },
  {
    value: 'file',
    label: 'File Upload',
    icon: Upload,
    description: 'File attachment',
  },
  {
    value: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input',
  },
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email address input',
  },
  {
    value: 'phone',
    label: 'Phone',
    icon: Phone,
    description: 'Phone number input',
  },
]

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'lactation_consulting', label: 'Lactation Consulting' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'other', label: 'Other' },
]

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

const DEFAULT_FIELD_TYPE = {
  value: 'text' as IntakeFormField['type'],
  label: 'Short Text',
  icon: Type,
  description: 'Single line text input',
}

function getFieldTypeInfo(
  type: IntakeFormField['type']
): (typeof FIELD_TYPES)[number] {
  const found = FIELD_TYPES.find(t => t.value === type)
  return found ?? DEFAULT_FIELD_TYPE
}

export function IntakeFormBuilderDialog({
  template,
  trigger,
  onSuccess,
}: IntakeFormBuilderDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<IntakeFormField[]>(() => {
    if (template?.schema && typeof template.schema === 'object') {
      const schema = template.schema as unknown as IntakeFormSchema
      return Array.isArray(schema.fields) ? schema.fields : []
    }
    return []
  })
  const [activeTab, setActiveTab] = useState<'fields' | 'preview'>('fields')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const isEditing = !!template

  const form = useForm<FormMetadata>({
    resolver: zodResolver(formMetadataSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      service_type: template?.service_type || '',
      is_active: template?.is_active ?? true,
    },
  })

  const handleAddField = (type: IntakeFormField['type']) => {
    const fieldTypeInfo = getFieldTypeInfo(type)
    const newField: IntakeFormField = {
      id: generateFieldId(),
      type,
      label: `New ${fieldTypeInfo.label} Field`,
      required: false,
      options:
        type === 'select' || type === 'checkbox' || type === 'radio'
          ? ['Option 1', 'Option 2']
          : undefined,
    }
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const handleUpdateField = useCallback(
    (fieldId: string, updates: Partial<IntakeFormField>) => {
      setFields(prev =>
        prev.map(f => (f.id === fieldId ? { ...f, ...updates } : f))
      )
    },
    []
  )

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === fieldId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === fields.length - 1) return

    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const currentField = newFields[index]
    const targetField = newFields[targetIndex]
    if (currentField && targetField) {
      newFields[index] = targetField
      newFields[targetIndex] = currentField
      setFields(newFields)
    }
  }

  const handleAddOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.options) return
    handleUpdateField(fieldId, {
      options: [...field.options, `Option ${field.options.length + 1}`],
    })
  }

  const handleUpdateOption = (
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.options) return
    const newOptions = [...field.options]
    newOptions[optionIndex] = value
    handleUpdateField(fieldId, { options: newOptions })
  }

  const handleDeleteOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.options || field.options.length <= 1) return
    handleUpdateField(fieldId, {
      options: field.options.filter((_, i) => i !== optionIndex),
    })
  }

  const onSubmit = async (data: FormMetadata) => {
    if (fields.length === 0) {
      setError('Please add at least one field to the form')
      return
    }

    setError(null)

    try {
      const schema: IntakeFormSchema = {
        fields,
        version: 1,
      }

      if (isEditing && template) {
        const result = await updateIntakeFormTemplate(template.id, {
          name: data.name,
          description: data.description || null,
          service_type: data.service_type || null,
          schema,
          is_active: data.is_active,
        })

        if (result.success) {
          setOpen(false)
          router.refresh()
          onSuccess?.()
        } else {
          setError(result.error || 'Failed to update form')
        }
      } else {
        const result = await createIntakeFormTemplate({
          name: data.name,
          description: data.description || null,
          service_type: data.service_type || null,
          schema,
          is_active: data.is_active,
        })

        if (result.success) {
          setOpen(false)
          form.reset()
          setFields([])
          setSelectedFieldId(null)
          router.refresh()
          onSuccess?.()
        } else {
          setError(result.error || 'Failed to create form')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      form.reset()
      if (!isEditing) {
        setFields([])
      }
      setSelectedFieldId(null)
      setError(null)
      setActiveTab('fields')
    }
  }

  const renderFieldPreview = (field: IntakeFormField) => {
    const fieldInfo = getFieldTypeInfo(field.type)
    const TypeIcon = fieldInfo.icon

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            disabled
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || '0'}
            disabled
          />
        )
      case 'textarea':
        return (
          <Textarea
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            rows={3}
            disabled
          />
        )
      case 'date':
        return <Input type="date" disabled />
      case 'file':
        return (
          <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-6 w-6" />
            Click or drag to upload
          </div>
        )
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
          </Select>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled className="rounded" />
                {option}
              </label>
            ))}
          </div>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="radio" disabled name={field.id} />
                {option}
              </label>
            ))}
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TypeIcon className="h-4 w-4" />
            {fieldInfo.label}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {isEditing ? 'Edit Form' : 'New Form'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Intake Form' : 'Create Intake Form'}
          </DialogTitle>
          <DialogDescription>
            Build a custom intake form with drag-and-drop fields.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Form Metadata */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Birth Preferences Form"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All services" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Services</SelectItem>
                        {SERVICE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this form collects..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs
              value={activeTab}
              onValueChange={v => setActiveTab(v as 'fields' | 'preview')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fields" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Build Fields
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Field Types Panel */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="mb-3 font-medium">Add Field</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {FIELD_TYPES.map(fieldType => {
                        const Icon = fieldType.icon
                        return (
                          <button
                            key={fieldType.value}
                            type="button"
                            onClick={() => handleAddField(fieldType.value)}
                            className="flex items-center gap-2 rounded-lg border bg-background p-2 text-left text-sm transition-colors hover:bg-muted"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{fieldType.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Fields List */}
                  <div className="lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium">Form Fields</h4>
                      <Badge variant="secondary">{fields.length} fields</Badge>
                    </div>

                    {fields.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                        <p>No fields yet.</p>
                        <p className="text-sm">
                          Click a field type on the left to add it.
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <Accordion
                          type="single"
                          collapsible
                          value={selectedFieldId || undefined}
                          onValueChange={setSelectedFieldId}
                          className="space-y-2"
                        >
                          {fields.map((field, index) => {
                            const fieldTypeInfo = getFieldTypeInfo(field.type)
                            const TypeIcon = fieldTypeInfo.icon
                            return (
                              <AccordionItem
                                key={field.id}
                                value={field.id}
                                className="rounded-lg border bg-background"
                              >
                                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                  <div className="flex flex-1 items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 text-left text-sm font-medium">
                                      {field.label}
                                    </span>
                                    {field.required && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-3">
                                    {/* Field Label */}
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Label
                                      </label>
                                      <Input
                                        value={field.label}
                                        onChange={e =>
                                          handleUpdateField(field.id, {
                                            label: e.target.value,
                                          })
                                        }
                                        className="mt-1"
                                      />
                                    </div>

                                    {/* Placeholder (for text inputs) */}
                                    {[
                                      'text',
                                      'textarea',
                                      'email',
                                      'phone',
                                      'number',
                                    ].includes(field.type) && (
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Placeholder
                                        </label>
                                        <Input
                                          value={field.placeholder || ''}
                                          onChange={e =>
                                            handleUpdateField(field.id, {
                                              placeholder: e.target.value,
                                            })
                                          }
                                          placeholder="Enter placeholder text"
                                          className="mt-1"
                                        />
                                      </div>
                                    )}

                                    {/* Help Text */}
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Help Text
                                      </label>
                                      <Input
                                        value={field.helpText || ''}
                                        onChange={e =>
                                          handleUpdateField(field.id, {
                                            helpText: e.target.value,
                                          })
                                        }
                                        placeholder="Additional instructions"
                                        className="mt-1"
                                      />
                                    </div>

                                    {/* Options (for select, checkbox, radio) */}
                                    {field.options && (
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Options
                                        </label>
                                        <div className="mt-1 space-y-1">
                                          {field.options.map(
                                            (option, optIndex) => (
                                              <div
                                                key={optIndex}
                                                className="flex items-center gap-2"
                                              >
                                                <Input
                                                  value={option}
                                                  onChange={e =>
                                                    handleUpdateOption(
                                                      field.id,
                                                      optIndex,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="flex-1"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleDeleteOption(
                                                      field.id,
                                                      optIndex
                                                    )
                                                  }
                                                  disabled={
                                                    field.options!.length <= 1
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )
                                          )}
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleAddOption(field.id)
                                            }
                                          >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add Option
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Required Toggle */}
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Required Field
                                      </label>
                                      <Switch
                                        checked={field.required}
                                        onCheckedChange={checked =>
                                          handleUpdateField(field.id, {
                                            required: checked,
                                          })
                                        }
                                      />
                                    </div>

                                    {/* Field Actions */}
                                    <div className="flex items-center justify-between border-t pt-3">
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleMoveField(field.id, 'up')
                                          }
                                          disabled={index === 0}
                                        >
                                          <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleMoveField(field.id, 'down')
                                          }
                                          disabled={index === fields.length - 1}
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteField(field.id)
                                        }
                                      >
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="rounded-lg border bg-background p-6">
                  <h3 className="mb-6 text-lg font-semibold">
                    {form.watch('name') || 'Untitled Form'}
                  </h3>
                  {form.watch('description') && (
                    <p className="mb-6 text-sm text-muted-foreground">
                      {form.watch('description')}
                    </p>
                  )}

                  {fields.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No fields to preview. Add some fields in the Build tab.
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-6 pr-4">
                        {fields.map(field => (
                          <div key={field.id}>
                            <label className="mb-2 block text-sm font-medium">
                              {field.label}
                              {field.required && (
                                <span className="ml-1 text-destructive">*</span>
                              )}
                            </label>
                            {renderFieldPreview(field)}
                            {field.helpText && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {field.helpText}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Active Toggle */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Form is available for use</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Save Changes' : 'Create Form'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
