import { getClientSession } from '@/app/actions/client-auth'
import { getClientServices } from '@/app/actions/services'
import { getClientMeetings } from '@/app/actions/meetings'
import { getClientVisibleDocuments } from '@/app/actions/documents'
import { getClientPaymentSummary } from '@/app/actions/payments'
import { getClientCareTeam } from '@/app/actions/team'
import {
  getClientJourneyData,
  updateLastPortalVisit,
} from '@/app/actions/client-journey'
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
import { FileText, DollarSign, Calendar, Baby, CreditCard } from 'lucide-react'
import type { JourneyPhase, Meeting } from '@/lib/supabase/types'

export default async function ClientDashboardPage() {
  const session = await getClientSession()

  if (!session) {
    return null // Layout will redirect
  }

  // Update last portal visit
  updateLastPortalVisit(session.clientId)

  // Fetch all dashboard data in parallel
  const [
    servicesResult,
    meetingsResult,
    documentsResult,
    paymentSummaryResult,
    careTeamResult,
    journeyResult,
  ] = await Promise.all([
    getClientServices(session.clientId).catch(() => null),
    getClientMeetings(session.clientId).catch(() => null),
    getClientVisibleDocuments(session.clientId).catch(() => null),
    getClientPaymentSummary(session.clientId).catch(() => null),
    getClientCareTeam(session.clientId).catch(() => null),
    getClientJourneyData(session.clientId).catch(() => null),
  ])

  // Extract data from server action results
  const services =
    servicesResult && 'services' in servicesResult
      ? servicesResult.services || []
      : []
  const meetings =
    meetingsResult && 'meetings' in meetingsResult
      ? meetingsResult.meetings || []
      : []
  const documents =
    documentsResult && 'documents' in documentsResult
      ? documentsResult.documents || []
      : []

  // Payment summary
  const paymentSummary =
    paymentSummaryResult && 'summary' in paymentSummaryResult
      ? paymentSummaryResult.summary
      : { total: 0, paid: 0, pending: 0, outstanding: 0 }

  // Care team
  const careTeam =
    careTeamResult && 'data' in careTeamResult ? careTeamResult.data || [] : []

  // Journey data
  const journeyData = journeyResult?.success ? journeyResult.data : null
  const actionItems = journeyData?.actionItems || []
  const milestones = journeyData?.milestones || []
  const currentPhase: JourneyPhase = journeyData?.currentPhase || 'consultation'
  const progress = journeyData?.progress || {
    actionItems: { total: 0, completed: 0, percentage: 0 },
    milestones: { total: 0, completed: 0, percentage: 0 },
  }

  // Get next upcoming meeting
  const upcomingMeetings = meetings
    .filter(
      m => m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )

  const nextMeeting: Meeting | null =
    upcomingMeetings.length > 0 ? (upcomingMeetings[0] ?? null) : null

  // Get primary doula name
  const primaryDoula = careTeam.find(
    member => member.assignment_role === 'primary'
  )

  // Get active services
  const activeServices = services.filter(s => s.status === 'active')

  // Recent documents
  const recentDocuments = documents
    .sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
    .slice(0, 3)

  // Calculate days until due date
  const daysUntilDue = session.expectedDueDate
    ? Math.ceil(
        (new Date(session.expectedDueDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <div className="space-y-6">
      {/* Welcome Header with Quick Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back, {session.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentPhase === 'consultation'
              ? 'Getting to know each other'
              : currentPhase === 'prenatal'
                ? 'Preparing for your birth'
                : currentPhase === 'birth'
                  ? 'Your journey continues'
                  : 'Supporting your postpartum'}
          </p>
        </div>

        {/* Quick status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {session.expectedDueDate &&
            !session.actualBirthDate &&
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
          {paymentSummary.outstanding > 0 && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <DollarSign className="mr-1 h-3 w-3" />$
              {paymentSummary.outstanding.toLocaleString()} due
            </Badge>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <JourneyTimeline currentPhase={currentPhase} milestones={milestones} />

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Next Appointment & Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Appointment */}
          <NextAppointmentCard
            meeting={nextMeeting}
            providerName={primaryDoula?.provider?.display_name || undefined}
          />

          {/* Action Items */}
          <ActionItems items={actionItems} />
        </div>

        {/* Right Column - Care Team & Payment */}
        <div className="space-y-6">
          {/* Care Team */}
          <CareTeam careTeam={careTeam} />

          {/* Payment Summary */}
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
        </div>
      </div>

      {/* Bottom Section - Services, Documents, Upcoming Meetings */}
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
                  <div key={service.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">
                      {service.service_type
                        .split('_')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')}
                    </p>
                    {service.package_name && (
                      <p className="text-xs text-muted-foreground">
                        {service.package_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                      {service.contract_signed && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Contract Signed
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
                  <div key={meeting.id} className="p-2 rounded-md bg-muted/50">
                    <p className="text-sm font-medium">
                      {meeting.meeting_type
                        .split('_')
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(meeting.scheduled_at),
                        'MMM d, yyyy • h:mm a'
                      )}
                    </p>
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

      {/* Progress Overview */}
      {(progress.actionItems.total > 0 || progress.milestones.total > 0) && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {progress.actionItems.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Action Items</span>
                    <span className="font-medium">
                      {progress.actionItems.completed} /{' '}
                      {progress.actionItems.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${progress.actionItems.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {progress.milestones.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Journey Milestones
                    </span>
                    <span className="font-medium">
                      {progress.milestones.completed} /{' '}
                      {progress.milestones.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{
                        width: `${progress.milestones.percentage}%`,
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
