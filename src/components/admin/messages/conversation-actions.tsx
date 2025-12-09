'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  MoreVertical,
  Archive,
  RotateCcw,
  XCircle,
  Loader2,
} from 'lucide-react'
import {
  archiveConversation,
  closeConversation,
  reopenConversation,
} from '@/app/actions/messaging'

interface ConversationActionsProps {
  conversationId: string
  status: 'active' | 'closed' | 'archived'
}

export function ConversationActions({
  conversationId,
  status,
}: ConversationActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveConversation(conversationId)
      if (result.success) {
        router.push('/admin/messages')
      }
    })
  }

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeConversation(conversationId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const handleReopen = () => {
    startTransition(async () => {
      const result = await reopenConversation(conversationId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === 'active' && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Conversation
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Closing this conversation will prevent new messages from
                    being sent. You can reopen it later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClose}>
                    Close Conversation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuSeparator />
          </>
        )}

        {(status === 'closed' || status === 'archived') && (
          <>
            <DropdownMenuItem onClick={handleReopen}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reopen Conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {status !== 'archived' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={e => e.preventDefault()}
                className="text-destructive"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the conversation to the archived tab. You can
                  restore it later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
