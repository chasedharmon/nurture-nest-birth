import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plug,
  ChevronLeft,
  CreditCard,
  Mail,
  Calendar,
  Database,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'connected' | 'not_configured' | 'error'
  envVar: string
  docsUrl?: string
}

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check which integrations are configured via env vars
  const integrations: Integration[] = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing for invoices and online payments',
      icon: <CreditCard className="h-6 w-6" />,
      status: process.env.STRIPE_SECRET_KEY ? 'connected' : 'not_configured',
      envVar: 'STRIPE_SECRET_KEY',
      docsUrl: 'https://stripe.com/docs',
    },
    {
      id: 'resend',
      name: 'Resend',
      description: 'Email delivery for notifications and client communications',
      icon: <Mail className="h-6 w-6" />,
      status: process.env.RESEND_API_KEY ? 'connected' : 'not_configured',
      envVar: 'RESEND_API_KEY',
      docsUrl: 'https://resend.com/docs',
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Database, authentication, and file storage',
      icon: <Database className="h-6 w-6" />,
      status: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'connected'
        : 'not_configured',
      envVar: 'NEXT_PUBLIC_SUPABASE_URL',
      docsUrl: 'https://supabase.com/docs',
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Appointment scheduling and calendar integration',
      icon: <Calendar className="h-6 w-6" />,
      status: 'not_configured',
      envVar: 'CALENDLY_API_KEY',
      docsUrl: 'https://developer.calendly.com/docs',
    },
  ]

  const connectedCount = integrations.filter(
    i => i.status === 'connected'
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/setup">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Setup
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Plug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  Integrations
                </h1>
                <p className="text-sm text-muted-foreground">
                  {connectedCount} of {integrations.length} connected
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Integrations connect your CRM with external services. Most
              integrations are configured through environment variables. Contact
              your administrator to update integration settings in your
              deployment environment.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map(integration => (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        integration.status === 'connected'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {integration.name}
                      </CardTitle>
                      <CardDescription>
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {integration.status === 'connected' ? (
                    <Badge className="bg-green-100 text-green-800 border-0 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Environment Variable
                    </span>
                    <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                      {integration.envVar}
                    </code>
                  </div>

                  {integration.status === 'connected' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Configuration detected
                    </div>
                  )}

                  {integration.status === 'not_configured' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      Set the environment variable to enable
                    </div>
                  )}

                  {integration.docsUrl && (
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Future Integrations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Coming Soon</CardTitle>
            <CardDescription>
              Additional integrations planned for future releases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Two-way sync</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Mailchimp</p>
                  <p className="text-xs text-muted-foreground">
                    Newsletter sync
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Plug className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Zapier</p>
                  <p className="text-xs text-muted-foreground">
                    Custom automations
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
