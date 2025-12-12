'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Save,
  Loader2,
  AlertCircle,
  EyeOff,
} from 'lucide-react'
import type {
  FieldDefinition,
  PageLayout,
  PageLayoutSection,
  PageLayoutConfig,
} from '@/lib/crm/types'

interface PageLayoutEditorProps {
  layout: PageLayout | null
  fields: FieldDefinition[]
  onSave?: (config: PageLayoutConfig) => Promise<void>
}

interface SectionEditorProps {
  section: PageLayoutSection
  fields: FieldDefinition[]
  allSectionFields: Set<string>
  onUpdate: (section: PageLayoutSection) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

function SectionEditor({
  section,
  fields,
  allSectionFields,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFieldPicker, setShowFieldPicker] = useState(false)

  const sectionFields = section.fields
    .map(apiName => fields.find(f => f.api_name === apiName))
    .filter((f): f is FieldDefinition => f !== undefined)

  const unassignedFields = fields.filter(f => !allSectionFields.has(f.api_name))

  const handleAddField = (apiName: string) => {
    onUpdate({
      ...section,
      fields: [...section.fields, apiName],
    })
    setShowFieldPicker(false)
  }

  const handleRemoveField = (apiName: string) => {
    onUpdate({
      ...section,
      fields: section.fields.filter(f => f !== apiName),
    })
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...section.fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFields.length) return
    const temp = newFields[index]
    const targetItem = newFields[targetIndex]
    if (temp !== undefined && targetItem !== undefined) {
      newFields[index] = targetItem
      newFields[targetIndex] = temp
    }
    onUpdate({ ...section, fields: newFields })
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <Input
              value={section.name}
              onChange={e => onUpdate({ ...section, name: e.target.value })}
              className="h-8 w-48 font-medium"
              placeholder="Section name"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={isFirst}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={isLast}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Columns:</Label>
            <Select
              value={String(section.columns)}
              onValueChange={v =>
                onUpdate({ ...section, columns: parseInt(v) as 1 | 2 })
              }
            >
              <SelectTrigger className="h-7 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              Collapsed by default:
            </Label>
            <Switch
              checked={section.collapsed}
              onCheckedChange={collapsed => onUpdate({ ...section, collapsed })}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div
            className={`grid gap-2 ${
              section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {sectionFields.map((field, index) => (
              <div
                key={field.api_name}
                className="flex items-center gap-2 rounded-md border bg-background p-2"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{field.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {field.api_name}
                  </p>
                </div>
                {field.is_required && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    Required
                  </Badge>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveField(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveField(index, 'down')}
                    disabled={index === sectionFields.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveField(field.api_name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => setShowFieldPicker(true)}
            disabled={unassignedFields.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>

          {/* Field Picker Dialog */}
          <Dialog open={showFieldPicker} onOpenChange={setShowFieldPicker}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Field to Section</DialogTitle>
                <DialogDescription>
                  Select a field to add to this section.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {unassignedFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All fields have been assigned to sections.
                  </p>
                ) : (
                  unassignedFields.map(field => (
                    <button
                      key={field.api_name}
                      onClick={() => handleAddField(field.api_name)}
                      className="w-full flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{field.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {field.api_name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {field.data_type}
                      </Badge>
                      {field.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  )
}

export function PageLayoutEditor({
  layout,
  fields,
  onSave,
}: PageLayoutEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize sections from layout or create default
  const [sections, setSections] = useState<PageLayoutSection[]>(() => {
    if (layout?.layout_config?.sections?.length) {
      return layout.layout_config.sections
    }
    // Default section with all visible fields
    const visibleFields = fields.filter(f => f.is_visible)
    return [
      {
        id: 'main',
        name: 'Information',
        columns: 2,
        collapsed: false,
        fields: visibleFields.map(f => f.api_name),
      },
    ]
  })

  // Track which fields are assigned to sections
  const allSectionFields = new Set(sections.flatMap(s => s.fields))
  const unassignedFields = fields.filter(f => !allSectionFields.has(f.api_name))

  const updateSections = useCallback((newSections: PageLayoutSection[]) => {
    setSections(newSections)
    setHasChanges(true)
  }, [])

  const handleAddSection = () => {
    const newSection: PageLayoutSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      columns: 2,
      collapsed: false,
      fields: [],
    }
    updateSections([...sections, newSection])
  }

  const handleUpdateSection = (index: number, section: PageLayoutSection) => {
    const newSections = [...sections]
    newSections[index] = section
    updateSections(newSections)
  }

  const handleDeleteSection = (index: number) => {
    updateSections(sections.filter((_, i) => i !== index))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    const temp = newSections[index]
    const targetItem = newSections[targetIndex]
    if (temp !== undefined && targetItem !== undefined) {
      newSections[index] = targetItem
      newSections[targetIndex] = temp
    }
    updateSections(newSections)
  }

  const handleSave = async () => {
    setError(null)

    // Validate: all required fields must be in a section
    const requiredFields = fields.filter(f => f.is_required)
    const missingRequired = requiredFields.filter(
      f => !allSectionFields.has(f.api_name)
    )

    if (missingRequired.length > 0) {
      setError(
        `Required fields must be assigned to a section: ${missingRequired.map(f => f.label).join(', ')}`
      )
      return
    }

    if (!onSave) return

    startTransition(async () => {
      try {
        await onSave({
          sections,
          related_lists: layout?.layout_config?.related_lists || [],
          sidebar_components: layout?.layout_config?.sidebar_components || [],
        })
        setHasChanges(false)
      } catch (err) {
        setError('Failed to save layout')
        console.error(err)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Save */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Layout Sections</h3>
          <p className="text-sm text-muted-foreground">
            Organize fields into sections. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            fields={fields}
            allSectionFields={allSectionFields}
            onUpdate={s => handleUpdateSection(index, s)}
            onDelete={() => handleDeleteSection(index)}
            onMoveUp={() => handleMoveSection(index, 'up')}
            onMoveDown={() => handleMoveSection(index, 'down')}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
          />
        ))}
      </div>

      {/* Add Section Button */}
      <Button variant="outline" onClick={handleAddSection} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Unassigned Fields Warning */}
      {unassignedFields.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Unassigned Fields ({unassignedFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-700 dark:text-amber-400 mb-2">
              These fields won&apos;t appear on the record form unless added to
              a section.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {unassignedFields.map(field => (
                <Badge
                  key={field.api_name}
                  variant={field.is_required ? 'destructive' : 'secondary'}
                >
                  {field.label}
                  {field.is_required && ' *'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Layout Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Use 2 columns for forms with many fields</li>
            <li>Group related fields in the same section</li>
            <li>Put most important fields at the top</li>
            <li>
              Mark sections as &quot;collapsed by default&quot; for less
              frequently used fields
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
