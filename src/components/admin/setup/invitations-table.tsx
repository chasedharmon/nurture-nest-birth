'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { resendInvitation, cancelInvitation } from '@/app/actions/setup'
import type { UserInvitation } from '@/lib/supabase/types'
import { MoreHorizontal, Send, X, Clock } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'

interface InvitationsTableProps {
  invitations: UserInvitation[]
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleResend = async (invitationId: string) => {
    setIsProcessing(true)
    try {
      await resendInvitation(invitationId)
      router.refresh()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!cancellingId) return

    setIsProcessing(true)
    try {
      await cancelInvitation(cancellingId)
      router.refresh()
    } finally {
      setIsProcessing(false)
      setCancellingId(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No pending invitations.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Team Member
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Sent
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invitations.map(invitation => {
              const isExpired = isPast(new Date(invitation.expires_at))

              return (
                <tr key={invitation.id} className="hover:bg-muted/50">
                  <td className="px-4 py-4 font-medium text-foreground">
                    {invitation.email}
                  </td>
                  <td className="px-4 py-4">
                    {invitation.role ? (
                      <Badge variant="outline">
                        {invitation.role.name.charAt(0).toUpperCase() +
                          invitation.role.name.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {invitation.team_member
                      ? invitation.team_member.display_name
                      : '—'}
                  </td>
                  <td className="px-4 py-4">
                    {isExpired ? (
                      <Badge className="bg-red-100 text-red-800 border-0 dark:bg-red-900/20 dark:text-red-300">
                        <Clock className="mr-1 h-3 w-3" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-0 dark:bg-amber-900/20 dark:text-amber-300">
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDistanceToNow(new Date(invitation.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isProcessing}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleResend(invitation.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Resend Invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setCancellingId(invitation.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancellingId !== null}
        onOpenChange={() => setCancellingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? The recipient
              will no longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Keep Invitation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
