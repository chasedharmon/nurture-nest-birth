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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Ban, Loader2 } from 'lucide-react'
import type { ApiKey } from '@/app/actions/api-keys'
import { revokeApiKey } from '@/app/actions/api-keys'
import { toast } from 'sonner'

interface RevokeApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevokeApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: RevokeApiKeyDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')

  const handleRevoke = async () => {
    if (!apiKey) return

    setIsSubmitting(true)

    try {
      const result = await revokeApiKey(apiKey.id, reason.trim() || undefined)

      if (result.success) {
        toast.success('API key revoked', {
          description: 'The key can no longer be used for API access.',
        })
        onOpenChange(false)
        setReason('')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to revoke')
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
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
          <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
            <Ban className="h-5 w-5" />
            Revoke API Key
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke{' '}
            <strong>&quot;{apiKey.name}&quot;</strong>? This action cannot be
            undone. Any applications using this key will immediately lose
            access.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Suspected compromise, No longer needed"
            rows={2}
            className="mt-1"
          />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isSubmitting}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Revoke Key
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
