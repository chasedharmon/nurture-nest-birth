import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Webhook, Plus, AlertCircle } from 'lucide-react'
import { getWebhooks } from '@/app/actions/webhooks'
import { WebhooksTable } from './webhooks-table'
import { CreateWebhookDialog } from './create-webhook-dialog'

export const metadata = {
  title: 'Webhooks | Setup | Nurture Nest Birth',
  description: 'Configure outbound webhooks for real-time event notifications',
}

export default async function WebhooksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin permission
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = teamMember?.role === 'owner' || teamMember?.role === 'admin'

  if (!isAdmin) {
    redirect('/admin')
  }

  // Fetch webhooks
  const { webhooks = [] } = await getWebhooks()

  // Calculate stats
  const activeWebhooks = webhooks.filter(w => w.is_active).length
  const totalDeliveries = webhooks.reduce(
    (sum, w) => sum + w.total_deliveries,
    0
  )
  const successRate =
    totalDeliveries > 0
      ? Math.round(
          (webhooks.reduce((sum, w) => sum + w.successful_deliveries, 0) /
            totalDeliveries) *
            100
        )
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Webhook className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    Webhooks
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Configure outbound webhooks for real-time notifications
                  </p>
                </div>
              </div>
            </div>
            <CreateWebhookDialog>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Webhook
              </Button>
            </CreateWebhookDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              About Webhooks
            </p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Webhooks allow external applications to receive real-time
              notifications when events occur in your CRM. Each webhook includes
              a signature for security verification.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Webhooks</CardDescription>
              <CardTitle className="text-3xl">
                {activeWebhooks}/{webhooks.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Currently enabled webhooks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Deliveries</CardDescription>
              <CardTitle className="text-3xl">
                {totalDeliveries.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                All-time webhook deliveries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl">{successRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Successful deliveries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks Table */}
        {webhooks.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
              <CardDescription>
                Manage your webhook endpoints and view delivery history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhooksTable webhooks={webhooks} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4">
                <Webhook className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No webhooks configured</h3>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                Create your first webhook to start receiving real-time
                notifications when events occur in your CRM.
              </p>
              <CreateWebhookDialog>
                <Button className="mt-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Webhook
                </Button>
              </CreateWebhookDialog>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
