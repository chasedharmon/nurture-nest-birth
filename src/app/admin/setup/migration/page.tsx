import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import {
  getMigrationStatus,
  getMigrationPreview,
} from '@/app/actions/lead-migration'
import { MigrationDashboard } from '@/components/admin/migration/migration-dashboard'

export default async function MigrationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch migration status and preview
  const [statusResult, previewResult] = await Promise.all([
    getMigrationStatus(),
    getMigrationPreview(),
  ])

  const status = statusResult.data
  const preview = previewResult.data

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
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    Data Migration
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Migrate legacy leads to the new CRM system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Migration Overview */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                About This Migration
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This tool migrates data from the legacy{' '}
                <code className="rounded bg-muted px-1">leads</code> table to
                the new CRM{' '}
                <code className="rounded bg-muted px-1">crm_leads</code> table.
                The migration:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Splits the <code className="rounded bg-muted px-1">
                    name
                  </code>{' '}
                  field into{' '}
                  <code className="rounded bg-muted px-1">first_name</code> and{' '}
                  <code className="rounded bg-muted px-1">last_name</code>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Maps status values (new, contacted, scheduled, client, lost)
                  to CRM statuses
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Preserves original timestamps and attribution data
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Stores extra fields in{' '}
                  <code className="rounded bg-muted px-1">
                    custom_fields
                  </code>{' '}
                  for reference
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        {status && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Legacy Leads
              </div>
              <div className="mt-1 text-3xl font-bold text-foreground">
                {status.totalLegacy}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Already Migrated
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {status.migrated}
                </span>
                {status.migrated > 0 && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Remaining
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {status.remaining}
                </span>
                {status.remaining > 0 && (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Migration Status Banner */}
        {status && status.remaining === 0 && status.migrated > 0 && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Migration Complete
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All {status.migrated} legacy leads have been migrated to the
                  CRM system.
                  {status.lastMigratedAt && (
                    <>
                      {' '}
                      Last migration:{' '}
                      {new Date(status.lastMigratedAt).toLocaleString()}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Component (Client) */}
        <MigrationDashboard initialStatus={status} initialPreview={preview} />

        {/* Post-Migration Notes */}
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
          <h3 className="font-semibold text-foreground">After Migration</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">1.</span>
              Verify the migration by checking sample records in{' '}
              <Link
                href="/admin/crm-leads"
                className="text-primary hover:underline"
              >
                CRM Leads
              </Link>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">2.</span>
              The legacy{' '}
              <code className="rounded bg-muted px-1">/admin/leads</code> page
              will continue to work for reference
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">3.</span>
              New leads should be created in the CRM system going forward
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">4.</span>
              Use the Lead Conversion wizard to convert qualified CRM leads to
              Contacts and Opportunities
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
