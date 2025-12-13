'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Pencil, Loader2 } from 'lucide-react'
import type { ApiKey } from '@/app/actions/api-keys'
import { updateApiKey } from '@/app/actions/api-keys'
import { API_PERMISSIONS } from '@/lib/constants/api-permissions'
import { toast } from 'sonner'

interface EditApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: EditApiKeyDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [isActive, setIsActive] = useState(true)
  const [rateLimitMinute, setRateLimitMinute] = useState(60)
  const [rateLimitHour, setRateLimitHour] = useState(1000)
  const [rateLimitDay, setRateLimitDay] = useState(10000)

  // Populate form when apiKey changes
  useEffect(() => {
    if (apiKey) {
      setName(apiKey.name)
      setDescription(apiKey.description ?? '')
      setPermissions(apiKey.permissions)
      setIsActive(apiKey.is_active)
      setRateLimitMinute(apiKey.rate_limit_per_minute)
      setRateLimitHour(apiKey.rate_limit_per_hour)
      setRateLimitDay(apiKey.rate_limit_per_day)
    }
  }, [apiKey])

  const handlePermissionChange = (
    resource: string,
    action: string,
    checked: boolean
  ) => {
    setPermissions(prev => {
      const current = prev[resource] ?? []
      if (checked) {
        return { ...prev, [resource]: [...current, action] }
      } else {
        const updated = current.filter(a => a !== action)
        if (updated.length === 0) {
          const { [resource]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [resource]: updated }
      }
    })
  }

  const handleSelectAll = (resource: string) => {
    const allActions = API_PERMISSIONS[resource as keyof typeof API_PERMISSIONS]
    setPermissions(prev => ({ ...prev, [resource]: [...allActions] }))
  }

  const handleClearAll = (resource: string) => {
    setPermissions(prev => {
      const { [resource]: _, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) return

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateApiKey(apiKey.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
        isActive,
        rateLimitPerMinute: rateLimitMinute,
        rateLimitPerHour: rateLimitHour,
        rateLimitPerDay: rateLimitDay,
      })

      if (result.success) {
        toast.success('API key updated')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update')
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!apiKey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit API Key
          </DialogTitle>
          <DialogDescription>
            Update the settings for this API key.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Disable to temporarily prevent API access
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <Separator />

          {/* Rate Limits */}
          <div className="space-y-4">
            <Label className="text-base">Rate Limits</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="rateLimitMinute">Per Minute</Label>
                <Input
                  id="rateLimitMinute"
                  type="number"
                  value={rateLimitMinute}
                  onChange={e => setRateLimitMinute(parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="rateLimitHour">Per Hour</Label>
                <Input
                  id="rateLimitHour"
                  type="number"
                  value={rateLimitHour}
                  onChange={e => setRateLimitHour(parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="rateLimitDay">Per Day</Label>
                <Input
                  id="rateLimitDay"
                  type="number"
                  value={rateLimitDay}
                  onChange={e => setRateLimitDay(parseInt(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div>
            <Label className="text-base">Permissions</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the resources and actions this API key can access.
            </p>

            <div className="mt-4 space-y-4">
              {Object.entries(API_PERMISSIONS).map(([resource, actions]) => (
                <div
                  key={resource}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium capitalize">{resource}</h4>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(resource)}
                        className="h-7 px-2 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearAll(resource)}
                        className="h-7 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {actions.map(action => (
                      <div key={action} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-${resource}-${action}`}
                          checked={permissions[resource]?.includes(action)}
                          onCheckedChange={checked =>
                            handlePermissionChange(
                              resource,
                              action,
                              checked as boolean
                            )
                          }
                        />
                        <label
                          htmlFor={`edit-${resource}-${action}`}
                          className="text-sm capitalize"
                        >
                          {action}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
