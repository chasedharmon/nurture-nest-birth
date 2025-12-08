'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteRole } from '@/app/actions/setup'
import type { Role } from '@/lib/supabase/types'
import { MoreHorizontal, Pencil, Trash2, Shield, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { EditRoleDialog } from './edit-role-dialog'
import { PermissionsMatrixReadOnly } from './permissions-matrix'

interface RolesTableProps {
  roles: Role[]
}

export function RolesTable({ roles }: RolesTableProps) {
  const router = useRouter()
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDelete = async () => {
    if (!deletingRole) return

    setIsProcessing(true)
    try {
      const result = await deleteRole(deletingRole.id)
      if (!result.success) {
        alert(result.error || 'Failed to delete role')
      }
      router.refresh()
    } finally {
      setIsProcessing(false)
      setDeletingRole(null)
    }
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'provider':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Permissions
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Updated
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-muted/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge
                      className={`${getRoleBadgeColor(role.name)} border-0`}
                    >
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </Badge>
                  </div>
                </td>
                <td className="max-w-xs px-4 py-4 text-muted-foreground">
                  {role.description || '—'}
                </td>
                <td className="px-4 py-4">
                  <PermissionsMatrixReadOnly permissions={role.permissions} />
                </td>
                <td className="px-4 py-4">
                  {role.is_system ? (
                    <Badge
                      variant="outline"
                      className="gap-1 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                    >
                      <Lock className="h-3 w-3" />
                      System
                    </Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDistanceToNow(new Date(role.updated_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingRole(role)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {role.is_system ? 'View Permissions' : 'Edit Role'}
                      </DropdownMenuItem>
                      {!role.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingRole(role)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {roles.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No roles found.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingRole !== null}
        onOpenChange={() => setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &quot;{deletingRole?.name}
              &quot; role? This action cannot be undone. Users with this role
              will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Dialog */}
      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={true}
          onOpenChange={open => !open && setEditingRole(null)}
        />
      )}
    </>
  )
}
