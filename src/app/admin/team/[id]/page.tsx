import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTeamMemberWithClients } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimeEntriesList } from '@/components/admin/team'
import {
  Users,
  Clock,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  Award,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  provider: 'Provider',
  assistant: 'Assistant',
}

const assignmentRoleLabels: Record<string, string> = {
  primary: 'Primary Provider',
  backup: 'Backup Provider',
  support: 'Support',
}

// Helper to get client from assignment (handles array from Supabase join)
function getClient(assignment: { client: unknown }) {
  const client = assignment.client
  if (Array.isArray(client)) {
    return client[0] || null
  }
  return client
}

// Helper to get service from assignment (handles array from Supabase join)
function getService(assignment: { service: unknown }) {
  const service = assignment.service
  if (Array.isArray(service)) {
    return service[0] || null
  }
  return service
}

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch team member data
  const result = await getTeamMemberWithClients(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const {
    member,
    clientAssignments,
    serviceAssignments,
    recentTimeEntries,
    hoursSummary,
  } = result.data

  // Group clients by assignment role
  const primaryClients = clientAssignments.filter(
    a => a.assignment_role === 'primary'
  )
  const backupClients = clientAssignments.filter(
    a => a.assignment_role === 'backup'
  )
  const supportClients = clientAssignments.filter(
    a => a.assignment_role === 'support'
  )

  // Calculate hours with proper property names from the summary
  const hoursThisMonth = hoursSummary?.totalHours ?? 0
  const billableHours = hoursSummary?.billableHours ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/team">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Team
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-lg">
                    {member.display_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    {member.display_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    {member.title && (
                      <span className="text-sm text-muted-foreground">
                        {member.title}
                      </span>
                    )}
                    <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                    {!member.is_active && (
                      <Badge variant="error">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientAssignments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {primaryClients.length} primary, {backupClients.length} backup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Services Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serviceAssignments.length}
              </div>
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
                {hoursThisMonth.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {billableHours.toFixed(1)}h billable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentTimeEntries.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recent entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        {(member.email || member.phone) && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </a>
                )}
              </div>
              {member.bio && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {member.bio}
                </p>
              )}
              {member.certifications && member.certifications.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {member.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {member.specialties && member.specialties.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {member.specialties.map((spec, i) => (
                      <Badge key={i} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for Clients, Services, Time */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList>
            <TabsTrigger value="clients">
              Assigned Clients ({clientAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="services">
              Services ({serviceAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="time">Recent Time Entries</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-6">
            {clientAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clients assigned to this team member
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Primary Clients */}
                {primaryClients.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge>Primary</Badge>
                        Primary Provider ({primaryClients.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">
                                Client
                              </th>
                              <th className="p-3 text-left font-medium">
                                Status
                              </th>
                              <th className="p-3 text-left font-medium">
                                Due Date
                              </th>
                              <th className="p-3 text-left font-medium">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {primaryClients.map(assignment => {
                              const client = getClient(assignment)
                              return (
                                <tr key={assignment.id} className="border-b">
                                  <td className="p-3">
                                    <Link
                                      href={`/admin/leads/${client?.id || ''}`}
                                      className="font-medium hover:underline"
                                    >
                                      {client?.name || 'Unknown'}
                                    </Link>
                                    {client?.email && (
                                      <p className="text-sm text-muted-foreground">
                                        {client.email}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline">
                                      {client?.status || '-'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {client?.expected_due_date
                                      ? new Date(
                                          client.expected_due_date
                                        ).toLocaleDateString()
                                      : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">
                                    {assignment.notes || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Backup Clients */}
                {backupClients.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary">Backup</Badge>
                        Backup Provider ({backupClients.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">
                                Client
                              </th>
                              <th className="p-3 text-left font-medium">
                                Status
                              </th>
                              <th className="p-3 text-left font-medium">
                                Due Date
                              </th>
                              <th className="p-3 text-left font-medium">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {backupClients.map(assignment => {
                              const client = getClient(assignment)
                              return (
                                <tr key={assignment.id} className="border-b">
                                  <td className="p-3">
                                    <Link
                                      href={`/admin/leads/${client?.id || ''}`}
                                      className="font-medium hover:underline"
                                    >
                                      {client?.name || 'Unknown'}
                                    </Link>
                                    {client?.email && (
                                      <p className="text-sm text-muted-foreground">
                                        {client.email}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline">
                                      {client?.status || '-'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {client?.expected_due_date
                                      ? new Date(
                                          client.expected_due_date
                                        ).toLocaleDateString()
                                      : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">
                                    {assignment.notes || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Support Clients */}
                {supportClients.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">Support</Badge>
                        Support Role ({supportClients.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">
                                Client
                              </th>
                              <th className="p-3 text-left font-medium">
                                Status
                              </th>
                              <th className="p-3 text-left font-medium">
                                Due Date
                              </th>
                              <th className="p-3 text-left font-medium">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {supportClients.map(assignment => {
                              const client = getClient(assignment)
                              return (
                                <tr key={assignment.id} className="border-b">
                                  <td className="p-3">
                                    <Link
                                      href={`/admin/leads/${client?.id || ''}`}
                                      className="font-medium hover:underline"
                                    >
                                      {client?.name || 'Unknown'}
                                    </Link>
                                    {client?.email && (
                                      <p className="text-sm text-muted-foreground">
                                        {client.email}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline">
                                      {client?.status || '-'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {client?.expected_due_date
                                      ? new Date(
                                          client.expected_due_date
                                        ).toLocaleDateString()
                                      : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">
                                    {assignment.notes || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Services</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceAssignments.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No services assigned to this team member
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">Service</th>
                          <th className="p-3 text-left font-medium">Client</th>
                          <th className="p-3 text-left font-medium">Role</th>
                          <th className="p-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceAssignments.map(assignment => {
                          const service = getService(assignment)
                          // Get client from nested service object
                          const serviceClient = service?.client
                          const clientData = Array.isArray(serviceClient)
                            ? serviceClient[0]
                            : serviceClient
                          return (
                            <tr key={assignment.id} className="border-b">
                              <td className="p-3">
                                <span className="font-medium">
                                  {service?.package_name ||
                                    service?.service_type ||
                                    'Unknown Service'}
                                </span>
                              </td>
                              <td className="p-3">
                                {clientData?.id ? (
                                  <Link
                                    href={`/admin/leads/${clientData.id}`}
                                    className="text-sm hover:underline"
                                  >
                                    {clientData.name || 'View Client'}
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    assignment.assignment_role === 'primary'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {assignmentRoleLabels[
                                    assignment.assignment_role
                                  ] || assignment.assignment_role}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">
                                  {service?.status || '-'}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Entries Tab */}
          <TabsContent value="time" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Time Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeEntriesList
                  entries={recentTimeEntries}
                  showMember={false}
                  showClient={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
