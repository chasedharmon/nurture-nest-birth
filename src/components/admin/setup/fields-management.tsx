'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Lock, Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { FieldCreationWizard } from './field-creation-wizard'
import type { FieldDefinition, ObjectDefinition } from '@/lib/crm/types'

interface FieldsManagementProps {
  fields: FieldDefinition[]
  objectDefinition: ObjectDefinition
  relatedObjects: { id: string; api_name: string; label: string }[]
}

const fieldTypeLabels: Record<string, string> = {
  text: 'Text',
  textarea: 'Text Area',
  rich_text: 'Rich Text',
  number: 'Number',
  currency: 'Currency',
  percent: 'Percent',
  date: 'Date',
  datetime: 'Date/Time',
  checkbox: 'Checkbox',
  picklist: 'Picklist',
  multipicklist: 'Multi-Select Picklist',
  lookup: 'Lookup',
  master_detail: 'Master-Detail',
  email: 'Email',
  phone: 'Phone',
  url: 'URL',
  formula: 'Formula',
  auto_number: 'Auto Number',
}

export function FieldsManagement({
  fields,
  objectDefinition,
  relatedObjects,
}: FieldsManagementProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  const standardFields = fields.filter(f => f.is_standard)
  const customFields = fields.filter(f => f.is_custom_field)

  return (
    <div className="space-y-6">
      {/* Standard Fields */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="h-4 w-4" />
          Standard Fields ({standardFields.length})
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>API Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Required</TableHead>
                <TableHead className="text-center">Visible</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standardFields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No standard fields defined
                  </TableCell>
                </TableRow>
              ) : (
                standardFields.map(field => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {field.label}
                        {field.is_name_field && (
                          <Badge variant="outline" className="text-xs">
                            Name
                          </Badge>
                        )}
                      </div>
                      {field.help_text && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {field.help_text}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {field.api_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {fieldTypeLabels[field.data_type] || field.data_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {field.is_required ? (
                        <Badge variant="destructive" className="text-xs">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {field.is_visible ? (
                        <Eye className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" disabled>
                        <Lock className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Custom Fields */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Pencil className="h-4 w-4" />
            Custom Fields ({customFields.length})
          </h3>
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>API Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Required</TableHead>
                <TableHead className="text-center">Visible</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customFields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Pencil className="h-8 w-8 text-muted-foreground/50" />
                      <p>No custom fields yet</p>
                      <p className="text-xs">
                        Add custom fields to capture additional data
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customFields.map(field => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">
                      <div>{field.label}</div>
                      {field.help_text && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {field.help_text}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {field.api_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {fieldTypeLabels[field.data_type] || field.data_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {field.is_required ? (
                        <Badge variant="destructive" className="text-xs">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {field.is_visible ? (
                        <Eye className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Field Creation Wizard */}
      <FieldCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        objectDefinition={objectDefinition}
        existingFields={fields.map(f => ({ api_name: f.api_name }))}
        relatedObjects={relatedObjects}
      />
    </div>
  )
}
