'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn, Loader2 } from 'lucide-react'
import { loginAsClient } from '@/app/actions/client-auth'
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

interface LoginAsClientButtonProps {
  clientId: string
  clientName: string
  clientEmail: string
}

export function LoginAsClientButton({
  clientId,
  clientName,
  clientEmail,
}: LoginAsClientButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleLoginAsClient = () => {
    setError(null)
    startTransition(async () => {
      const result = await loginAsClient(clientId)
      if (result.success) {
        // Open client portal in new tab
        window.open('/client/dashboard', '_blank')
        setIsOpen(false)
      } else {
        setError(result.error || 'Failed to login as client')
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          Login As Client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login as Client</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to log in as <strong>{clientName}</strong> (
            {clientEmail}). This will open their client portal in a new tab,
            allowing you to see exactly what they see.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLoginAsClient}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login as {clientName.split(' ')[0]}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
