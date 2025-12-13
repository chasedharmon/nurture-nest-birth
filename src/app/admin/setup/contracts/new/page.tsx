import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { ContractTemplateEditor } from '../contract-template-editor'

export default async function NewContractTemplatePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground">
            New Contract Template
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new service agreement template
          </p>
        </div>
      </div>

      {/* Main Content */}
      <ContractTemplateEditor />
    </div>
  )
}
