import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllContractTemplates } from '@/app/actions/setup'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ChevronLeft, Plus, CheckCircle, XCircle } from 'lucide-react'
import { ContractTemplatesTable } from './contract-templates-table'

export default async function ContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const templatesResult = await getAllContractTemplates()
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
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Contract Templates
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {templates.length} template
                    {templates.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
              </div>
            </div>
            <Link href="/admin/setup/contracts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </Link>
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
                Active Templates
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTemplates.length}</div>
              <p className="text-xs text-muted-foreground">Available for use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Templates
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
              <CardTitle className="text-sm font-medium">
                Total Templates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                All contract templates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Contract Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Contract templates are used for client service agreements. Each
              template can be associated with a specific service type and marked
              as the default for that service. When a client signs a contract, a
              snapshot of the template content is stored, ensuring the signed
              version is preserved even if the template is later modified.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Service Type Legend */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Service types:</span>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
          >
            Birth Doula
          </Badge>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
          >
            Postpartum Doula
          </Badge>
          <Badge
            variant="outline"
            className="bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300"
          >
            Lactation Consulting
          </Badge>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          >
            Childbirth Education
          </Badge>
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
          >
            General
          </Badge>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ContractTemplatesTable templates={templates} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
