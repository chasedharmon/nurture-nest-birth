import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTeamMembers, getCurrentOnCall } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamMembersTable } from '@/components/admin/team/team-members-table'
import { OnCallBadge } from '@/components/admin/team/on-call-badge'
import { AddTeamMemberDialog } from '@/components/admin/team/add-team-member-dialog'

export default async function TeamPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get team members and on-call info
  const [teamResult, onCallResult] = await Promise.all([
    getTeamMembers({ includeInactive: true }),
    getCurrentOnCall(),
  ])

  const teamMembers = teamResult.success ? teamResult.data || [] : []
  const currentOnCall = onCallResult.success ? onCallResult.data || [] : []

  const activeCount = teamMembers.filter(m => m.is_active).length
  const inactiveCount = teamMembers.filter(m => !m.is_active).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Team Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeCount} active member{activeCount !== 1 ? 's' : ''}
                {inactiveCount > 0 && `, ${inactiveCount} inactive`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <AddTeamMemberDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* On-Call Status */}
        {currentOnCall.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
                Currently On-Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {currentOnCall.map(schedule => (
                  <OnCallBadge key={schedule.id} schedule={schedule} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No team members yet</p>
                <p className="mt-1 text-sm">
                  Add your first team member to get started
                </p>
              </div>
            ) : (
              <TeamMembersTable members={teamMembers} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
