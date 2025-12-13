import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Users,
  Heart,
  Receipt,
  Calendar,
  Briefcase,
  ArrowLeft,
  Upload,
  History,
} from 'lucide-react'
import { getImportHistory } from '@/app/actions/import'

const IMPORT_OPTIONS = [
  {
    id: 'leads',
    label: 'Leads',
    description: 'Import potential clients and inquiries',
    icon: Users,
    href: '/admin/import/leads',
  },
  {
    id: 'clients',
    label: 'Clients',
    description: 'Import existing clients',
    icon: Heart,
    href: '/admin/import/clients',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    description: 'Import invoice records',
    icon: Receipt,
    href: '/admin/import/invoices',
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    description: 'Import meeting history',
    icon: Calendar,
    href: '/admin/import/meetings',
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Import client services',
    icon: Briefcase,
    href: '/admin/import/services',
    disabled: true,
    comingSoon: true,
  },
]

export default async function ImportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get recent imports
  const historyResult = await getImportHistory(5)
  const recentImports = historyResult.success ? historyResult.data : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Import Data
                </h1>
                <p className="text-sm text-muted-foreground">
                  Import data from CSV or Excel files
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Import Options */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">
              What would you like to import?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {IMPORT_OPTIONS.map(option => (
                <Card
                  key={option.id}
                  className={`relative transition-all ${
                    option.disabled
                      ? 'opacity-60'
                      : 'cursor-pointer hover:border-primary hover:shadow-md'
                  }`}
                >
                  {option.comingSoon && (
                    <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs">
                      Coming soon
                    </span>
                  )}
                  <Link
                    href={option.disabled ? '#' : option.href}
                    className={option.disabled ? 'pointer-events-none' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <option.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {option.label}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {option.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Migration Guide */}
            <Card className="mt-8 border-primary/20 bg-primary/5 p-6">
              <div className="flex gap-4">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Migrating from another platform?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We support imports from Dubsado, HoneyBook, and other CRMs.
                    Export your data as CSV from your current platform, then use
                    our import wizard to map your columns.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <li>• Auto-mapping recognizes common column names</li>
                    <li>• Save mapping templates for repeated imports</li>
                    <li>• Duplicate detection prevents creating duplicates</li>
                    <li>• Preview and validate before importing</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Imports Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Recent Imports
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                {recentImports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No imports yet. Import your first file to get started.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {recentImports.map(job => (
                      <li
                        key={job.id}
                        className="border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {job.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {job.objectType} •{' '}
                              {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                : job.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job.successfulRows} imported
                          {job.failedRows > 0 && `, ${job.failedRows} failed`}
                          {job.skippedRows > 0 &&
                            `, ${job.skippedRows} skipped`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
