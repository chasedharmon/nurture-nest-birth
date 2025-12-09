'use client'

import { useState } from 'react'
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
import {
  createEmailTemplate,
  updateEmailTemplate,
  type EmailTemplate,
} from '@/app/actions/setup'
import { Loader2, X, Plus } from 'lucide-react'

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'inquiry',
    'booking',
    'reminder',
    'follow_up',
    'payment',
    'document',
    'general',
  ]),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required'),
  available_variables: z.array(z.string()),
  is_active: z.boolean(),
  is_default: z.boolean(),
})

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>

const categoryOptions = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'booking', label: 'Booking' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'payment', label: 'Payment' },
  { value: 'document', label: 'Document' },
  { value: 'general', label: 'General' },
]

interface EmailTemplateDialogProps {
  children: React.ReactNode
  mode: 'create' | 'edit'
  template?: EmailTemplate
}

export function EmailTemplateDialog({
  children,
  mode,
  template,
}: EmailTemplateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [newVariable, setNewVariable] = useState('')

  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      category:
        (template?.category as EmailTemplateFormData['category']) || 'general',
      subject: template?.subject || '',
      body: template?.body || '',
      available_variables: template?.available_variables || [],
      is_active: template?.is_active ?? true,
      is_default: template?.is_default ?? false,
    },
  })

  const variables = form.watch('available_variables')

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

  const onSubmit = async (data: EmailTemplateFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result =
        mode === 'create'
          ? await createEmailTemplate(data)
          : await updateEmailTemplate(template!.id, data)

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
            {mode === 'create'
              ? 'Create Email Template'
              : 'Edit Email Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a reusable email template with variable placeholders.'
              : 'Update the email template details and content.'}
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
                      <Input
                        placeholder="Initial Inquiry Response"
                        {...field}
                      />
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
                        {categoryOptions.map(option => (
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Thank you for reaching out!"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can use variables like {'{{client_name}}'} in the
                    subject.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Body *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hi {{client_name}},&#10;&#10;Thank you for reaching out..."
                      rows={10}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {'{{variable_name}}'} for dynamic content. Supports
                    basic formatting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available_variables"
              render={() => (
                <FormItem>
                  <FormLabel>Available Variables</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="client_name"
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
                    Define which variables are available in this template for
                    documentation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-8">
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

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Default for category
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

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
