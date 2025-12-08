import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getIntakeFormTemplates } from '@/app/actions/setup'
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
  ClipboardList,
  ChevronLeft,
  Plus,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { IntakeFormsTable } from './intake-forms-table'

export default async function IntakeFormsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const templatesResult = await getIntakeFormTemplates()
  const templates = templatesResult.success
    ? templatesResult.templates || []
    : []

  const activeTemplates = templates.filter(t => t.is_active)
  const inactiveTemplates = templates.filter(t => !t.is_active)

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
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Intake Forms
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {templates.length} form{templates.length !== 1 ? 's' : ''}{' '}
                    configured
                  </p>
                </div>
              </div>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Form
              <Badge variant="outline" className="ml-2 text-xs">
                Coming Soon
              </Badge>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Forms
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTemplates.length}</div>
              <p className="text-xs text-muted-foreground">
                Available for clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Forms
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inactiveTemplates.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Archived or disabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">All intake forms</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Intake Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Intake forms are questionnaires that clients fill out during the
              onboarding process. Each form uses a JSON schema to define fields
              like text inputs, checkboxes, and dropdowns. Forms can be
              associated with specific service types to collect relevant
              information for each type of service.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Forms Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Intake Forms</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <IntakeFormsTable templates={templates} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
