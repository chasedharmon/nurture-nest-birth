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
import { Building2, ChevronLeft, Construction } from 'lucide-react'

export default async function CompanyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
              <Construction className="h-8 w-8" />
            </div>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Company profile configuration is under development.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              This feature will allow you to configure business information,
              logo, contact details, and branding settings that appear
              throughout the CRM and client portal.
            </p>
            <Badge variant="outline">Planned for Phase 7</Badge>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
