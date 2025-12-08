import { getClientSession } from '@/app/actions/client-auth'
import { getClientServices } from '@/app/actions/services'
import { getClientMeetings } from '@/app/actions/meetings'
import { getClientVisibleDocuments } from '@/app/actions/documents'
import { getClientPaymentSummary } from '@/app/actions/payments'
import { getClientCareTeam } from '@/app/actions/team'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CareTeam } from '@/components/client/care-team'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function ClientDashboardPage() {
  const session = await getClientSession()

  if (!session) {
    return null // Layout will redirect
  }

  // Fetch all dashboard data in parallel
  const [
    servicesResult,
    meetingsResult,
    documentsResult,
    paymentSummaryResult,
    careTeamResult,
  ] = await Promise.all([
    getClientServices(session.clientId).catch(() => null),
    getClientMeetings(session.clientId).catch(() => null),
    getClientVisibleDocuments(session.clientId).catch(() => null),
    getClientPaymentSummary(session.clientId).catch(() => null),
    getClientCareTeam(session.clientId).catch(() => null),
  ])

  // Ensure we have arrays (handle null/undefined/errors)
  const services = Array.isArray(servicesResult) ? servicesResult : []
  const meetings = Array.isArray(meetingsResult) ? meetingsResult : []
  const documents = Array.isArray(documentsResult) ? documentsResult : []

  // Ensure paymentSummary has all required properties with defaults
  const paymentSummary =
    paymentSummaryResult && 'summary' in paymentSummaryResult
      ? paymentSummaryResult.summary
      : {
          total: 0,
          paid: 0,
          pending: 0,
          outstanding: 0,
        }

  // Filter upcoming meetings
  const upcomingMeetings = meetings
    .filter(
      m => m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
    .slice(0, 3)

  // Get active services
  const activeServices = services.filter(s => s.status === 'active')

  // Get recent documents
  const recentDocuments = documents
    .sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
    .slice(0, 3)

  // Extract care team
  const careTeam =
    careTeamResult && 'data' in careTeamResult ? careTeamResult.data || [] : []

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s what&apos;s happening with your doula care
        </p>
      </div>

      {/* Due Date Card (if expecting) */}
      {session.expectedDueDate && !session.actualBirthDate && (
        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/30">
          <CardHeader>
            <CardTitle className="text-foreground">Your Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Expected Due Date:{' '}
              <span className="font-semibold text-foreground">
                {format(new Date(session.expectedDueDate), 'MMMM d, yyyy')}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Birth Announcement (if baby arrived) */}
      {session.actualBirthDate && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-foreground">Congratulations!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Birth Date:{' '}
              <span className="font-semibold text-foreground">
                {format(new Date(session.actualBirthDate), 'MMMM d, yyyy')}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Care Team */}
      <CareTeam careTeam={careTeam} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${paymentSummary.outstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming meetings
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {meeting.meeting_type
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(meeting.scheduled_at),
                          'MMM d, yyyy • h:mm a'
                        )}
                      </p>
                      {meeting.location && (
                        <p className="text-sm text-muted-foreground">
                          {meeting.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Link
                  href="/client/meetings"
                  className="text-sm text-primary hover:underline block"
                >
                  View all meetings →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>Active care packages</CardDescription>
          </CardHeader>
          <CardContent>
            {activeServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active services
              </p>
            ) : (
              <div className="space-y-3">
                {activeServices.map(service => (
                  <div key={service.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-foreground">
                      {service.service_type
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    {service.package_name && (
                      <p className="text-sm text-muted-foreground">
                        {service.package_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                        Active
                      </span>
                      {service.contract_signed && (
                        <span className="text-xs text-primary">
                          ✓ Contract Signed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <Link
                  href="/client/services"
                  className="text-sm text-primary hover:underline block"
                >
                  View all services →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your latest files and resources</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents available
              </p>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.document_type
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                    <Link
                      href={doc.file_url}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      Download
                    </Link>
                  </div>
                ))}
                <Link
                  href="/client/documents"
                  className="text-sm text-primary hover:underline block"
                >
                  View all documents →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Your account balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <span className="font-semibold">
                  ${paymentSummary.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid</span>
                <span className="font-semibold text-primary">
                  ${paymentSummary.paid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-semibold text-secondary">
                  ${paymentSummary.pending.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium">Outstanding Balance</span>
                <span className="text-xl font-bold text-secondary">
                  ${paymentSummary.outstanding.toLocaleString()}
                </span>
              </div>
              <Link
                href="/client/payments"
                className="text-sm text-primary hover:underline block"
              >
                View payment history →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
