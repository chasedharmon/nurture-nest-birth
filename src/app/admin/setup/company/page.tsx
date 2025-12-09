import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanySettings } from '@/app/actions/setup'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ChevronLeft } from 'lucide-react'
import { CompanySettingsForm } from './company-settings-form'

export default async function CompanyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const settingsResult = await getCompanySettings()
  const settings = settingsResult.success ? settingsResult.settings : null

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
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  Company Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                  Business information and branding
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Company Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Configure your business information, contact details, and branding
              settings. This information appears on invoices, contracts, and
              throughout the client portal.
            </CardDescription>
          </CardContent>
        </Card>

        {settings ? (
          <CompanySettingsForm settings={settings} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Failed to load company settings. Please try refreshing the page.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
