import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getContractTemplate } from '@/app/actions/contracts'
import { Button } from '@/components/ui/button'
import { FileText, ChevronLeft } from 'lucide-react'
import { ContractTemplateEditor } from '../contract-template-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditContractTemplatePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getContractTemplate(id)

  if (!result.success || !result.template) {
    notFound()
  }

  const template = result.template

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/setup/contracts">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Contract Templates
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  Edit Template
                </h1>
                <p className="text-sm text-muted-foreground">
                  {template.name} (v{template.version})
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ContractTemplateEditor template={template} />
      </main>
    </div>
  )
}
