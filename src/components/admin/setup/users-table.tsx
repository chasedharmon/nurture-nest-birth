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
import { deactivateUser, reactivateUser } from '@/app/actions/setup'
import type { UserWithRole, Role } from '@/lib/supabase/types'
import { MoreHorizontal, UserCheck, UserX, Shield, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { EditUserDialog } from './edit-user-dialog'

interface UsersTableProps {
  users: UserWithRole[]
  roles: Role[]
  currentUserId: string
}

export function UsersTable({ users, roles, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'reactivate'
    userId: string
    userName: string
  } | null>(null)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    setIsProcessing(true)
    try {
      if (confirmAction.type === 'deactivate') {
        await deactivateUser(confirmAction.userId)
      } else {
        await reactivateUser(confirmAction.userId)
      }
      router.refresh()
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Last Login
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {user.full_name
                        ? user.full_name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.full_name || 'No name'}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {user.role_details ? (
                    <Badge
                      className={`${getRoleBadgeColor(user.role_details.name)} border-0`}
                    >
                      {user.role_details.name.charAt(0).toUpperCase() +
                        user.role_details.name.slice(1)}
                    </Badge>
                  ) : user.role ? (
                    <Badge
                      className={`${getRoleBadgeColor(user.role)} border-0`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No role</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {user.is_active !== false ? (
                    <Badge className="bg-green-100 text-green-800 border-0 dark:bg-green-900/20 dark:text-green-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-0 dark:bg-red-900/20 dark:text-red-300">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.last_login_at
                    ? formatDistanceToNow(new Date(user.last_login_at), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDistanceToNow(new Date(user.created_at), {
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
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`mailto:${user.email}`, '_blank')
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      {user.id !== currentUserId && (
                        <>
                          <DropdownMenuSeparator />
                          {user.is_active !== false ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'deactivate',
                                  userId: user.id,
                                  userName: user.full_name || user.email,
                                })
                              }
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  type: 'reactivate',
                                  userId: user.id,
                                  userName: user.full_name || user.email,
                                })
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate User
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No users found.
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'deactivate'
                ? 'Deactivate User'
                : 'Reactivate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'deactivate'
                ? `Are you sure you want to deactivate ${confirmAction?.userName}? They will no longer be able to access the system.`
                : `Are you sure you want to reactivate ${confirmAction?.userName}? They will be able to access the system again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={
                confirmAction?.type === 'deactivate'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isProcessing
                ? 'Processing...'
                : confirmAction?.type === 'deactivate'
                  ? 'Deactivate'
                  : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          roles={roles}
          open={true}
          onOpenChange={open => !open && setEditingUser(null)}
        />
      )}
    </>
  )
}
