'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Wand2, Save, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  FIELD_DEFINITIONS,
  autoMapColumns,
  getMissingRequiredFields,
} from '@/lib/import/field-definitions'
import type {
  ImportObjectType,
  ParsedFile,
  MappingTemplate,
} from '@/lib/import/types'

interface ColumnMappingStepProps {
  parsedFile: ParsedFile
  objectType: ImportObjectType
  mapping: Record<string, string | null>
  onMappingChange: (mapping: Record<string, string | null>) => void
  savedTemplates: MappingTemplate[]
  onSaveTemplate: (name: string) => void
  onLoadTemplate: (template: MappingTemplate) => void
}

export function ColumnMappingStep({
  parsedFile,
  objectType,
  mapping,
  onMappingChange,
  savedTemplates,
  onSaveTemplate,
  onLoadTemplate,
}: ColumnMappingStepProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const fieldDefs = FIELD_DEFINITIONS[objectType]
  const missingRequired = getMissingRequiredFields(mapping, objectType)
  const mappedFields = new Set(Object.values(mapping).filter(Boolean))

  // Auto-map on initial load
  useEffect(() => {
    if (Object.values(mapping).every(v => v === null)) {
      const autoMapping = autoMapColumns(parsedFile.headers, objectType)
      onMappingChange(autoMapping)
    }
  }, [parsedFile.headers, objectType, mapping, onMappingChange])

  const handleAutoMap = () => {
    const autoMapping = autoMapColumns(parsedFile.headers, objectType)
    onMappingChange(autoMapping)
  }

  const handleMappingChange = (
    sourceColumn: string,
    targetField: string | null
  ) => {
    onMappingChange({
      ...mapping,
      [sourceColumn]: targetField === 'none' ? null : targetField,
    })
  }

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      onSaveTemplate(templateName.trim())
      setTemplateName('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Map Your Columns</h2>
          <p className="text-sm text-muted-foreground">
            Match your file columns to the fields in the system. Required fields
            are marked with a red asterisk.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoMap}>
            <Wand2 className="mr-1 h-4 w-4" />
            Auto-Map
          </Button>

          {savedTemplates.length > 0 && (
            <Select
              onValueChange={templateId => {
                const template = savedTemplates.find(t => t.id === templateId)
                if (template) onLoadTemplate(template)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Load template..." />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Warning if required fields missing */}
      {missingRequired.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 p-4 dark:bg-yellow-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Missing Required Fields
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please map the following required fields:{' '}
                {missingRequired.map(f => f.label).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mapping Table */}
      <Card>
        <div className="divide-y">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 bg-muted/50 p-4 font-medium">
            <div className="col-span-5">Your Column</div>
            <div className="col-span-1 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="col-span-4">Maps To</div>
            <div className="col-span-2">Sample Data</div>
          </div>

          {/* Mapping Rows */}
          {parsedFile.headers.map(header => {
            const currentMapping = mapping[header]
            const sampleValue = parsedFile.previewRows[0]?.[header] || ''

            return (
              <div
                key={header}
                className="grid grid-cols-12 items-center gap-4 p-4"
              >
                <div className="col-span-5">
                  <span className="font-medium">{header}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="col-span-4">
                  <Select
                    value={currentMapping || 'none'}
                    onValueChange={value => handleMappingChange(header, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Do not import --</SelectItem>
                      {fieldDefs.map(field => (
                        <SelectItem
                          key={field.field}
                          value={field.field}
                          disabled={
                            mappedFields.has(field.field) &&
                            currentMapping !== field.field
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span>{field.label}</span>
                            {field.required && (
                              <span className="text-destructive">*</span>
                            )}
                            {mappedFields.has(field.field) &&
                              currentMapping !== field.field && (
                                <Badge variant="secondary" className="text-xs">
                                  Mapped
                                </Badge>
                              )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 truncate text-sm text-muted-foreground">
                  {sampleValue || <span className="italic">Empty</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Save Template Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Save this mapping for future imports?</p>
            <p className="text-sm text-muted-foreground">
              Templates make it easy to import data from the same source again.
            </p>
          </div>
          {showSaveDialog ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Template name..."
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
              />
              <Button size="sm" onClick={handleSaveTemplate}>
                <Check className="mr-1 h-4 w-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="mr-1 h-4 w-4" />
              Save Template
            </Button>
          )}
        </div>
      </Card>

      {/* Field Legend */}
      <div className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> = Required field
      </div>
    </div>
  )
}
