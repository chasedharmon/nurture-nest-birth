'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { testWebhook } from '@/app/actions/webhooks'
import type { Webhook, WebhookDelivery } from '@/app/actions/webhooks'
import { CheckCircle, XCircle, Loader2, Send, Clock } from 'lucide-react'

interface TestWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: TestWebhookDialogProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    delivery?: WebhookDelivery
    error?: string
  } | null>(null)

  async function handleTest() {
    setIsTesting(true)
    setResult(null)

    const testResult = await testWebhook(webhook.id)
    setIsTesting(false)
    setResult(testResult)
  }

  function handleClose() {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>
            Send a test payload to &quot;{webhook.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Webhook Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Endpoint:</span>
              <code className="ml-2 text-xs break-all">{webhook.url}</code>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={webhook.is_active ? 'default' : 'secondary'}
                className="ml-2"
              >
                {webhook.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Test Payload Preview */}
          <div>
            <label className="text-sm font-medium">Test Payload</label>
            <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto max-h-32">
              {JSON.stringify(
                {
                  event: 'webhook.test',
                  timestamp: new Date().toISOString(),
                  data: {
                    message:
                      'This is a test webhook delivery from Nurture Nest Birth',
                    webhook_id: webhook.id,
                    webhook_name: webhook.name,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`font-medium ${
                    result.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </span>
              </div>

              {result.delivery && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        result.delivery.response_status &&
                        result.delivery.response_status < 400
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {result.delivery.response_status || 'No Response'}
                    </Badge>
                  </div>
                  {result.delivery.duration_ms && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{result.delivery.duration_ms}ms</span>
                    </div>
                  )}
                  {result.delivery.error_message && (
                    <div className="text-red-600 dark:text-red-400 text-xs">
                      {result.delivery.error_message}
                    </div>
                  )}
                </div>
              )}

              {result.error && !result.delivery && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {result.error}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={isTesting} className="gap-2">
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
