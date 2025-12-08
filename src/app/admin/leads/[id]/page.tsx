import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLeadById } from '@/app/actions/leads'
import { getLeadActivities } from '@/app/actions/activities'
import { getClientServices } from '@/app/actions/services'
import { getClientMeetings } from '@/app/actions/meetings'
import { getClientDocuments } from '@/app/actions/documents'
import { getClientPayments } from '@/app/actions/payments'
import { getClientInvoices } from '@/app/actions/invoices'
import { getClientContractSignatures } from '@/app/actions/contracts'
import { getClientAssignments, getTeamMembers } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusUpdateSelect } from '@/components/admin/status-update-select'
import { ActivityTimeline } from '@/components/admin/activity-timeline'
import { AddActivityForm } from '@/components/admin/add-activity-form'
import { ClientDetailTabs } from '@/components/admin/client-detail-tabs'
import { ClientOverview } from '@/components/admin/client-overview'
import { ServicesList } from '@/components/admin/services-list'
import { MeetingsList } from '@/components/admin/meetings-list'
import { DocumentsList } from '@/components/admin/documents-list'
import { PaymentsList } from '@/components/admin/payments-list'
import { InvoicesList } from '@/components/admin/invoices-list'
import { ContractsList } from '@/components/admin/contracts-list'
import { ClientTeamAssignments } from '@/components/admin/team'
import { formatDistanceToNow } from 'date-fns'

const sourceLabels: Record<string, string> = {
  contact_form: 'Contact Form',
  newsletter: 'Newsletter',
  manual: 'Manual Entry',
}

export default async function LeadDetailPage({
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

  // Fetch all data in parallel
  const [
    leadResult,
    activitiesResult,
    servicesResult,
    meetingsResult,
    documentsResult,
    paymentsResult,
    invoicesResult,
    contractsResult,
    assignmentsResult,
    teamMembersResult,
  ] = await Promise.all([
    getLeadById(id),
    getLeadActivities(id),
    getClientServices(id),
    getClientMeetings(id),
    getClientDocuments(id),
    getClientPayments(id),
    getClientInvoices(id),
    getClientContractSignatures(id),
    getClientAssignments(id),
    getTeamMembers(),
  ])

  if (!leadResult.success || !leadResult.lead) {
    notFound()
  }

  const lead = leadResult.lead
  const activities = activitiesResult.success
    ? activitiesResult.activities || []
    : []
  const services = servicesResult.success ? servicesResult.services || [] : []
  const meetings = meetingsResult.success ? meetingsResult.meetings || [] : []
  const documents = documentsResult.success
    ? documentsResult.documents || []
    : []
  const payments = paymentsResult.success ? paymentsResult.payments || [] : []
  const invoices = invoicesResult.success ? invoicesResult.invoices || [] : []
  const contractSignatures = contractsResult.success
    ? contractsResult.signatures || []
    : []
  const assignments = assignmentsResult.success
    ? assignmentsResult.data || []
    : []
  const teamMembers = teamMembersResult.success
    ? teamMembersResult.data || []
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {lead.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {sourceLabels[lead.source]} •{' '}
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <StatusUpdateSelect leadId={lead.id} currentStatus={lead.status} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ClientDetailTabs
          overviewTab={<ClientOverview lead={lead} />}
          teamTab={
            <ClientTeamAssignments
              clientId={id}
              assignments={assignments}
              availableMembers={teamMembers}
            />
          }
          servicesTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Services & Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ServicesList services={services} clientId={id} />
                </CardContent>
              </Card>
            </div>
          }
          meetingsTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meetings & Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <MeetingsList meetings={meetings} clientId={id} />
                </CardContent>
              </Card>
            </div>
          }
          documentsTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentsList documents={documents} clientId={id} />
                </CardContent>
              </Card>
            </div>
          }
          paymentsTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payments & Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentsList
                    payments={payments}
                    clientId={id}
                    services={services}
                  />
                </CardContent>
              </Card>
            </div>
          }
          invoicesTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvoicesList
                    invoices={invoices}
                    clientId={id}
                    clientName={lead.name}
                    clientEmail={lead.email}
                    services={services}
                  />
                </CardContent>
              </Card>
            </div>
          }
          contractsTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContractsList
                    signatures={contractSignatures}
                    services={services}
                    clientId={id}
                    clientName={lead.name}
                    clientEmail={lead.email}
                  />
                </CardContent>
              </Card>
            </div>
          }
          activityTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline activities={activities} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddActivityForm leadId={lead.id} />
                </CardContent>
              </Card>
            </div>
          }
          notesTab={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add private notes that are only visible to admin users.
                    These notes will not be shown to the client.
                  </p>
                  <AddActivityForm leadId={lead.id} />

                  <div className="mt-6">
                    <ActivityTimeline
                      activities={activities.filter(
                        a => a.activity_type === 'note'
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        />
      </main>
    </div>
  )
}
