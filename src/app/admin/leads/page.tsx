import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { searchLeads } from '@/app/actions/leads'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadsTable } from '@/components/admin/leads-table'
import { LeadsSearch } from '@/components/admin/leads-search'
import type { LeadStatus, LeadSource } from '@/lib/supabase/types'

export default async function AllLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    status?: LeadStatus
    source?: LeadSource
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Search leads
  const result = await searchLeads({
    query: params.q,
    status: params.status || 'all',
    source: params.source || 'all',
    limit: 100,
  })

  const leads = result.success ? result.leads || [] : []
  const total = result.count || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                All Leads
              </h1>
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? 'lead' : 'leads'} found
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsSearch />
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No leads found matching your criteria</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <LeadsTable leads={leads} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
