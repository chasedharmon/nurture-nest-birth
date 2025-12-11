'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { requestAccountDeletion } from '@/app/actions/gdpr'

interface DeleteOrganizationModalProps {
  organizationName: string
}

export function DeleteOrganizationModal({
  organizationName,
}: DeleteOrganizationModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmed =
    confirmText.toLowerCase() === organizationName.toLowerCase()

  const handleDelete = async () => {
    if (!isConfirmed) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await requestAccountDeletion(confirmText)

      if (result.success) {
        setOpen(false)
        // Sign out and redirect to home
        router.push('/login?message=Your account deletion has been scheduled.')
      } else {
        setError(result.error || 'Failed to request deletion')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Delete error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will permanently delete <strong>{organizationName}</strong>{' '}
              and all associated data including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>All client and lead records</li>
              <li>Invoices, payments, and contracts</li>
              <li>Messages and documents</li>
              <li>Team member accounts</li>
              <li>Workflows and templates</li>
            </ul>
            <p className="font-medium text-foreground">
              You will have 30 days to cancel this request before data is
              permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          <Label htmlFor="confirm-delete" className="text-sm">
            Type <strong>{organizationName}</strong> to confirm deletion
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={organizationName}
            className="font-mono"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Organization
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
