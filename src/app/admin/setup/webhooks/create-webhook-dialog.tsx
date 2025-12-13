'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createWebhook } from '@/app/actions/webhooks'
import {
  WEBHOOK_EVENTS,
  type WebhookEventType,
} from '@/lib/constants/webhook-events'
import { toast } from 'sonner'
import { Copy, Check, AlertCircle } from 'lucide-react'

interface CreateWebhookDialogProps {
  children: React.ReactNode
}

export function CreateWebhookDialog({ children }: CreateWebhookDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([])
  const [showSecret, setShowSecret] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function resetForm() {
    setName('')
    setDescription('')
    setUrl('')
    setSelectedEvents([])
    setShowSecret(false)
    setCreatedSecret(null)
    setCopied(false)
  }

  function toggleEvent(event: WebhookEventType) {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  function toggleCategory(events: readonly { value: string; label: string }[]) {
    const categoryEvents = events.map(e => e.value as WebhookEventType)
    const allSelected = categoryEvents.every(e => selectedEvents.includes(e))

    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !categoryEvents.includes(e)))
    } else {
      setSelectedEvents(prev => [
        ...prev,
        ...categoryEvents.filter(e => !prev.includes(e)),
      ])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createWebhook({
      name,
      description: description || undefined,
      url,
      events: selectedEvents,
    })

    setIsSubmitting(false)

    if (result.success && result.webhook) {
      toast.success('Webhook created successfully')
      setCreatedSecret(result.webhook.secret)
      setShowSecret(true)
    } else {
      toast.error(result.error || 'Failed to create webhook')
    }
  }

  async function copySecret() {
    if (createdSecret) {
      await navigator.clipboard.writeText(createdSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleClose() {
    if (showSecret) {
      resetForm()
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>Webhook Created</DialogTitle>
              <DialogDescription>
                Save your webhook secret - you won&apos;t be able to see it
                again
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Important: Save your secret now
                  </p>
                  <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                    Use this secret to verify webhook signatures. This is the
                    only time it will be displayed.
                  </p>
                </div>
              </div>

              <div>
                <Label>Webhook Secret</Label>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                    {createdSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure an endpoint to receive real-time event notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Integration"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://api.example.com/webhooks"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What this webhook is used for..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Events Selection */}
              <div>
                <Label>Events to Subscribe</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select the events that should trigger this webhook
                </p>

                <div className="space-y-4 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                  {Object.entries(WEBHOOK_EVENTS).map(([key, category]) => {
                    const categoryEvents = category.events.map(
                      e => e.value as WebhookEventType
                    )
                    const selectedCount = categoryEvents.filter(e =>
                      selectedEvents.includes(e)
                    ).length
                    const allSelected = selectedCount === categoryEvents.length

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`category-${key}`}
                            checked={allSelected}
                            onCheckedChange={() =>
                              toggleCategory(category.events)
                            }
                          />
                          <Label
                            htmlFor={`category-${key}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {category.label}
                            {selectedCount > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({selectedCount}/{categoryEvents.length})
                              </span>
                            )}
                          </Label>
                        </div>
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {category.events.map(event => (
                            <div
                              key={event.value}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={event.value}
                                checked={selectedEvents.includes(
                                  event.value as WebhookEventType
                                )}
                                onCheckedChange={() =>
                                  toggleEvent(event.value as WebhookEventType)
                                }
                              />
                              <Label
                                htmlFor={event.value}
                                className="text-xs cursor-pointer"
                              >
                                {event.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !name || !url || selectedEvents.length === 0
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
