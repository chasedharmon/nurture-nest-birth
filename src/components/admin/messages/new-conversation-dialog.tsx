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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Loader2, Check, ChevronsUpDown, User } from 'lucide-react'
import { createConversation } from '@/app/actions/messaging'
import { searchLeads } from '@/app/actions/leads'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string
}

export function NewConversationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setClients([])
      return
    }

    setIsSearching(true)
    const result = await searchLeads({ query, status: 'all', limit: 10 })
    if (result.success && result.leads) {
      setClients(
        result.leads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
        }))
      )
    }
    setIsSearching(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) return

    startTransition(async () => {
      const result = await createConversation({
        clientId: selectedClient.id,
        subject: subject || undefined,
        initialMessage: initialMessage || undefined,
      })

      if (result.success && result.conversationId) {
        setOpen(false)
        setSelectedClient(null)
        setSubject('')
        setInitialMessage('')
        router.push(`/admin/messages/${result.conversationId}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Send a message to a client. They&apos;ll be able to reply through
              their client portal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientOpen}
                    className="w-full justify-between"
                  >
                    {selectedClient ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedClient.name}
                      </span>
                    ) : (
                      'Select a client...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search clients..."
                      value={searchQuery}
                      onValueChange={handleSearch}
                    />
                    <CommandList>
                      {isSearching ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : clients.length === 0 ? (
                        <CommandEmpty>
                          {searchQuery.length < 2
                            ? 'Type to search clients...'
                            : 'No clients found.'}
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {clients.map(client => (
                            <CommandItem
                              key={client.id}
                              value={client.id}
                              onSelect={() => {
                                setSelectedClient(client)
                                setClientOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedClient?.id === client.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{client.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {client.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Upcoming appointment"
              />
            </div>

            {/* Initial Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                value={initialMessage}
                onChange={e => setInitialMessage(e.target.value)}
                placeholder="Write your first message..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                You can also send a message after creating the conversation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedClient || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Conversation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
