'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatWidgetComposerProps {
  /** Conversation ID */
  conversationId: string
  /** Client ID */
  clientId: string
  /** Client name */
  clientName: string
  /** Handler to send message */
  onSend: (content: string) => Promise<{ success: boolean; error?: string }>
  /** Handler for typing input */
  onTyping: () => void
  /** Handler for typing stop */
  onTypingStop: () => void
  /** Whether a message is currently being sent */
  isSending?: boolean
}

/**
 * ChatWidgetComposer - Compact message input for the widget
 *
 * Features:
 * - Compact design for widget context
 * - Enter to send, Shift+Enter for newline
 * - Typing indicator integration
 * - Auto-resize textarea
 */
export function ChatWidgetComposer({
  onSend,
  onTyping,
  onTypingStop,
  isSending = false,
}: ChatWidgetComposerProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isSending) return

    const messageContent = content.trim()
    setContent('') // Clear immediately for better UX
    onTypingStop() // Stop typing indicator on send

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const result = await onSend(messageContent)

    if (!result.success) {
      // Restore content if send failed
      setContent(messageContent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Auto-resize textarea
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`
    }

    // Trigger typing indicator
    if (e.target.value.trim()) {
      onTyping()
    } else {
      onTypingStop()
    }
  }

  // Stop typing when component unmounts
  useEffect(() => {
    return () => {
      onTypingStop()
    }
  }, [onTypingStop])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 border-t border-border bg-card"
    >
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={cn(
            'min-h-[36px] max-h-[100px] py-2 px-3 text-sm resize-none',
            'rounded-xl bg-muted border-0',
            'focus-visible:ring-1 focus-visible:ring-ring'
          )}
          rows={1}
          disabled={isSending}
        />
      </div>

      <Button
        type="submit"
        size="icon"
        className="h-9 w-9 rounded-full shrink-0"
        disabled={!content.trim() || isSending}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}
