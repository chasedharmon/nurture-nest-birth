import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getConversations, getUnreadCount } from '@/app/actions/messaging'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  MessageSquare,
  Search,
  Archive,
  Inbox,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ConversationList } from '@/components/admin/messages/conversation-list'
import { NewConversationDialog } from '@/components/admin/messages/new-conversation-dialog'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Messages | Nurture Nest Birth',
  description: 'In-app messaging with clients',
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tab = params.tab || 'active'
  const status =
    tab === 'archived' ? 'archived' : tab === 'closed' ? 'closed' : 'active'

  const [conversationsResult, unreadResult] = await Promise.all([
    getConversations({ status: status as 'active' | 'closed' | 'archived' }),
    getUnreadCount(),
  ])

  const conversations = conversationsResult.conversations || []
  const totalUnread = unreadResult.count || 0

  // Get stats
  const [activeResult, archivedResult] = await Promise.all([
    getConversations({ status: 'active' }),
    getConversations({ status: 'archived' }),
  ])

  const activeCount = activeResult.total || 0
  const archivedCount = archivedResult.total || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Messages
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeCount} conversation{activeCount !== 1 ? 's' : ''}
                    {totalUnread > 0 && (
                      <span className="ml-2 text-primary">
                        ({totalUnread} unread)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <NewConversationDialog />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{activeCount}</div>
                  <p className="text-sm text-muted-foreground">
                    Active Conversations
                  </p>
                </div>
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalUnread}</div>
                  <p className="text-sm text-muted-foreground">
                    Unread Messages
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{archivedCount}</div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                </div>
                <Archive className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search conversations..."
                className="pl-10"
                defaultValue={params.search}
              />
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <Link
              href="/admin/messages?tab=active"
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                tab === 'active'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Active
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalUnread}
                </Badge>
              )}
            </Link>
            <Link
              href="/admin/messages?tab=archived"
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                tab === 'archived'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Link>
          </div>

          <div className="space-y-4">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No conversations</h3>
                  <p className="text-muted-foreground text-center mt-1 max-w-sm">
                    {tab === 'archived'
                      ? 'No archived conversations yet.'
                      : 'Start a conversation with a client to get started.'}
                  </p>
                  {tab !== 'archived' && (
                    <div className="mt-4">
                      <NewConversationDialog />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ConversationList conversations={conversations} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
