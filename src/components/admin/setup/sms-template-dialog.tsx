'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  createSmsTemplate,
  updateSmsTemplate,
  type SmsTemplate,
} from '@/app/actions/setup'
import { calculateSegments } from '@/lib/sms/utils'
import {
  SMS_CATEGORY_OPTIONS,
  SMS_AVAILABLE_VARIABLES,
} from '@/lib/sms/templates'
import { Loader2, X, Plus, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const smsTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'appointment',
    'reminder',
    'confirmation',
    'follow_up',
    'payment',
    'general',
    'intake',
    'welcome',
  ]),
  content: z.string().min(1, 'Content is required').max(1600),
  available_variables: z.array(z.string()),
  is_active: z.boolean(),
})

type SmsTemplateFormData = z.infer<typeof smsTemplateSchema>

interface SmsTemplateDialogProps {
  children: React.ReactNode
  mode: 'create' | 'edit'
  template?: SmsTemplate
}

export function SmsTemplateDialog({
  children,
  mode,
  template,
}: SmsTemplateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [newVariable, setNewVariable] = useState('')

  const form = useForm<SmsTemplateFormData>({
    resolver: zodResolver(smsTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      category:
        (template?.category as SmsTemplateFormData['category']) || 'general',
      content: template?.content || '',
      available_variables: template?.available_variables || [],
      is_active: template?.is_active ?? true,
    },
  })

  const content = form.watch('content')
  const variables = form.watch('available_variables')

  // Calculate SMS stats
  const smsStats = calculateSegments(content || '')
  const charPercentage = Math.min((smsStats.charCount / 160) * 100, 100)
  const isOverLimit = smsStats.segments > 1

  // Reset form when template changes
  useEffect(() => {
    if (template && mode === 'edit') {
      form.reset({
        name: template.name,
        description: template.description || '',
        category: template.category as SmsTemplateFormData['category'],
        content: template.content,
        available_variables: template.available_variables,
        is_active: template.is_active,
      })
    }
  }, [template, mode, form])

  const addVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      form.setValue('available_variables', [...variables, newVariable.trim()])
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    form.setValue(
      'available_variables',
      variables.filter(v => v !== variable)
    )
  }

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues('content')
    form.setValue('content', currentContent + `{{${variable}}}`)
  }

  const onSubmit = async (data: SmsTemplateFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result =
        mode === 'create'
          ? await createSmsTemplate(data)
          : await updateSmsTemplate(template!.id, data)

      if (result.success) {
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        setServerError(result.error || `Failed to ${mode} template`)
      }
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      setServerError(null)
      setNewVariable('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create SMS Template' : 'Edit SMS Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a reusable SMS template with variable placeholders.'
              : 'Update the SMS template details and content.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Appointment Reminder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SMS_CATEGORY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                    <Input
                      placeholder="Brief description of when to use this template"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Message Content *</FormLabel>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          isOverLimit && 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {smsStats.charCount} chars
                      </span>
                      <span className="text-muted-foreground/50">|</span>
                      <span
                        className={cn(
                          smsStats.segments > 1 &&
                            'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {smsStats.segments} segment
                        {smsStats.segments !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Hi {{first_name}}, this is a reminder..."
                      rows={5}
                      className="font-mono text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="space-y-2">
                    <Progress
                      value={charPercentage}
                      className={cn(
                        'h-1.5',
                        isOverLimit && '[&>div]:bg-amber-500'
                      )}
                    />
                    {isOverLimit && (
                      <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Message exceeds 160 characters and will be sent as{' '}
                          {smsStats.segments} segments. This may increase costs.
                        </span>
                      </div>
                    )}
                    {smsStats.isUnicode && (
                      <div className="flex items-start gap-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Message contains special characters, reducing capacity
                          to 70 characters per segment.
                        </span>
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Use {'{{variable}}'} for dynamic content. Keep under 160
                    chars for single SMS.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick variable insert */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Insert Variable</p>
              <div className="flex flex-wrap gap-1">
                {SMS_AVAILABLE_VARIABLES.slice(0, 6).map(variable => (
                  <Button
                    key={variable.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono"
                    onClick={() => insertVariable(variable.key)}
                  >
                    {`{{${variable.key}}}`}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="available_variables"
              render={() => (
                <FormItem>
                  <FormLabel>Documented Variables</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="variable_name"
                      value={newVariable}
                      onChange={e => setNewVariable(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addVariable()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVariable}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {variables.map(variable => (
                        <Badge
                          key={variable}
                          variant="secondary"
                          className="gap-1 font-mono"
                        >
                          {`{{${variable}}}`}
                          <button
                            type="button"
                            onClick={() => removeVariable(variable)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormDescription>
                    Document which variables this template uses.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Template' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
