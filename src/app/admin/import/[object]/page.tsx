import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ImportWizard } from '@/components/admin/import'
import type { ImportObjectType } from '@/lib/import/types'

const VALID_OBJECT_TYPES: ImportObjectType[] = ['leads', 'clients']

const OBJECT_LABELS: Record<ImportObjectType, string> = {
  leads: 'Leads',
  clients: 'Clients',
  invoices: 'Invoices',
  meetings: 'Meetings',
  services: 'Services',
}

export default async function ImportObjectPage({
  params,
}: {
  params: Promise<{ object: string }>
}) {
  const { object } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validate object type
  if (!VALID_OBJECT_TYPES.includes(object as ImportObjectType)) {
    notFound()
  }

  const objectType = object as ImportObjectType
  const objectLabel = OBJECT_LABELS[objectType]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/import">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Import {objectLabel}
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload and import your {objectLabel.toLowerCase()} data
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ImportWizard objectType={objectType} />
      </main>
    </div>
  )
}
