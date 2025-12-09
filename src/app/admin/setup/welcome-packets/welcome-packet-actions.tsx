'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { WelcomePacketDialog } from '@/components/admin/setup/welcome-packet-dialog'
import {
  deleteWelcomePacket,
  toggleWelcomePacketActive,
} from '@/app/actions/setup'
import type { WelcomePacket } from '@/lib/supabase/types'
import { MoreHorizontal, Edit, Trash2, Power, PowerOff } from 'lucide-react'

interface WelcomePacketActionsProps {
  packet: WelcomePacket
}

export function WelcomePacketActions({ packet }: WelcomePacketActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleActive = async () => {
    setIsToggling(true)
    await toggleWelcomePacketActive(packet.id, !packet.is_active)
    router.refresh()
    setIsToggling(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteWelcomePacket(packet.id)
    if (result.success) {
      setShowDeleteDialog(false)
      router.refresh()
    }
    setIsDeleting(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <WelcomePacketDialog mode="edit" packet={packet}>
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </WelcomePacketDialog>

          <DropdownMenuItem onClick={handleToggleActive} disabled={isToggling}>
            {packet.is_active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Welcome Packet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{packet.name}&quot;? This
              action cannot be undone. If this packet has been delivered to
              clients, it will be deactivated instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
