import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getTeamMembers,
  getCurrentOnCall,
  getOnCallSchedule,
  getTimeEntries,
} from '@/app/actions/team'
import type { TeamMember, OnCallSchedule } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TeamMembersTable,
  OnCallBadge,
  AddTeamMemberDialog,
  TimeEntryForm,
  TimeEntriesList,
  OnCallScheduleManager,
} from '@/components/admin/team'

export default async function TeamPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all team data in parallel
  const [teamResult, onCallResult, schedulesResult, timeEntriesResult] =
    await Promise.all([
      getTeamMembers({ includeInactive: true }),
      getCurrentOnCall(),
      getOnCallSchedule(),
      getTimeEntries({}),
    ])

  const teamMembers: TeamMember[] = teamResult.success
    ? teamResult.data || []
    : []
  const currentOnCall: OnCallSchedule[] = onCallResult.success
    ? onCallResult.data || []
    : []
  const schedules: OnCallSchedule[] = schedulesResult.success
    ? schedulesResult.data || []
    : []
  const timeEntries = timeEntriesResult.success
    ? timeEntriesResult.data || []
    : []

  const activeCount = teamMembers.filter((m: TeamMember) => m.is_active).length
  const inactiveCount = teamMembers.filter(
    (m: TeamMember) => !m.is_active
  ).length

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

        {/* Tabs for Team, Time Tracking, and On-Call */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="oncall">On-Call Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6">
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
          </TabsContent>

          <TabsContent value="time" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Log Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimeEntryForm teamMembers={teamMembers} />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Time Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimeEntriesList
                      entries={timeEntries}
                      showMember={true}
                      showClient={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="oncall" className="mt-6">
            <OnCallScheduleManager
              schedules={schedules}
              teamMembers={teamMembers}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
