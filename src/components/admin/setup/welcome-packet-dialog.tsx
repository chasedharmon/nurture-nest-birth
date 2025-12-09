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
import { createWelcomePacket, updateWelcomePacket } from '@/app/actions/setup'
import type { WelcomePacket, WelcomePacketTrigger } from '@/lib/supabase/types'
import { Loader2 } from 'lucide-react'

const welcomePacketSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  service_type: z.string().optional(),
  trigger_on: z.enum(['contract_signed', 'lead_converted', 'manual']),
  is_active: z.boolean(),
})

type WelcomePacketFormData = z.infer<typeof welcomePacketSchema>

const triggerOptions: {
  value: WelcomePacketTrigger
  label: string
  description: string
}[] = [
  {
    value: 'contract_signed',
    label: 'Contract Signed',
    description: 'Triggered when a client signs their contract',
  },
  {
    value: 'lead_converted',
    label: 'Lead Converted',
    description: 'Triggered when a lead becomes a client',
  },
  {
    value: 'manual',
    label: 'Manual Trigger',
    description: 'Manually send to specific clients',
  },
]

const serviceTypeOptions = [
  { value: '', label: 'All Services' },
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'lactation_consulting', label: 'Lactation Consulting' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'other', label: 'Other' },
]

interface WelcomePacketDialogProps {
  children: React.ReactNode
  mode: 'create' | 'edit'
  packet?: WelcomePacket
}

export function WelcomePacketDialog({
  children,
  mode,
  packet,
}: WelcomePacketDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<WelcomePacketFormData>({
    resolver: zodResolver(welcomePacketSchema),
    defaultValues: {
      name: packet?.name || '',
      description: packet?.description || '',
      service_type: packet?.service_type || '',
      trigger_on: packet?.trigger_on || 'contract_signed',
      is_active: packet?.is_active ?? true,
    },
  })

  const onSubmit = async (data: WelcomePacketFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const packetData = {
        name: data.name,
        description: data.description || null,
        service_type: data.service_type || null,
        trigger_on: data.trigger_on,
        is_active: data.is_active,
      }

      const result =
        mode === 'create'
          ? await createWelcomePacket(packetData)
          : await updateWelcomePacket(packet!.id, packetData)

      if (result.success) {
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        setServerError(result.error || `Failed to ${mode} packet`)
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
      form.reset({
        name: packet?.name || '',
        description: packet?.description || '',
        service_type: packet?.service_type || '',
        trigger_on: packet?.trigger_on || 'contract_signed',
        is_active: packet?.is_active ?? true,
      })
      setServerError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? 'Create Welcome Packet'
              : 'Edit Welcome Packet'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new welcome packet to automate client onboarding.'
              : 'Update the welcome packet settings.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packet Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., New Birth Doula Client Welcome"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this packet includes and when it's used..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Services" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypeOptions.map(option => (
                          <SelectItem
                            key={option.value}
                            value={option.value || 'all'}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Limit to a specific service type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trigger_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Event *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {triggerOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        triggerOptions.find(t => t.value === field.value)
                          ?.description
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable this packet for automatic triggering
                    </FormDescription>
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
                {mode === 'create' ? 'Create Packet' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
