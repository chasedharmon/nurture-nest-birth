'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientDetailTabs } from '@/components/admin/client-detail-tabs'
import { ClientOverview } from '@/components/admin/client-overview'
import { ActivityTimeline } from '@/components/admin/activity-timeline'
import { AddActivityForm } from '@/components/admin/add-activity-form'
import { ServicesList } from '@/components/admin/services-list'
import { MeetingsList } from '@/components/admin/meetings-list'
import { DocumentsList } from '@/components/admin/documents-list'
import { PaymentsList } from '@/components/admin/payments-list'
import { InvoicesList } from '@/components/admin/invoices-list'
import { ContractsList } from '@/components/admin/contracts-list'
import { ClientTeamAssignments } from '@/components/admin/team'
import { LeadMessagesCard } from '@/components/admin/leads/lead-messages-card'
import { createConversation } from '@/app/actions/messaging'
import type {
  Lead,
  LeadActivity,
  ClientService,
  Meeting,
  ClientDocument,
  Payment,
  Invoice,
  ContractSignature,
  ClientAssignment,
  TeamMember,
} from '@/lib/supabase/types'
import type { Message, ConversationWithDetails } from '@/app/actions/messaging'

interface LeadDetailContentProps {
  lead: Lead
  activities: LeadActivity[]
  services: ClientService[]
  meetings: Meeting[]
  documents: ClientDocument[]
  payments: Payment[]
  invoices: Invoice[]
  contractSignatures: ContractSignature[]
  assignments: ClientAssignment[]
  teamMembers: TeamMember[]
  /** Client's conversation (if exists) */
  conversation?: ConversationWithDetails | null
  /** Recent messages from the conversation */
  recentMessages?: Message[]
}

export function LeadDetailContent({
  lead,
  activities,
  services,
  meetings,
  documents,
  payments,
  invoices,
  contractSignatures,
  assignments,
  teamMembers,
  conversation = null,
  recentMessages = [],
}: LeadDetailContentProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState('overview')
  const [, startTransition] = useTransition()

  const handleAssignClick = useCallback(() => {
    setCurrentTab('team')
  }, [])

  const handleStartConversation = useCallback(() => {
    startTransition(async () => {
      const result = await createConversation({
        clientId: lead.id,
        initialMessage: `Hello ${lead.name}! How can we help you today?`,
      })

      if (result.success && result.conversationId) {
        router.push(`/admin/messages/${result.conversationId}`)
      }
    })
  }, [lead.id, lead.name, router])

  const unreadMessages = conversation?.unread_count || 0

  return (
    <ClientDetailTabs
      defaultTab={currentTab}
      onTabChange={setCurrentTab}
      unreadMessages={unreadMessages}
      overviewTab={
        <ClientOverview
          lead={lead}
          assignments={assignments}
          onAssignClick={handleAssignClick}
        />
      }
      teamTab={
        <ClientTeamAssignments
          clientId={lead.id}
          assignments={assignments}
          availableMembers={teamMembers}
        />
      }
      messagesTab={
        <LeadMessagesCard
          clientId={lead.id}
          clientName={lead.name}
          conversation={conversation}
          recentMessages={recentMessages}
          onStartConversation={handleStartConversation}
        />
      }
      servicesTab={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services & Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicesList services={services} clientId={lead.id} />
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
              <MeetingsList meetings={meetings} clientId={lead.id} />
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
              <DocumentsList documents={documents} clientId={lead.id} />
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
                clientId={lead.id}
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
                clientId={lead.id}
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
                clientId={lead.id}
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
                Add private notes that are only visible to admin users. These
                notes will not be shown to the client.
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
  )
}
