import {
  getClientSession,
  getClientAccessLevel,
} from '@/app/actions/client-auth'
import {
  getPortalDashboardData,
  getPortalInvoices,
} from '@/app/actions/portal-crm-data'
import { getClientVisibleDocuments } from '@/app/actions/documents'
import { getClientCareTeam } from '@/app/actions/team'
import type {
  ClientJourneyMilestone,
  ClientActionItem,
  Meeting,
} from '@/lib/supabase/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CareTeam } from '@/components/client/care-team'
import { JourneyTimeline } from '@/components/client/journey-timeline'
import { ActionItems } from '@/components/client/action-items'
import { NextAppointmentCard } from '@/components/client/next-appointment-card'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  FileText,
  DollarSign,
  Calendar,
  Baby,
  CreditCard,
  Clock,
  Briefcase,
  User,
} from 'lucide-react'
import type { JourneyPhase } from '@/lib/supabase/types'

export default async function ClientDashboardPage() {
  const session = await getClientSession()

  if (!session) {
    return null // Layout will redirect
  }

  const accessLevel = await getClientAccessLevel()
  const isFullAccess = accessLevel === 'full'

  // Fetch dashboard data from CRM
  const dashboardResult = await getPortalDashboardData()

  if (!dashboardResult.data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">
            Unable to load dashboard data.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboardResult.error}
          </p>
        </div>
      </div>
    )
  }

  const { profile, services, upcomingMeetings, tasks, milestones } =
    dashboardResult.data

  // Fetch additional data in parallel (legacy services that still exist)
  const [documentsResult, careTeamResult, invoicesResult] = await Promise.all([
    getClientVisibleDocuments(session.id).catch(() => null),
    getClientCareTeam(session.id).catch(() => null),
    isFullAccess
      ? getPortalInvoices().catch(() => null)
      : Promise.resolve(null),
  ])

  // Extract documents
  const documents =
    documentsResult && 'documents' in documentsResult
      ? documentsResult.documents || []
      : []

  // Care team
  const careTeam =
    careTeamResult && 'data' in careTeamResult ? careTeamResult.data || [] : []

  // Invoices for payment summary
  const invoices = invoicesResult?.data || []
  const paymentSummary = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0),
    outstanding: invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
  }

  // Recent documents
  const recentDocuments = documents
    .sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
    .slice(0, 3)

  // Map tasks to action items format
  const actionItems = tasks.map(task => ({
    id: task.id,
    title: task.subject,
    description: task.description,
    status: task.status === 'completed' ? 'completed' : 'pending',
    priority: task.priority,
    due_date: task.dueDate,
  }))

  // Map milestones for journey timeline
  const journeyMilestones = milestones.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    completedAt: m.completedAt,
    dueDate: m.dueDate,
    status: m.completedAt ? 'completed' : 'pending',
  }))

  // Determine current phase based on profile and services
  const currentPhase: JourneyPhase = determineCurrentPhase(
    profile,
    services.length
  )

  // Get primary doula name from care team
  const primaryDoula = careTeam.find(
    member => member.assignment_role === 'primary'
  )

  // Get active services
  const activeServices = services.filter(s => s.isActive)

  // Calculate days until due date
  const daysUntilDue = profile.expectedDueDate
    ? Math.ceil(
        (new Date(profile.expectedDueDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  // Next meeting for appointment card
  const nextMeeting = upcomingMeetings[0] || null

  return (
    <div className="space-y-6">
      {/* Welcome Header with Quick Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back, {profile.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile.recordType === 'lead' ? (
              <>
                <Badge variant="secondary" className="mr-2">
                  Prospective Client
                </Badge>
                We&apos;re excited to get to know you
              </>
            ) : currentPhase === 'consultation' ? (
              'Getting to know each other'
            ) : currentPhase === 'prenatal' ? (
              'Preparing for your birth'
            ) : currentPhase === 'birth' ? (
              'Your journey continues'
            ) : (
              'Supporting your postpartum'
            )}
          </p>
        </div>

        {/* Quick status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {profile.expectedDueDate &&
            !profile.actualBirthDate &&
            daysUntilDue && (
              <Badge
                variant={daysUntilDue <= 14 ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                <Baby className="mr-1 h-3 w-3" />
                {daysUntilDue <= 0
                  ? 'Due any day!'
                  : daysUntilDue === 1
                    ? '1 day until due date'
                    : `${daysUntilDue} days until due date`}
              </Badge>
            )}
          {isFullAccess && paymentSummary.outstanding > 0 && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <DollarSign className="mr-1 h-3 w-3" />$
              {paymentSummary.outstanding.toLocaleString()} due
            </Badge>
          )}
        </div>
      </div>

      {/* Limited Access Banner for Leads */}
      {profile.recordType === 'lead' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  Welcome to Your Client Portal
                </p>
                <p className="text-sm text-muted-foreground">
                  You currently have limited access. Once you become a client,
                  you&apos;ll have access to services, meetings, invoices, and
                  more.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey Timeline (contacts only) */}
      {isFullAccess && (
        <JourneyTimeline
          currentPhase={currentPhase}
          milestones={journeyMilestones as unknown as ClientJourneyMilestone[]}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Next Appointment & Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Appointment */}
          {isFullAccess && nextMeeting ? (
            <NextAppointmentCard
              meeting={
                {
                  id: nextMeeting.id,
                  meeting_type: nextMeeting.activityType,
                  scheduled_at:
                    nextMeeting.dueDateTime || nextMeeting.dueDate || '',
                  status:
                    nextMeeting.status === 'open'
                      ? 'scheduled'
                      : nextMeeting.status,
                  location: nextMeeting.location,
                  meeting_link: nextMeeting.meetingLink,
                  notes: nextMeeting.description,
                } as unknown as Meeting
              }
              providerName={primaryDoula?.provider?.display_name || undefined}
            />
          ) : isFullAccess ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming appointments scheduled
                </p>
                <Link href="/client/meetings">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Meetings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Thank you for your interest! Our team will be in touch soon to
                  discuss your needs and schedule a consultation.
                </p>
                {profile.message && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Your message:
                    </p>
                    <p className="text-sm">{profile.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Items (contacts only) */}
          {isFullAccess && (
            <ActionItems items={actionItems as unknown as ClientActionItem[]} />
          )}

          {/* Lead Profile Summary */}
          {!isFullAccess && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{profile.email}</p>
                  </div>
                  {profile.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{profile.phone}</p>
                    </div>
                  )}
                  {profile.expectedDueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Expected Due Date
                      </p>
                      <p className="text-sm font-medium">
                        {format(
                          new Date(profile.expectedDueDate),
                          'MMMM d, yyyy'
                        )}
                      </p>
                    </div>
                  )}
                  {profile.serviceInterest && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Service Interest
                      </p>
                      <p className="text-sm font-medium">
                        {profile.serviceInterest
                          .split('_')
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                      </p>
                    </div>
                  )}
                </div>
                <Link href="/client/profile" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Care Team & Payment */}
        <div className="space-y-6">
          {/* Care Team (contacts only) */}
          {isFullAccess && <CareTeam careTeam={careTeam} />}

          {/* Payment Summary (contacts only) */}
          {isFullAccess && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="font-medium">
                    ${paymentSummary.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${paymentSummary.paid.toLocaleString()}
                  </span>
                </div>
                {paymentSummary.outstanding > 0 && (
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-medium">Balance Due</span>
                    <span className="text-lg font-bold text-primary">
                      ${paymentSummary.outstanding.toLocaleString()}
                    </span>
                  </div>
                )}
                <Link href="/client/payments" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Payment History
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Status Card for Leads */}
          {!isFullAccess && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Your Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Badge variant="secondary" className="mb-2">
                    {profile.leadStatus
                      ?.split('_')
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(' ') || 'New Inquiry'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Our team is reviewing your inquiry and will reach out soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Section - Services, Documents, Upcoming Meetings (contacts only) */}
      {isFullAccess && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Your Services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Services</CardTitle>
              <CardDescription>{activeServices.length} active</CardDescription>
            </CardHeader>
            <CardContent>
              {activeServices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No active services
                </p>
              ) : (
                <div className="space-y-3">
                  {activeServices.slice(0, 2).map(service => (
                    <div
                      key={service.id}
                      className="p-3 rounded-lg bg-muted/50"
                    >
                      <p className="font-medium text-sm">{service.name}</p>
                      {service.serviceType && (
                        <p className="text-xs text-muted-foreground">
                          {service.serviceType
                            .split('_')
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default" className="text-xs">
                          {service.stageDisplay}
                        </Badge>
                        {service.amount && (
                          <span className="text-xs text-muted-foreground">
                            ${service.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeServices.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{activeServices.length - 2} more
                    </p>
                  )}
                </div>
              )}
              <Link href="/client/services" className="block pt-3">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Services
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </CardTitle>
              <CardDescription>{documents.length} available</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No documents yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentDocuments.map(doc => (
                    <Link
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type
                            .split('_')
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        View
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/client/documents" className="block pt-3">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Meetings
              </CardTitle>
              <CardDescription>
                {upcomingMeetings.length} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No upcoming meetings
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingMeetings.slice(0, 3).map(meeting => (
                    <div
                      key={meeting.id}
                      className="p-2 rounded-md bg-muted/50"
                    >
                      <p className="text-sm font-medium">{meeting.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.dueDateTime
                          ? format(
                              new Date(meeting.dueDateTime),
                              'MMM d, yyyy • h:mm a'
                            )
                          : meeting.dueDate
                            ? format(new Date(meeting.dueDate), 'MMM d, yyyy')
                            : 'TBD'}
                      </p>
                      {meeting.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {meeting.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link href="/client/meetings" className="block pt-3">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Meetings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Overview (contacts with progress) */}
      {isFullAccess &&
        (actionItems.length > 0 || journeyMilestones.length > 0) && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {actionItems.length > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        Action Items
                      </span>
                      <span className="font-medium">
                        {
                          actionItems.filter(i => i.status === 'completed')
                            .length
                        }{' '}
                        / {actionItems.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(actionItems.filter(i => i.status === 'completed').length / actionItems.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {journeyMilestones.length > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        Journey Milestones
                      </span>
                      <span className="font-medium">
                        {journeyMilestones.filter(m => m.completedAt).length} /{' '}
                        {journeyMilestones.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary transition-all"
                        style={{
                          width: `${(journeyMilestones.filter(m => m.completedAt).length / journeyMilestones.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

/**
 * Determine the current journey phase based on profile data and services
 */
function determineCurrentPhase(
  profile: { actualBirthDate?: string | null; recordType: string },
  serviceCount: number
): JourneyPhase {
  if (profile.actualBirthDate) {
    return 'postpartum'
  }
  if (serviceCount > 0) {
    return 'prenatal'
  }
  if (profile.recordType === 'contact') {
    return 'consultation'
  }
  return 'consultation'
}
