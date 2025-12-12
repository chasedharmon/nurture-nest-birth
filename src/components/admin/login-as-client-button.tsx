'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn, Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import { loginAsClient, type CrmRecordType } from '@/app/actions/client-auth'
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

interface LoginAsClientButtonProps {
  recordType: CrmRecordType
  clientId: string
  clientName: string
  clientEmail: string
}

export function LoginAsClientButton({
  recordType,
  clientId,
  clientName,
  clientEmail,
}: LoginAsClientButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const clientPortalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/client/dashboard`
      : '/client/dashboard'

  const handleLoginAsClient = () => {
    setError(null)
    startTransition(async () => {
      const result = await loginAsClient(recordType, clientId)
      if (result.success) {
        setShowSuccess(true)
      } else {
        setError(result.error || 'Failed to login as client')
      }
    })
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(clientPortalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = clientPortalUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenInNewTab = () => {
    window.open('/client/dashboard', '_blank')
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowSuccess(false)
    setError(null)
    setCopied(false)
  }

  // Detect if Mac or Windows for keyboard shortcut hints
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const incognitoShortcut = isMac ? '⌘ + Shift + N' : 'Ctrl + Shift + N'

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          Login As Client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {!showSuccess ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Login as Client</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to log in as <strong>{clientName}</strong> (
                {clientEmail}). This will create a client session allowing you
                to see exactly what they see.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleLoginAsClient}
                disabled={isPending}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating session...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Login as {clientName.split(' ')[0]}
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Session Created
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                You can now view the client portal as{' '}
                <strong>{clientName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              {/* Recommendation */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">
                  For best results, open in a private/incognito window:
                </p>
                <p className="text-xs text-muted-foreground">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs font-mono">
                    {incognitoShortcut}
                  </kbd>{' '}
                  to open an incognito window, then paste the URL.
                </p>
              </div>

              {/* URL Copy */}
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded truncate">
                  {clientPortalUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={handleOpenInNewTab}
                className="w-full sm:w-auto gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
