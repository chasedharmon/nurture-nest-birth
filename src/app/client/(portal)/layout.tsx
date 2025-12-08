import { redirect } from 'next/navigation'
import { getClientSession, signOutClient } from '@/app/actions/client-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getClientSession()

  if (!session) {
    redirect('/client/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/client/dashboard"
                className="text-xl font-semibold text-primary"
              >
                Nurture Nest Birth
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/client/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/client/services"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/client/meetings"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Meetings
                </Link>
                <Link
                  href="/client/documents"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documents
                </Link>
                <Link
                  href="/client/payments"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Payments
                </Link>
                <Link
                  href="/client/invoices"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Invoices
                </Link>
                <Link
                  href="/client/intake"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Intake
                </Link>
                <Link
                  href="/client/resources"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resources
                </Link>
                <Link
                  href="/client/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.name}
              </span>
              <form action={signOutClient}>
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
