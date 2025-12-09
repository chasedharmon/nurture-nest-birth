'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquarePlus, Loader2, Send } from 'lucide-react'
import { createClientConversation } from '@/app/actions/messaging'
import { toast } from 'sonner'

interface NewMessageButtonProps {
  clientId: string
  clientName: string
  hasExistingConversation?: boolean
}

export function NewMessageButton({
  clientId,
  clientName,
  hasExistingConversation = false,
}: NewMessageButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    startTransition(async () => {
      const result = await createClientConversation({
        clientId,
        clientName,
        initialMessage: message.trim(),
      })

      if (result.success && result.conversationId) {
        toast.success('Message sent!')
        setMessage('')
        setOpen(false)
        router.push(`/client/messages/${result.conversationId}`)
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {hasExistingConversation ? 'New Message' : 'Contact Team'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Message Your Doula Team</DialogTitle>
            <DialogDescription>
              Send a message to your doula team. They&apos;ll receive a
              notification and respond as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hi! I have a question about..."
                rows={5}
                className="resize-none"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Your message will be sent to your doula team and they will
                respond within 24-48 hours for non-urgent matters.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !message.trim()}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
