import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowTemplates } from '@/app/actions/workflows'
import { Button } from '@/components/ui/button'
import { ChevronLeft, LayoutTemplate } from 'lucide-react'
import { TemplateGallery } from './template-gallery'

export default async function WorkflowTemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: templates, error } = await getWorkflowTemplates()

  if (error) {
    console.error('Failed to fetch templates:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/workflows">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Workflows
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    Workflow Templates
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Pre-built automations for your doula practice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Templates Gallery */}
      <main className="container mx-auto px-4 py-8">
        <TemplateGallery templates={templates || []} />
      </main>
    </div>
  )
}
