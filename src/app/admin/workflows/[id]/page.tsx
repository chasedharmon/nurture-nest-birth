import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowWithSteps } from '@/app/actions/workflows'
import { getEmailTemplates } from '@/app/actions/setup'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Workflow,
  Settings,
  History,
  BarChart3,
} from 'lucide-react'
import { WorkflowBuilderClient } from './workflow-builder-client'
import { WorkflowToggleButton } from './workflow-toggle-button'
import { WorkflowManualTrigger } from './workflow-manual-trigger'
import type {
  WorkflowObjectType,
  WorkflowTriggerType,
} from '@/lib/workflows/types'

const objectTypeLabels: Record<WorkflowObjectType, string> = {
  lead: 'Lead / Client',
  meeting: 'Meeting',
  payment: 'Payment',
  invoice: 'Invoice',
  service: 'Service',
  document: 'Document',
  contract: 'Contract',
  intake_form: 'Intake Form',
}

const triggerTypeLabels: Record<WorkflowTriggerType, string> = {
  record_create: 'Record Created',
  record_update: 'Record Updated',
  field_change: 'Field Changed',
  scheduled: 'Scheduled',
  manual: 'Manual',
  form_submit: 'Form Submitted',
  payment_received: 'Payment Received',
}

interface WorkflowBuilderPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowBuilderPage({
  params,
}: WorkflowBuilderPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [workflowResult, templatesResult] = await Promise.all([
    getWorkflowWithSteps(id),
    getEmailTemplates(),
  ])

  if (workflowResult.error || !workflowResult.data) {
    notFound()
  }

  const workflow = workflowResult.data
  const emailTemplates = templatesResult.success
    ? (templatesResult.templates || []).map(t => ({ id: t.id, name: t.name }))
    : []

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/workflows">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Workflows
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    workflow.is_active
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-muted'
                  }`}
                >
                  <Workflow
                    className={`h-5 w-5 ${
                      workflow.is_active
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-foreground">
                      {workflow.name}
                    </h1>
                    {workflow.is_active ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {
                      objectTypeLabels[
                        workflow.object_type as WorkflowObjectType
                      ]
                    }{' '}
                    &middot;{' '}
                    {
                      triggerTypeLabels[
                        workflow.trigger_type as WorkflowTriggerType
                      ]
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <WorkflowManualTrigger
                workflowId={workflow.id}
                objectType={workflow.object_type as WorkflowObjectType}
                isActive={workflow.is_active}
              />
              <Link href={`/admin/workflows/${id}/analytics`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href={`/admin/workflows/${id}/history`}>
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  History
                </Button>
              </Link>
              <Link href={`/admin/workflows/${id}/settings`}>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <WorkflowToggleButton
                workflowId={workflow.id}
                isActive={workflow.is_active}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilderClient
          workflow={workflow}
          emailTemplates={emailTemplates}
        />
      </div>
    </div>
  )
}
