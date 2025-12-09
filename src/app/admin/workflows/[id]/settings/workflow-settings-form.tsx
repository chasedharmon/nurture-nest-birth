'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EntryCriteriaBuilder } from '@/components/admin/workflows/entry-criteria-builder'
import { ReentryRules } from '@/components/admin/workflows/reentry-rules'
import { updateWorkflowSettings } from '@/app/actions/workflows'
import type {
  Workflow,
  WorkflowObjectType,
  EntryCriteria,
  ReentryMode,
  TriggerConfig,
} from '@/lib/workflows/types'
import {
  OBJECT_TYPE_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
  OBJECT_FIELDS,
} from '@/lib/workflows/types'

interface WorkflowSettingsFormProps {
  workflow: Workflow
  objectType: WorkflowObjectType
}

export function WorkflowSettingsForm({
  workflow,
  objectType,
}: WorkflowSettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(workflow.name)
  const [description, setDescription] = useState(workflow.description || '')
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>(
    workflow.trigger_config || {}
  )
  const [entryCriteria, setEntryCriteria] = useState<EntryCriteria>(
    workflow.entry_criteria || { conditions: [], match_type: 'all' }
  )
  const [reentryMode, setReentryMode] = useState<ReentryMode>(
    workflow.reentry_mode || 'allow_all'
  )
  const [reentryWaitDays, setReentryWaitDays] = useState<number | null>(
    workflow.reentry_wait_days || null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateWorkflowSettings(workflow.id, {
        name,
        description: description || null,
        trigger_config: triggerConfig,
        entry_criteria: entryCriteria,
        reentry_mode: reentryMode,
        reentry_wait_days:
          reentryMode === 'reentry_after_days' ? reentryWaitDays : null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/admin/workflows/${workflow.id}`)
        router.refresh()
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get available fields for trigger configuration
  const fields = OBJECT_FIELDS[objectType] || []

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the name and description for this workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter workflow name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this workflow does"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Object Type</Label>
              <Input
                value={
                  OBJECT_TYPE_OPTIONS.find(o => o.value === objectType)
                    ?.label || objectType
                }
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Cannot be changed after creation
              </p>
            </div>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Input
                value={
                  TRIGGER_TYPE_OPTIONS.find(
                    o => o.value === workflow.trigger_type
                  )?.label || workflow.trigger_type
                }
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Cannot be changed after creation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration (for field_change triggers) */}
      {workflow.trigger_type === 'field_change' && (
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
            <CardDescription>
              Configure which field changes should trigger this workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Watch Field</Label>
              <Select
                value={triggerConfig.field || ''}
                onValueChange={field =>
                  setTriggerConfig({ ...triggerConfig, field })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field to watch" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Value (optional)</Label>
                <Input
                  value={triggerConfig.from_value || ''}
                  onChange={e =>
                    setTriggerConfig({
                      ...triggerConfig,
                      from_value: e.target.value || undefined,
                    })
                  }
                  placeholder="Any value"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to trigger on any change
                </p>
              </div>
              <div className="space-y-2">
                <Label>To Value (optional)</Label>
                <Input
                  value={triggerConfig.to_value || ''}
                  onChange={e =>
                    setTriggerConfig({
                      ...triggerConfig,
                      to_value: e.target.value || undefined,
                    })
                  }
                  placeholder="Any value"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to trigger on any new value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Criteria</CardTitle>
          <CardDescription>
            Filter which records can enter this workflow. Only records matching
            these conditions will trigger the workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntryCriteriaBuilder
            objectType={objectType}
            value={entryCriteria}
            onChange={setEntryCriteria}
          />
        </CardContent>
      </Card>

      {/* Re-entry Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Re-entry Rules</CardTitle>
          <CardDescription>
            Control whether records can enter this workflow multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReentryRules
            mode={reentryMode}
            waitDays={reentryWaitDays}
            onModeChange={setReentryMode}
            onWaitDaysChange={setReentryWaitDays}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </form>
  )
}
