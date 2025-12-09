'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { sendClientMessage } from '@/app/actions/messaging'

interface ClientMessageComposerProps {
  conversationId: string
  clientId: string
  clientName: string
}

export function ClientMessageComposer({
  conversationId,
  clientId,
  clientName,
}: ClientMessageComposerProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isPending) return

    const messageContent = content.trim()
    setContent('') // Clear immediately for better UX

    startTransition(async () => {
      const result = await sendClientMessage({
        conversationId,
        clientId,
        clientName,
        content: messageContent,
      })

      if (!result.success) {
        // Restore content if send failed
        setContent(messageContent)
        console.error('Failed to send message:', result.error)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send)"
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={!content.trim() || isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Send</span>
      </Button>
    </form>
  )
}
