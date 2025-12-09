'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Loader2,
  Check,
  ChevronsUpDown,
  User,
  Users,
  X,
} from 'lucide-react'
import {
  createConversation,
  createTeamConversation,
} from '@/app/actions/messaging'
import { searchLeads } from '@/app/actions/leads'
import { getTeamMembers } from '@/app/actions/team'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string
}

interface TeamMember {
  id: string
  user_id: string | null | undefined
  display_name: string
  email: string | null | undefined
  title: string | null | undefined
}

export function NewConversationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [conversationType, setConversationType] = useState<'client' | 'team'>(
    'client'
  )

  // Client conversation state
  const [clientOpen, setClientOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Team conversation state
  const [teamMemberOpen, setTeamMemberOpen] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>(
    []
  )
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)

  // Shared state
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Load team members when team tab is selected
  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoadingTeam(true)
      const result = await getTeamMembers({ includeInactive: false })
      if (result.success && result.data) {
        setTeamMembers(
          result.data.map(m => ({
            id: m.id,
            user_id: m.user_id,
            display_name: m.display_name,
            email: m.email,
            title: m.title,
          }))
        )
      }
      setIsLoadingTeam(false)
    }

    if (conversationType === 'team' && teamMembers.length === 0) {
      loadTeamMembers()
    }
  }, [conversationType, teamMembers.length])

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

  const handleAddTeamMember = (member: TeamMember) => {
    if (!selectedTeamMembers.find(m => m.id === member.id)) {
      setSelectedTeamMembers([...selectedTeamMembers, member])
    }
    setTeamMemberOpen(false)
  }

  const handleRemoveTeamMember = (memberId: string) => {
    setSelectedTeamMembers(selectedTeamMembers.filter(m => m.id !== memberId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (conversationType === 'client') {
      if (!selectedClient) return

      startTransition(async () => {
        const result = await createConversation({
          clientId: selectedClient.id,
          subject: subject || undefined,
          initialMessage: initialMessage || undefined,
        })

        if (result.success && result.conversationId) {
          resetAndClose()
          router.push(`/admin/messages/${result.conversationId}`)
        }
      })
    } else {
      // Team conversation
      if (selectedTeamMembers.length === 0) return

      const participantUserIds = selectedTeamMembers
        .map(m => m.user_id)
        .filter((id): id is string => id !== null)

      if (participantUserIds.length === 0) {
        // No team members with user accounts
        return
      }

      startTransition(async () => {
        const result = await createTeamConversation({
          participantUserIds,
          subject: subject || undefined,
          initialMessage: initialMessage || undefined,
        })

        if (result.success && result.conversationId) {
          resetAndClose()
          router.push(`/admin/messages/${result.conversationId}`)
        }
      })
    }
  }

  const resetAndClose = () => {
    setOpen(false)
    setSelectedClient(null)
    setSelectedTeamMembers([])
    setSubject('')
    setInitialMessage('')
    setSearchQuery('')
    setConversationType('client')
  }

  const availableTeamMembers = teamMembers.filter(
    m => !selectedTeamMembers.find(s => s.id === m.id) && m.user_id
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Message a client or start a team discussion.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={conversationType}
            onValueChange={v => setConversationType(v as 'client' | 'team')}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Message
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-4 mt-4">
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
                  <PopoverContent className="w-[450px] p-0" align="start">
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
                <p className="text-xs text-muted-foreground">
                  Client messages are visible to the entire team for continuity
                  of care.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4 mt-4">
              {/* Team Members Selection */}
              <div className="space-y-2">
                <Label>Team Members *</Label>

                {/* Selected members */}
                {selectedTeamMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTeamMembers.map(member => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member.display_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.display_name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <Popover open={teamMemberOpen} onOpenChange={setTeamMemberOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={teamMemberOpen}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add team member...
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search team members..." />
                      <CommandList>
                        {isLoadingTeam ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : availableTeamMembers.length === 0 ? (
                          <CommandEmpty>
                            {teamMembers.length === 0
                              ? 'No team members found.'
                              : 'All team members already added.'}
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {availableTeamMembers.map(member => (
                              <CommandItem
                                key={member.id}
                                value={member.display_name}
                                onSelect={() => handleAddTeamMember(member)}
                              >
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs">
                                    {member.display_name
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span>{member.display_name}</span>
                                  {member.title && (
                                    <span className="text-xs text-muted-foreground">
                                      {member.title}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Team discussions are private and not visible to clients.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Shared Fields */}
          <div className="grid gap-4 py-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={
                  conversationType === 'client'
                    ? 'e.g., Upcoming appointment'
                    : 'e.g., Schedule coordination'
                }
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
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                (conversationType === 'client' && !selectedClient) ||
                (conversationType === 'team' &&
                  selectedTeamMembers.length === 0)
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Conversation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
