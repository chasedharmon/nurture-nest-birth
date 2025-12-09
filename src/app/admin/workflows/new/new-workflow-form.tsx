'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Workflow, Loader2 } from 'lucide-react'
import { createWorkflow } from '@/app/actions/workflows'
import {
  OBJECT_TYPE_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
  OBJECT_FIELDS,
} from '@/lib/workflows/types'

const workflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  object_type: z.enum([
    'lead',
    'meeting',
    'payment',
    'invoice',
    'service',
    'document',
    'contract',
    'intake_form',
  ] as const),
  trigger_type: z.enum([
    'record_create',
    'record_update',
    'field_change',
    'scheduled',
    'manual',
    'form_submit',
    'payment_received',
  ] as const),
  // Field change config
  trigger_field: z.string().optional(),
  trigger_from_value: z.string().optional(),
  trigger_to_value: z.string().optional(),
})

type WorkflowFormData = z.infer<typeof workflowSchema>

export function NewWorkflowForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      object_type: 'lead',
      trigger_type: 'record_create',
    },
  })

  const objectType = form.watch('object_type')
  const triggerType = form.watch('trigger_type')
  const availableFields = OBJECT_FIELDS[objectType] || []

  const onSubmit = async (data: WorkflowFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      // Build trigger config based on trigger type
      const triggerConfig: Record<string, unknown> = {}

      if (data.trigger_type === 'field_change') {
        if (data.trigger_field) {
          triggerConfig.field = data.trigger_field
        }
        if (data.trigger_from_value) {
          triggerConfig.from_value = data.trigger_from_value
        }
        if (data.trigger_to_value) {
          triggerConfig.to_value = data.trigger_to_value
        }
      }

      const result = await createWorkflow({
        name: data.name,
        description: data.description || '',
        object_type: data.object_type,
        trigger_type: data.trigger_type,
        trigger_config: triggerConfig,
        is_active: false,
      })

      if (result.error) {
        setServerError(result.error)
      } else if (result.data) {
        router.push(`/admin/workflows/${result.data.id}`)
      }
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/workflows">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Workflows
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  New Workflow
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create an automation for your doula business
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., New Client Welcome Sequence"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this workflow does..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trigger Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="object_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Object Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select object type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OBJECT_TYPE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of record that will trigger this workflow
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trigger_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRIGGER_TYPE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div>{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        When should this workflow be triggered?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Field change specific options */}
                {triggerType === 'field_change' && (
                  <div className="space-y-4 pt-2 border-t">
                    <FormField
                      control={form.control}
                      name="trigger_field"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field to Monitor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a field" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableFields.map(f => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The workflow will trigger when this field changes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="trigger_from_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Value (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Previous value" {...field} />
                            </FormControl>
                            <FormDescription>
                              Only trigger if changing from this value
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="trigger_to_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Value (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="New value" {...field} />
                            </FormControl>
                            <FormDescription>
                              Only trigger if changing to this value
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/admin/workflows">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Open Builder
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  )
}
