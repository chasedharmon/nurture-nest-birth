'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  getWebhookDeliveries,
  regenerateWebhookSecret,
} from '@/app/actions/webhooks'
import type { Webhook, WebhookDelivery } from '@/app/actions/webhooks'
import { toast } from 'sonner'

interface ViewWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: ViewWebhookDialogProps) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [currentSecret, setCurrentSecret] = useState(webhook.secret)

  const loadDeliveries = useCallback(async (webhookId: string) => {
    setLoadingDeliveries(true)
    const result = await getWebhookDeliveries(webhookId, { limit: 10 })
    setLoadingDeliveries(false)

    if (result.success && result.deliveries) {
      setDeliveries(result.deliveries)
    }
  }, [])

  // Load deliveries when dialog opens
  const webhookId = webhook.id

  useEffect(() => {
    if (open) {
      loadDeliveries(webhookId)
    }
  }, [open, webhookId, loadDeliveries])

  // Sync secret when webhook prop changes - legitimate derived state pattern
  const webhookSecret = webhook.secret

  useEffect(() => {
    setCurrentSecret(webhookSecret)
  }, [webhookSecret])

  async function copySecret() {
    await navigator.clipboard.writeText(currentSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerateSecret() {
    if (
      !confirm(
        'Are you sure you want to regenerate the secret? The old secret will stop working immediately.'
      )
    ) {
      return
    }

    setRegenerating(true)
    const result = await regenerateWebhookSecret(webhook.id)
    setRegenerating(false)

    if (result.success && result.secret) {
      setCurrentSecret(result.secret)
      setShowSecret(true)
      toast.success('Secret regenerated - save the new secret!')
    } else {
      toast.error(result.error || 'Failed to regenerate secret')
    }
  }

  const successRate =
    webhook.total_deliveries > 0
      ? Math.round(
          (webhook.successful_deliveries / webhook.total_deliveries) * 100
        )
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {webhook.name}
            <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
          <DialogDescription>{webhook.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="deliveries">Recent Deliveries</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Endpoint URL */}
            <div>
              <label className="text-sm font-medium">Endpoint URL</label>
              <div className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {webhook.url}
              </div>
            </div>

            {/* Secret */}
            <div>
              <label className="text-sm font-medium">Signing Secret</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                  {showSecret
                    ? currentSecret
                    : '•'.repeat(Math.min(currentSecret.length, 40))}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={copySecret}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateSecret}
                  disabled={regenerating}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Events */}
            <div>
              <label className="text-sm font-medium">Subscribed Events</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {webhook.events.map(event => (
                  <Badge key={event} variant="outline">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {webhook.total_deliveries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Deliveries
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {successRate !== null ? `${successRate}%` : '—'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Success Rate
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-600">
                  {webhook.successful_deliveries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-red-600">
                  {webhook.failed_deliveries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Timeout:</span>
                <span className="ml-2">{webhook.timeout_seconds}s</span>
              </div>
              <div>
                <span className="text-muted-foreground">Retries:</span>
                <span className="ml-2">{webhook.retry_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">
                  {format(new Date(webhook.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-2">
                  {format(new Date(webhook.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deliveries" className="mt-4">
            {loadingDeliveries ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deliveries.length > 0 ? (
              <div className="space-y-2">
                {deliveries.map(delivery => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {delivery.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : delivery.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <div className="font-mono text-sm">
                          {delivery.event_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(
                            new Date(delivery.created_at),
                            'MMM d, h:mm:ss a'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {delivery.response_status && (
                        <Badge
                          variant={
                            delivery.response_status < 400
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {delivery.response_status}
                        </Badge>
                      )}
                      {delivery.duration_ms && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {delivery.duration_ms}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No deliveries yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
