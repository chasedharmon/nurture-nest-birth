'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Key,
  Calendar,
  Clock,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Ban,
} from 'lucide-react'
import type { ApiKey, ApiKeyUsageStats } from '@/app/actions/api-keys'
import { getApiKeyUsage } from '@/app/actions/api-keys'

interface ViewApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: ViewApiKeyDialogProps) {
  const [usage, setUsage] = useState<ApiKeyUsageStats | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)

  const fetchUsage = useCallback(async (keyId: string) => {
    setLoadingUsage(true)
    const result = await getApiKeyUsage(keyId)
    if (result.success) {
      setUsage(result.stats ?? null)
    }
    setLoadingUsage(false)
  }, [])

  // Fetch usage when dialog opens with a new API key
  const apiKeyId = apiKey?.id
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchUsage calls setState after async operation
  useEffect(() => {
    if (open && apiKeyId) {
      fetchUsage(apiKeyId)
    }
  }, [open, apiKeyId, fetchUsage])

  if (!apiKey) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = () => {
    if (apiKey.revoked_at) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Revoked
        </Badge>
      )
    }
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-300 bg-yellow-50 text-yellow-700"
        >
          <Clock className="h-3 w-3" />
          Expired
        </Badge>
      )
    }
    if (!apiKey.is_active) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Ban className="h-3 w-3" />
          Inactive
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-300 bg-green-50 text-green-700"
      >
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{apiKey.name}</h3>
              {getStatusBadge()}
            </div>
            {apiKey.description && (
              <p className="text-sm text-muted-foreground">
                {apiKey.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                {apiKey.key_prefix}...
              </code>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(apiKey.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Used:</span>
                <span>{formatDate(apiKey.last_used_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span>
                  {apiKey.expires_at ? formatDate(apiKey.expires_at) : 'Never'}
                </span>
              </div>
              {apiKey.revoked_at && (
                <>
                  <div className="flex justify-between text-red-600">
                    <span>Revoked:</span>
                    <span>{formatDate(apiKey.revoked_at)}</span>
                  </div>
                  {apiKey.revoke_reason && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason:</span>
                      <span>{apiKey.revoke_reason}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Permissions
            </h4>
            {Object.keys(apiKey.permissions).length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(apiKey.permissions).map(
                  ([resource, actions]) => (
                    <div
                      key={resource}
                      className="rounded-md border bg-muted/50 p-2"
                    >
                      <p className="text-sm font-medium capitalize">
                        {resource}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {actions.map(action => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="text-xs"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Rate Limits */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Rate Limits
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Minute:</span>
                <span>{apiKey.rate_limit_per_minute} requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Hour:</span>
                <span>{apiKey.rate_limit_per_hour} requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Day:</span>
                <span>{apiKey.rate_limit_per_day} requests</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Stats */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Usage Statistics
            </h4>
            {loadingUsage ? (
              <p className="text-sm text-muted-foreground">Loading usage...</p>
            ) : usage ? (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Requests:</span>
                  <span>{usage.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today:</span>
                  <span>{usage.requestsToday.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Hour:</span>
                  <span>{usage.requestsThisHour.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span>{usage.averageResponseTime}ms</span>
                </div>
                {usage.topEndpoints.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-muted-foreground">Top Endpoints:</p>
                    <div className="space-y-1">
                      {usage.topEndpoints.map(({ endpoint, count }) => (
                        <div
                          key={endpoint}
                          className="flex justify-between text-xs"
                        >
                          <code className="rounded bg-muted px-1">
                            {endpoint}
                          </code>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No usage data available
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
