import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getTeamMembers,
  getCurrentOnCall,
  getOnCallSchedule,
  getTimeEntries,
  getTeamMembersWithStats,
  getClientsWithTeamAssignments,
} from '@/app/actions/team'
import type { TeamMember, OnCallSchedule } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TeamMembersTable,
  OnCallBadge,
  AddTeamMemberDialog,
  TimeEntryForm,
  TimeEntriesList,
  OnCallScheduleManager,
} from '@/components/admin/team'
import { PageHeader } from '@/components/admin/navigation'
import { Users, Clock, UserCheck, Calendar, Users2 } from 'lucide-react'

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
  const [
    teamResult,
    onCallResult,
    schedulesResult,
    timeEntriesResult,
    statsResult,
    clientsResult,
  ] = await Promise.all([
    getTeamMembers({ includeInactive: true }),
    getCurrentOnCall(),
    getOnCallSchedule(),
    getTimeEntries({}),
    getTeamMembersWithStats(),
    getClientsWithTeamAssignments(),
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
  const membersWithStats = statsResult.success ? statsResult.data || [] : []
  const clientsWithAssignments = clientsResult.success
    ? clientsResult.data || []
    : []

  const activeCount = teamMembers.filter((m: TeamMember) => m.is_active).length
  const inactiveCount = teamMembers.filter(
    (m: TeamMember) => !m.is_active
  ).length

  // Calculate totals for dashboard
  const totalClients = clientsWithAssignments.length
  const unassignedClients = clientsWithAssignments.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => !c.client_assignments || c.client_assignments.length === 0
  ).length
  const totalHoursThisMonth = membersWithStats.reduce(
    (sum, m) => sum + m.hoursThisMonth,
    0
  )

  const subtitleText = `${activeCount} active member${activeCount !== 1 ? 's' : ''}${inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        subtitle={subtitleText}
        icon={<Users2 className="h-5 w-5 text-primary" />}
        actions={<AddTeamMemberDialog />}
      />

      <div>
        {/* On-Call Status */}
        {currentOnCall.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
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

        {/* Tabs for Dashboard, Team, Time Tracking, and On-Call */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="assignments">Client Assignments</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="oncall">On-Call Schedule</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Providers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Total Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClients}</div>
                  {unassignedClients > 0 && (
                    <p className="text-xs text-secondary mt-1">
                      {unassignedClients} unassigned
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalHoursThisMonth.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    On-Call Now
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentOnCall.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members with Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {membersWithStats.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No active team members
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {membersWithStats.map(
                      ({
                        member,
                        clientCount,
                        primaryClientCount,
                        hoursThisMonth,
                      }) => (
                        <Link
                          key={member.id}
                          href={`/admin/team/${member.id}`}
                          className="block"
                        >
                          <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  {member.avatar_url ? (
                                    <img
                                      src={member.avatar_url}
                                      alt={member.display_name}
                                      className="h-12 w-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                                      {member.display_name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">
                                    {member.display_name}
                                  </h3>
                                  {member.title && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {member.title}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {member.role}
                                    </Badge>
                                    {member.is_accepting_clients ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-primary text-primary"
                                      >
                                        Accepting
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-secondary text-secondary"
                                      >
                                        Not Accepting
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                                <div className="text-center">
                                  <div className="text-lg font-bold">
                                    {clientCount}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Clients
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold">
                                    {primaryClientCount}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Primary
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold">
                                    {hoursThisMonth.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Hours
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Members Tab */}
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

          {/* Client Assignments Tab */}
          <TabsContent value="assignments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {clientsWithAssignments.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No clients yet
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">Client</th>
                          <th className="p-3 text-left font-medium">Status</th>
                          <th className="p-3 text-left font-medium">
                            Due Date
                          </th>
                          <th className="p-3 text-left font-medium">
                            Assigned Team
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {clientsWithAssignments.map((client: any) => (
                          <tr key={client.id} className="border-b">
                            <td className="p-3">
                              <Link
                                href={`/admin/leads/${client.id}`}
                                className="font-medium hover:underline"
                              >
                                {client.name}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {client.email}
                              </p>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{client.status}</Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {client.expected_due_date
                                ? new Date(
                                    client.expected_due_date
                                  ).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="p-3">
                              {client.client_assignments?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {client.client_assignments.map(
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (assignment: any) => (
                                      <Badge
                                        key={assignment.id}
                                        variant={
                                          assignment.assignment_role ===
                                          'primary'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {assignment.team_member?.display_name ||
                                          'Unknown'}
                                        {assignment.assignment_role ===
                                          'primary' && ' (P)'}
                                        {assignment.assignment_role ===
                                          'backup' && ' (B)'}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-secondary">
                                  Not assigned
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Tracking Tab */}
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

          {/* On-Call Tab */}
          <TabsContent value="oncall" className="mt-6">
            <OnCallScheduleManager
              schedules={schedules}
              teamMembers={teamMembers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
