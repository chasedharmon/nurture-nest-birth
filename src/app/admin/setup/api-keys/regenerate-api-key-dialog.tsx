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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Copy, Check, Loader2 } from 'lucide-react'
import type { ApiKey } from '@/app/actions/api-keys'
import { regenerateApiKey } from '@/app/actions/api-keys'
import { toast } from 'sonner'

interface RegenerateApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegenerateApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: RegenerateApiKeyDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleRegenerate = async () => {
    if (!apiKey) return

    setIsSubmitting(true)

    try {
      const result = await regenerateApiKey(apiKey.id)

      if (result.success && result.fullKey) {
        setNewKey(result.fullKey)
        toast.success('API key regenerated')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to regenerate')
      }
    } catch (error) {
      console.error('Error regenerating API key:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => {
      setNewKey(null)
      setCopied(false)
    }, 150)
  }

  if (!apiKey) return null

  // Show the new key if we just regenerated
  if (newKey) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              New API Key Generated
            </AlertDialogTitle>
            <AlertDialogDescription>
              Copy your new API key now. You won&apos;t be able to see it again!
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Alert
            variant="destructive"
            className="border-yellow-300 bg-yellow-50 text-yellow-800"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The old key has been invalidated. Update your applications
              immediately.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted p-3">
              <code className="break-all font-mono text-sm">{newKey}</code>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <AlertDialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Regenerate API Key
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to regenerate{' '}
            <strong>&quot;{apiKey.name}&quot;</strong>? The current key will be
            immediately invalidated.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert
          variant="destructive"
          className="border-yellow-300 bg-yellow-50 text-yellow-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Any applications using the current key will immediately lose access
            until updated with the new key.
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Key
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
