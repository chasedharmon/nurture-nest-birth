import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkflow } from '@/app/actions/workflows'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Workflow } from 'lucide-react'
import { WorkflowSettingsForm } from './workflow-settings-form'
import type { WorkflowObjectType } from '@/lib/workflows/types'

interface WorkflowSettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowSettingsPage({
  params,
}: WorkflowSettingsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: workflow, error } = await getWorkflow(id)

  if (error || !workflow) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/admin/workflows/${id}`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Builder
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-muted">
                <Workflow className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  Workflow Settings
                </h1>
                <p className="text-sm text-muted-foreground">{workflow.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <WorkflowSettingsForm
          workflow={workflow}
          objectType={workflow.object_type as WorkflowObjectType}
        />
      </main>
    </div>
  )
}
