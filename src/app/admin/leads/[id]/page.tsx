import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLeadById } from '@/app/actions/leads'
import { getLeadActivities } from '@/app/actions/activities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatusUpdateSelect } from '@/components/admin/status-update-select'
import { ActivityTimeline } from '@/components/admin/activity-timeline'
import { AddActivityForm } from '@/components/admin/add-activity-form'
import { formatDistanceToNow, format } from 'date-fns'

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

  // Fetch lead
  const leadResult = await getLeadById(id)

  if (!leadResult.success || !leadResult.lead) {
    notFound()
  }

  const lead = leadResult.lead

  // Fetch activities
  const activitiesResult = await getLeadActivities(id)
  const activities = activitiesResult.success
    ? activitiesResult.activities || []
    : []

  const sourceLabels = {
    contact_form: 'Contact Form',
    newsletter: 'Newsletter',
    manual: 'Manual Entry',
  }

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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Lead Information */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {lead.email}
                  </a>
                </div>

                {lead.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone
                    </p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                )}

                {lead.due_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Due Date
                    </p>
                    <p className="text-sm">
                      {format(new Date(lead.due_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}

                {lead.service_interest && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Service Interest
                    </p>
                    <p className="text-sm">{lead.service_interest}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={lead.status} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email Domain
                  </p>
                  <p className="text-sm">{lead.email_domain || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Original Message */}
            {lead.message && (
              <Card>
                <CardHeader>
                  <CardTitle>Original Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <a href={`mailto:${lead.email}`}>📧 Send Email</a>
                </Button>
                {lead.phone && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${lead.phone}`}>📞 Call</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="space-y-6">
            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={activities} />
              </CardContent>
            </Card>

            {/* Add Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Add Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <AddActivityForm leadId={lead.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
