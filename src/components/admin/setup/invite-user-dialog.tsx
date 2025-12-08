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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createInvitation } from '@/app/actions/setup'
import type { Role, TeamMember } from '@/lib/supabase/types'
import { UserPlus, Loader2 } from 'lucide-react'

interface InviteUserDialogProps {
  roles: Role[]
  unlinkedTeamMembers: TeamMember[]
}

export function InviteUserDialog({
  roles,
  unlinkedTeamMembers,
}: InviteUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    role_id: '',
    team_member_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createInvitation({
        email: formData.email,
        role_id: formData.role_id || undefined,
        team_member_id: formData.team_member_id || undefined,
      })

      if (result.success) {
        setOpen(false)
        setFormData({ email: '', role_id: '', team_member_id: '' })
        router.refresh()
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={e =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
              required
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional. Can be assigned after user accepts invite.
            </p>
          </div>

          {unlinkedTeamMembers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team_member">Link to Team Member</Label>
              <Select
                value={formData.team_member_id}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, team_member_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {unlinkedTeamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this user to an existing team member profile.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
