import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getServicePackages,
  getAllContractTemplates,
} from '@/app/actions/setup'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, ChevronLeft, CheckCircle, Star } from 'lucide-react'
import { ServicePackagesTable } from './service-packages-table'
import { CreateServicePackageDialog } from './create-service-package-dialog'

export default async function ServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [packagesResult, templatesResult] = await Promise.all([
    getServicePackages(),
    getAllContractTemplates(),
  ])

  const packages = packagesResult.success ? packagesResult.packages || [] : []
  const templates = templatesResult.success
    ? templatesResult.templates || []
    : []

  const activePackages = packages.filter(p => p.is_active)
  const featuredPackages = packages.filter(p => p.is_featured)

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
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Services & Packages
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {packages.length} package{packages.length !== 1 ? 's' : ''}{' '}
                    configured
                  </p>
                </div>
              </div>
            </div>
            <CreateServicePackageDialog contractTemplates={templates} />
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
                Active Packages
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePackages.length}</div>
              <p className="text-xs text-muted-foreground">
                Available to clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Featured Packages
              </CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {featuredPackages.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Highlighted services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Packages
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
              <p className="text-xs text-muted-foreground">
                All service packages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Service Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Service packages define the services you offer to clients. Each
              package includes a name, description, pricing, and can be linked
              to a contract template. When creating a new client service, you
              can select from these packages to streamline the process.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Packages Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Service Packages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ServicePackagesTable packages={packages} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
