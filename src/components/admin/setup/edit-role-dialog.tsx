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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { updateRole } from '@/app/actions/setup'
import { PermissionsMatrix } from './permissions-matrix'
import type { Role, Permissions } from '@/lib/supabase/types'
import { Loader2, Lock } from 'lucide-react'

interface EditRoleDialogProps {
  role: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
}: EditRoleDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
  })
  const [permissions, setPermissions] = useState<Permissions>(role.permissions)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateRole(role.id, {
        name: role.is_system ? undefined : formData.name,
        description: role.is_system
          ? undefined
          : formData.description || undefined,
        permissions,
      })

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update role')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {role.is_system ? 'View Role' : 'Edit Role'}
            </DialogTitle>
            {role.is_system && (
              <Badge
                variant="outline"
                className="gap-1 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
              >
                <Lock className="h-3 w-3" />
                System Role
              </Badge>
            )}
          </div>
          <DialogDescription>
            {role.is_system
              ? 'System roles can have their permissions modified but cannot be renamed or deleted.'
              : 'Update the role details and permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                disabled={role.is_system}
                className={role.is_system ? 'bg-muted' : ''}
              />
              {role.is_system && (
                <p className="text-xs text-muted-foreground">
                  System role names cannot be changed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this role..."
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                disabled={role.is_system}
                rows={3}
                className={role.is_system ? 'bg-muted' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              {role.is_system
                ? 'You can modify permissions for system roles.'
                : 'Select which actions this role can perform on each object type.'}
            </p>
            <div className="rounded-md border border-border p-4">
              <PermissionsMatrix
                permissions={permissions}
                onChange={setPermissions}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {role.is_system ? 'Close' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
