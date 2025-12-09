import { redirect } from 'next/navigation'
import { getClientSession, signOutClient } from '@/app/actions/client-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/client/mobile-nav'
import { ClientNavMessageBadge } from '@/components/client/nav-message-badge'
import { ClientMessageNotifications } from '@/components/client/message-notifications'
import { getClientUnreadCount } from '@/app/actions/messaging'

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getClientSession()

  if (!session) {
    redirect('/client/login')
  }

  // Fetch unread message count for the client
  const unreadResult = await getClientUnreadCount(session.clientId)
  const unreadCount = unreadResult.count || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 dark:from-background dark:via-primary/5 dark:to-secondary/5">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 md:gap-8">
              {/* Mobile Navigation */}
              <MobileNav />

              <Link
                href="/client/dashboard"
                className="text-lg md:text-xl font-semibold text-primary"
              >
                Nurture Nest Birth
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-1 lg:space-x-4">
                <Link
                  href="/client/dashboard"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <ClientNavMessageBadge
                  clientId={session.clientId}
                  initialCount={unreadCount}
                />
                <Link
                  href="/client/services"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/client/meetings"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Meetings
                </Link>
                <Link
                  href="/client/documents"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Documents
                </Link>
                <Link
                  href="/client/payments"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Payments
                </Link>
                <Link
                  href="/client/invoices"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Invoices
                </Link>
                <Link
                  href="/client/intake"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Intake
                </Link>
                <Link
                  href="/client/resources"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Resources
                </Link>
                <Link
                  href="/client/profile"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.name}
              </span>
              <form action={signOutClient}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-[44px]"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Message Notifications */}
      <ClientMessageNotifications clientId={session.clientId} />
    </div>
  )
}
