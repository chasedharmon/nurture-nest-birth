'use client'

import { useState, useEffect } from 'react'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { updateUser } from '@/app/actions/setup'
import { editUserSchema, type EditUserFormData } from '@/lib/validations/setup'
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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: user.full_name || '',
      roleId: user.role_id || '',
    },
  })

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        fullName: user.full_name || '',
        roleId: user.role_id || '',
      })
      setServerError(null)
    }
  }, [open, user, form])

  const onSubmit = async (data: EditUserFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await updateUser(user.id, {
        full_name: data.fullName || undefined,
        role_id: data.roleId || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setServerError(result.error || 'Failed to update user')
      }
    } catch {
      setServerError('An unexpected error occurred')
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
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
                          {role.is_system && (
                            <span className="ml-2 text-muted-foreground">
                              (System)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
