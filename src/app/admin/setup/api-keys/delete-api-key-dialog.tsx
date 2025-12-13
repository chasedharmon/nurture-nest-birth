'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import type { ApiKey } from '@/app/actions/api-keys'
import { deleteApiKey } from '@/app/actions/api-keys'
import { toast } from 'sonner'

interface DeleteApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: DeleteApiKeyDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!apiKey) return

    setIsSubmitting(true)

    try {
      const result = await deleteApiKey(apiKey.id)

      if (result.success) {
        toast.success('API key deleted')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!apiKey) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete API Key
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete{' '}
            <strong>&quot;{apiKey.name}&quot;</strong>? This action cannot be
            undone and all usage history will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
