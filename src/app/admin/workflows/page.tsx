import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getWorkflows,
  getWorkflowTemplates,
  createWorkflowFromTemplate,
} from '@/app/actions/workflows'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Workflow,
  Plus,
  Zap,
  Calendar,
  FileEdit,
  CreditCard,
  Users,
  FileText,
  LayoutTemplate,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WorkflowActions } from './workflow-actions'
import type {
  WorkflowObjectType,
  WorkflowTriggerType,
  WorkflowTemplateCategory,
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

const categoryIcons: Record<WorkflowTemplateCategory, React.ElementType> = {
  onboarding: Users,
  reminders: Calendar,
  follow_up: FileEdit,
  notifications: Zap,
  billing: CreditCard,
  custom: FileText,
}

export default async function WorkflowsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [workflowsResult, templatesResult] = await Promise.all([
    getWorkflows(),
    getWorkflowTemplates(),
  ])

  const workflows = workflowsResult.data || []
  const templates = templatesResult.data || []

  const activeCount = workflows.filter(w => w.is_active).length
  const totalExecutions = workflows.reduce(
    (sum, w) => sum + (w.execution_count || 0),
    0
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Workflow Automations
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {workflows.length} workflow
                    {workflows.length !== 1 ? 's' : ''} ({activeCount} active)
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/workflows/templates">
                <Button variant="outline">
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  Browse Templates
                </Button>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Start
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create from Template</DialogTitle>
                    <DialogDescription>
                      Choose a pre-built workflow template to get started
                      quickly
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                    {templates.map(template => {
                      const Icon = categoryIcons[template.category] || FileText
                      return (
                        <form
                          key={template.id}
                          action={async () => {
                            'use server'
                            const result = await createWorkflowFromTemplate(
                              template.id
                            )
                            if (result.data) {
                              redirect(`/admin/workflows/${result.data.id}`)
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-md bg-muted p-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {template.name}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {template.description}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {objectTypeLabels[template.object_type]}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {triggerTypeLabels[template.trigger_type]}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </button>
                        </form>
                      )
                    })}
                    {templates.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No templates available
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Link href="/admin/workflows/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Workflow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workflows.length}</div>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalExecutions}</div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-sm text-muted-foreground">
                Templates Available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workflows List */}
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Workflow className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No workflows yet</h3>
              <p className="text-muted-foreground text-center mt-1 max-w-sm">
                Create your first workflow to automate tasks like sending
                emails, creating action items, and more.
              </p>
              <div className="flex gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Zap className="mr-2 h-4 w-4" />
                      From Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create from Template</DialogTitle>
                      <DialogDescription>
                        Choose a pre-built workflow template
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                      {templates.map(template => {
                        const Icon =
                          categoryIcons[template.category] || FileText
                        return (
                          <form
                            key={template.id}
                            action={async () => {
                              'use server'
                              const result = await createWorkflowFromTemplate(
                                template.id
                              )
                              if (result.data) {
                                redirect(`/admin/workflows/${result.data.id}`)
                              }
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="rounded-md bg-muted p-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {template.name}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </form>
                        )
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
                <Link href="/admin/workflows/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workflows.map(workflow => (
              <Card
                key={workflow.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/workflows/${workflow.id}`}
                      className="flex-1 flex items-center gap-4"
                    >
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {workflow.name}
                          </span>
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
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {
                              objectTypeLabels[
                                workflow.object_type as WorkflowObjectType
                              ]
                            }
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {
                              triggerTypeLabels[
                                workflow.trigger_type as WorkflowTriggerType
                              ]
                            }
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {workflow.execution_count || 0} executions
                          </span>
                        </div>
                      </div>
                    </Link>
                    <WorkflowActions
                      workflowId={workflow.id}
                      isActive={workflow.is_active}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
