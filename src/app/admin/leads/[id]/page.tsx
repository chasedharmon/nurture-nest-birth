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
import {
  getConversationForClient,
  getRecentMessagesForClient,
} from '@/app/actions/messaging'
import { Button } from '@/components/ui/button'
import { StatusUpdateSelect } from '@/components/admin/status-update-select'
import { LeadDetailContent } from '@/components/admin/lead-detail-content'
import { LoginAsClientButton } from '@/components/admin/login-as-client-button'
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
    conversationResult,
    messagesResult,
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
    getConversationForClient(id),
    getRecentMessagesForClient(id, 5),
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
  const conversation = conversationResult.success
    ? conversationResult.conversation
    : null
  const recentMessages = messagesResult.success
    ? messagesResult.messages || []
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
            <div className="flex items-center gap-2">
              <LoginAsClientButton
                clientId={lead.id}
                clientName={lead.name}
                clientEmail={lead.email}
              />
              <StatusUpdateSelect
                leadId={lead.id}
                currentStatus={lead.status}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LeadDetailContent
          lead={lead}
          activities={activities}
          services={services}
          meetings={meetings}
          documents={documents}
          payments={payments}
          invoices={invoices}
          contractSignatures={contractSignatures}
          assignments={assignments}
          teamMembers={teamMembers}
          conversation={conversation}
          recentMessages={recentMessages}
        />
      </main>
    </div>
  )
}
