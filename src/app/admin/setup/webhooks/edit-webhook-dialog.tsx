'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { updateWebhook } from '@/app/actions/webhooks'
import type { Webhook } from '@/app/actions/webhooks'
import {
  WEBHOOK_EVENTS,
  type WebhookEventType,
} from '@/lib/constants/webhook-events'
import { toast } from 'sonner'

interface EditWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: EditWebhookDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(webhook.name)
  const [description, setDescription] = useState(webhook.description || '')
  const [url, setUrl] = useState(webhook.url)
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>(
    webhook.events
  )
  const [retryCount, setRetryCount] = useState(webhook.retry_count)
  const [timeoutSeconds, setTimeoutSeconds] = useState(webhook.timeout_seconds)

  // Sync form state when webhook prop changes (dialog receives new webhook)
  const webhookId = webhook.id
  useEffect(() => {
    setName(webhook.name)
    setDescription(webhook.description || '')
    setUrl(webhook.url)
    setSelectedEvents(webhook.events)
    setRetryCount(webhook.retry_count)
    setTimeoutSeconds(webhook.timeout_seconds)
    // Only re-run when webhook.id changes (i.e., different webhook selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookId])

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

    const result = await updateWebhook(webhook.id, {
      name,
      description: description || undefined,
      url,
      events: selectedEvents,
      retry_count: retryCount,
      timeout_seconds: timeoutSeconds,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success('Webhook updated successfully')
      onOpenChange(false)
    } else {
      toast.error(result.error || 'Failed to update webhook')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update your webhook configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-url">Endpoint URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retry-count">Retry Count</Label>
                <Input
                  id="retry-count"
                  type="number"
                  min={0}
                  max={10}
                  value={retryCount}
                  onChange={e => setRetryCount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={5}
                  max={60}
                  value={timeoutSeconds}
                  onChange={e =>
                    setTimeoutSeconds(parseInt(e.target.value) || 30)
                  }
                />
              </div>
            </div>

            {/* Events Selection */}
            <div>
              <Label>Events to Subscribe</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Select the events that should trigger this webhook
              </p>

              <div className="space-y-4 max-h-[250px] overflow-y-auto border rounded-lg p-4">
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
                          id={`edit-category-${key}`}
                          checked={allSelected}
                          onCheckedChange={() =>
                            toggleCategory(category.events)
                          }
                        />
                        <Label
                          htmlFor={`edit-category-${key}`}
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
                              id={`edit-${event.value}`}
                              checked={selectedEvents.includes(
                                event.value as WebhookEventType
                              )}
                              onCheckedChange={() =>
                                toggleEvent(event.value as WebhookEventType)
                              }
                            />
                            <Label
                              htmlFor={`edit-${event.value}`}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !name || !url || selectedEvents.length === 0
              }
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
