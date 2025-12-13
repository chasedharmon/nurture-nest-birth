'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Webhook } from '@/app/actions/webhooks'
import { toggleWebhookStatus } from '@/app/actions/webhooks'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewWebhookDialog } from './view-webhook-dialog'
import { EditWebhookDialog } from './edit-webhook-dialog'
import { DeleteWebhookDialog } from './delete-webhook-dialog'
import { TestWebhookDialog } from './test-webhook-dialog'
import { toast } from 'sonner'

interface WebhooksTableProps {
  webhooks: Webhook[]
}

export function WebhooksTable({ webhooks }: WebhooksTableProps) {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggleStatus(webhook: Webhook) {
    setTogglingId(webhook.id)
    const result = await toggleWebhookStatus(webhook.id)
    setTogglingId(null)

    if (result.success) {
      toast.success(result.is_active ? 'Webhook enabled' : 'Webhook disabled')
    } else {
      toast.error(result.error || 'Failed to toggle webhook status')
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Webhook</th>
              <th className="pb-3 font-medium">Events</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Last Triggered</th>
              <th className="pb-3 font-medium">Success Rate</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {webhooks.map(webhook => {
              const successRate =
                webhook.total_deliveries > 0
                  ? Math.round(
                      (webhook.successful_deliveries /
                        webhook.total_deliveries) *
                        100
                    )
                  : null

              return (
                <tr key={webhook.id} className="text-sm">
                  <td className="py-4">
                    <div>
                      <div className="font-medium">{webhook.name}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground max-w-[200px]">
                        {webhook.url}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map(event => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-xs"
                        >
                          {event.split('.')[1]}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggleStatus(webhook)}
                        disabled={togglingId === webhook.id}
                      />
                      <span
                        className={
                          webhook.is_active
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {webhook.last_triggered_at ? (
                      <div className="flex items-center gap-2">
                        {webhook.last_success_at &&
                        webhook.last_success_at >=
                          (webhook.last_failure_at || '') ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : webhook.last_failure_at ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs">
                          {format(
                            new Date(webhook.last_triggered_at),
                            'MMM d, h:mm a'
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Never triggered
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    {successRate !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              successRate >= 90
                                ? 'bg-green-500'
                                : successRate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                        <span className="text-xs">{successRate}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(webhook)
                            setViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(webhook)
                            setTestDialogOpen(true)
                          }}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Send Test
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(webhook)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(webhook)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {selectedWebhook && (
        <>
          <ViewWebhookDialog
            webhook={selectedWebhook}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditWebhookDialog
            webhook={selectedWebhook}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteWebhookDialog
            webhook={selectedWebhook}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
          <TestWebhookDialog
            webhook={selectedWebhook}
            open={testDialogOpen}
            onOpenChange={setTestDialogOpen}
          />
        </>
      )}
    </>
  )
}
