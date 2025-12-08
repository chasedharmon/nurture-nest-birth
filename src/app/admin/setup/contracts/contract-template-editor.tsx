'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  createContractTemplate,
  updateContractTemplate,
} from '@/app/actions/contracts'
import type { ContractTemplate } from '@/lib/supabase/types'
import { Loader2, Save, Eye, Code } from 'lucide-react'

const SERVICE_TYPES = [
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'lactation_consulting', label: 'Lactation Consulting' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'other', label: 'Other' },
]

const PLACEHOLDER_VARIABLES = [
  { name: '{{client_name}}', description: 'Full name of the client' },
  { name: '{{client_email}}', description: 'Client email address' },
  { name: '{{due_date}}', description: 'Expected due date' },
  { name: '{{service_type}}', description: 'Type of service' },
  { name: '{{service_start_date}}', description: 'Service start date' },
  { name: '{{service_end_date}}', description: 'Service end date' },
  { name: '{{total_amount}}', description: 'Total contract amount' },
  { name: '{{provider_name}}', description: 'Provider/doula name' },
  { name: '{{business_name}}', description: 'Business name' },
  { name: '{{current_date}}', description: 'Current date' },
]

interface ContractTemplateEditorProps {
  template?: ContractTemplate
}

export function ContractTemplateEditor({
  template,
}: ContractTemplateEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    serviceType: template?.service_type || '',
    content: template?.content || getDefaultTemplate(),
    isDefault: template?.is_default || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (template) {
        // Update existing
        const result = await updateContractTemplate(template.id, {
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
          isDefault: formData.isDefault,
        })

        if (!result.success) {
          setError(result.error || 'Failed to update template')
          return
        }
      } else {
        // Create new
        const result = await createContractTemplate({
          name: formData.name,
          description: formData.description || undefined,
          serviceType: formData.serviceType || undefined,
          content: formData.content,
          isDefault: formData.isDefault,
        })

        if (!result.success) {
          setError(result.error || 'Failed to create template')
          return
        }
      }

      router.push('/admin/setup/contracts')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      'contract-content'
    ) as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent =
        formData.content.substring(0, start) +
        variable +
        formData.content.substring(end)
      setFormData(prev => ({ ...prev, content: newContent }))

      // Restore cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        )
      }, 0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            Basic information about the contract template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Birth Doula Services Agreement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, serviceType: value }))
                }
                disabled={!!template}
              >
                <SelectTrigger id="service-type">
                  <SelectValue placeholder="Select a service type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    General (All Services)
                  </SelectItem>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <p className="text-xs text-muted-foreground">
                  Service type cannot be changed after creation
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of when to use this template..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is-default" className="font-medium">
                Default Template
              </Label>
              <p className="text-sm text-muted-foreground">
                Use this template by default for the selected service type
              </p>
            </div>
            <Switch
              id="is-default"
              checked={formData.isDefault}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, isDefault: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Contract Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Content</CardTitle>
              <CardDescription>
                The content of the contract. Use placeholders for dynamic
                values.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showPreview ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Placeholder Variables */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-medium">Available Placeholders</h4>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDER_VARIABLES.map(variable => (
                <Button
                  key={variable.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable.name)}
                  title={variable.description}
                  className="font-mono text-xs"
                >
                  {variable.name}
                </Button>
              ))}
            </div>
          </div>

          {showPreview ? (
            <div className="prose prose-sm max-w-none rounded-lg border border-border bg-card p-6">
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.content
                    .replace(/\n/g, '<br>')
                    .replace(/{{(\w+)}}/g, '<code>{{$1}}</code>'),
                }}
              />
            </div>
          ) : (
            <Textarea
              id="contract-content"
              value={formData.content}
              onChange={e =>
                setFormData(prev => ({ ...prev, content: e.target.value }))
              }
              placeholder="Enter the contract content here..."
              className="min-h-[500px] font-mono text-sm"
              required
            />
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex items-center gap-2">
          {template && (
            <Badge variant="outline" className="text-muted-foreground">
              Version {template.version}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/setup/contracts')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function getDefaultTemplate(): string {
  return `DOULA SERVICES AGREEMENT

This Service Agreement ("Agreement") is entered into as of {{current_date}} by and between:

Provider: {{business_name}} ("Doula")
Client: {{client_name}} ("Client")

1. SERVICES

The Doula agrees to provide the following services:
- Service Type: {{service_type}}
- Service Period: {{service_start_date}} to {{service_end_date}}

2. FEES AND PAYMENT

Total Fee: {{total_amount}}

Payment Schedule:
- 50% deposit due upon signing this agreement
- Remaining balance due before services begin

3. SCOPE OF SERVICES

The Doula will provide:
- Continuous support during labor and birth
- Prenatal visits to discuss birth preferences
- Postpartum follow-up visit
- Phone and email support throughout the service period

4. LIMITATIONS

The Doula does not provide medical advice or perform clinical tasks. The Doula is not a substitute for medical care.

5. CANCELLATION POLICY

- Cancellation more than 30 days before due date: Full refund minus $100 administrative fee
- Cancellation 15-30 days before due date: 50% refund
- Cancellation less than 15 days before due date: No refund

6. AGREEMENT

By signing below, both parties agree to the terms outlined in this agreement.

Client Signature: _________________________
Date: _________________________

Provider Signature: _________________________
Date: _________________________
`
}
