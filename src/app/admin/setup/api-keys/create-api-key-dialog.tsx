'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Plus, Key, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { createApiKey } from '@/app/actions/api-keys'
import { API_PERMISSIONS } from '@/lib/constants/api-permissions'
import { toast } from 'sonner'

interface CreateApiKeyDialogProps {
  children?: React.ReactNode
}

export function CreateApiKeyDialog({ children }: CreateApiKeyDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [expiresIn, setExpiresIn] = useState<string>('never')

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

  const calculateExpiresAt = (value: string): string | null => {
    if (value === 'never') return null
    const now = new Date()
    switch (value) {
      case '30d':
        now.setDate(now.getDate() + 30)
        break
      case '90d':
        now.setDate(now.getDate() + 90)
        break
      case '1y':
        now.setFullYear(now.getFullYear() + 1)
        break
      default:
        return null
    }
    return now.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (Object.keys(permissions).length === 0) {
      toast.error('At least one permission is required')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createApiKey({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
        expiresAt: calculateExpiresAt(expiresIn),
      })

      if (result.success && result.fullKey) {
        setNewKey(result.fullKey)
        toast.success('API key created successfully')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset state after animation
    setTimeout(() => {
      setName('')
      setDescription('')
      setPermissions({})
      setExpiresIn('never')
      setNewKey(null)
      setCopied(false)
    }, 150)
  }

  // Show the new key display if we just created one
  if (newKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          {children ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <Alert
            variant="destructive"
            className="border-yellow-300 bg-yellow-50 text-yellow-800"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is the only time your API key will be displayed. Store it
              securely - it cannot be recovered.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted p-3">
              <code className="break-all font-mono text-sm">{newKey}</code>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key for external integrations. Select the
            permissions this key should have.
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
                placeholder="e.g., Production Integration"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this key used for?"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="expires">Expiration</Label>
              <select
                id="expires"
                value={expiresIn}
                onChange={e => setExpiresIn(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="never">Never expires</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="1y">1 year</option>
              </select>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div>
            <Label className="text-base">Permissions *</Label>
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
                          id={`${resource}-${action}`}
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
                          htmlFor={`${resource}-${action}`}
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Create API Key
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
