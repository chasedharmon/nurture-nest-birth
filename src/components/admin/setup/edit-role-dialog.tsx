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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { updateRole } from '@/app/actions/setup'
import { editRoleSchema, type EditRoleFormData } from '@/lib/validations/setup'
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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    },
  })

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions,
      })
      setServerError(null)
    }
  }, [open, role, form])

  const onSubmit = async (data: EditRoleFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await updateRole(role.id, {
        name: role.is_system ? undefined : data.name,
        description: role.is_system ? undefined : data.description || undefined,
        permissions: data.permissions as Permissions,
      })

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setServerError(result.error || 'Failed to update role')
      }
    } catch {
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {role.is_system ? 'View Role' : 'Edit Role'}
            </DialogTitle>
            {role.is_system && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {role.is_system ? (
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input value={role.name} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    System role names cannot be changed.
                  </p>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {role.is_system ? (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={role.description || ''}
                    disabled
                    rows={3}
                    className="bg-muted"
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this role..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormDescription className="mb-4">
                    {role.is_system
                      ? 'You can modify permissions for system roles.'
                      : 'Select which actions this role can perform on each object type.'}
                  </FormDescription>
                  <div className="rounded-md border border-border p-4">
                    <PermissionsMatrix
                      permissions={field.value as Permissions}
                      onChange={field.onChange}
                    />
                  </div>
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
                {role.is_system ? 'Close' : 'Cancel'}
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
