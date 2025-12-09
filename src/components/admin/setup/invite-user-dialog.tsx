'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createInvitation } from '@/app/actions/setup'
import {
  inviteUserSchema,
  type InviteUserFormData,
} from '@/lib/validations/setup'
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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role_id: '',
      team_member_id: '',
    },
  })

  const onSubmit = async (data: InviteUserFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await createInvitation({
        email: data.email,
        role_id: data.role_id || undefined,
        team_member_id: data.team_member_id || undefined,
      })

      if (result.success) {
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        setServerError(result.error || 'Failed to send invitation')
      }
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      setServerError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() +
                            role.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional. Can be assigned after user accepts invite.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {unlinkedTeamMembers.length > 0 && (
              <FormField
                control={form.control}
                name="team_member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Team Member</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {unlinkedTeamMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.display_name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link this user to an existing team member profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
