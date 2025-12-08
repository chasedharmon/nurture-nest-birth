'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/supabase/types'
import { LeadsTable } from './leads-table'
import { Users } from 'lucide-react'

interface AdminDashboardProps {
  user: {
    email: string
    fullName: string | null
    role: string
  }
  leads: Lead[]
  stats: {
    total: number
    new: number
    clients: number
  }
}

export function AdminDashboard({ user, leads, stats }: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Nurture Nest Birth CRM
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.fullName || user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/team">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.clients}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Link href="/admin/leads">
                <Button variant="outline" size="sm">
                  View All Leads
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No leads yet. They&apos;ll appear here when someone submits
                  the contact form or signs up for the newsletter.
                </p>
              </div>
            ) : (
              <LeadsTable leads={leads} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
