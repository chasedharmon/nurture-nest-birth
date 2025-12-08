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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUser } from '@/app/actions/setup'
import type { UserWithRole, Role } from '@/lib/supabase/types'
import { Loader2 } from 'lucide-react'

interface EditUserDialogProps {
  user: UserWithRole
  roles: Role[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({
  user,
  roles,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role_id: user.role_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateUser(user.id, {
        full_name: formData.full_name || undefined,
        role_id: formData.role_id || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update user')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and role assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={e =>
                setFormData(prev => ({ ...prev, full_name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role_id}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, role_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    {role.is_system && (
                      <span className="ml-2 text-muted-foreground">
                        (System)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
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
