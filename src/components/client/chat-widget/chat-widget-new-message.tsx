'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Loader2, Send, Users, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { getTeamMembers } from '@/app/actions/team'
import { createClientConversation } from '@/app/actions/messaging'
import { usePresence } from '@/lib/hooks/use-presence'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  display_name: string
  title?: string | null
  user_id?: string | null
}

interface ChatWidgetNewMessageProps {
  /** Client ID */
  clientId: string
  /** Client name for message attribution */
  clientName: string
  /** Handler to close the dialog */
  onClose: () => void
  /** Handler when conversation is created */
  onConversationCreated: (
    conversationId: string,
    subject: string | null
  ) => void
}

/**
 * ChatWidgetNewMessage - Dialog for starting a new conversation
 *
 * Features:
 * - Option to message entire team or specific members
 * - Shows online status for team members
 * - Subject line auto-generated or custom
 */
export function ChatWidgetNewMessage({
  clientId,
  clientName,
  onClose,
  onConversationCreated,
}: ChatWidgetNewMessageProps) {
  const [recipientType, setRecipientType] = useState<'team' | 'specific'>(
    'team'
  )
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [message, setMessage] = useState('')
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Get online users for status indicators
  const { isUserOnline } = usePresence({
    userId: clientId,
    userName: clientName,
    isClient: true,
    room: 'messaging',
  })

  // Fetch team members on mount
  useEffect(() => {
    async function fetchTeam() {
      setIsLoadingTeam(true)
      const result = await getTeamMembers()
      if (result.success && result.data) {
        setTeamMembers(result.data)
      }
      setIsLoadingTeam(false)
    }
    fetchTeam()
  }, [])

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    startTransition(async () => {
      // Generate subject based on selection
      let subject = 'New Message'
      if (recipientType === 'specific' && selectedMembers.length > 0) {
        const names = teamMembers
          .filter(m => selectedMembers.includes(m.id))
          .map(m => m.display_name)
          .slice(0, 2)
          .join(', ')
        subject = `Message to ${names}${selectedMembers.length > 2 ? ' + others' : ''}`
      }

      const result = await createClientConversation({
        clientId,
        clientName,
        subject,
        initialMessage: message.trim(),
      })

      if (result.success && result.conversationId) {
        toast.success('Message sent!')
        onConversationCreated(result.conversationId, subject)
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    })
  }

  return (
    <div className="absolute inset-0 bg-card flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">New Message</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 gap-4">
        {/* Recipient selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Message your care team</Label>
          <RadioGroup
            value={recipientType}
            onValueChange={val => setRecipientType(val as 'team' | 'specific')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="team" id="team" />
              <Label
                htmlFor="team"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>General question</span>
                <span className="text-xs text-muted-foreground">
                  (Notifies entire team)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label
                htmlFor="specific"
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Specific team member</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Team member selection (when specific is chosen) */}
        {recipientType === 'specific' && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            {isLoadingTeam ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No team members available
              </p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {teamMembers.map(member => {
                  const isOnline = member.user_id
                    ? isUserOnline(member.user_id)
                    : false

                  return (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={member.id}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => handleToggleMember(member.id)}
                      />
                      <Label
                        htmlFor={member.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            isOnline ? 'bg-green-500' : 'bg-gray-300'
                          )}
                        />
                        <span>{member.display_name}</span>
                        {member.title && (
                          <span className="text-xs text-muted-foreground">
                            ({member.title})
                          </span>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Message input */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="message" className="text-sm font-medium">
            Your message
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Hi! I have a question about..."
            className="resize-none flex-1 min-h-[100px]"
            disabled={isPending}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || !message.trim()}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
