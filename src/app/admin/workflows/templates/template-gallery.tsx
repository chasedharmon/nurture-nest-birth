'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail,
  Users,
  CreditCard,
  Calendar,
  FileSignature,
  Bell,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  GitBranch,
} from 'lucide-react'
import { createWorkflowFromTemplate } from '@/app/actions/workflows'
import type {
  WorkflowTemplate,
  WorkflowTemplateCategory,
} from '@/lib/workflows/types'

interface TemplateGalleryProps {
  templates: WorkflowTemplate[]
}

const CATEGORY_LABELS: Record<WorkflowTemplateCategory, string> = {
  onboarding: 'Onboarding',
  reminders: 'Reminders',
  follow_up: 'Follow-up',
  notifications: 'Notifications',
  billing: 'Billing',
  custom: 'Custom',
}

const CATEGORY_ICONS: Record<WorkflowTemplateCategory, React.ReactNode> = {
  onboarding: <Users className="h-4 w-4" />,
  reminders: <Bell className="h-4 w-4" />,
  follow_up: <Mail className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  billing: <CreditCard className="h-4 w-4" />,
  custom: <Calendar className="h-4 w-4" />,
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  mail: <Mail className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  'credit-card': <CreditCard className="h-5 w-5" />,
  calendar: <Calendar className="h-5 w-5" />,
  'file-signature': <FileSignature className="h-5 w-5" />,
  workflow: <GitBranch className="h-5 w-5" />,
}

const STEP_TYPE_LABELS: Record<string, string> = {
  trigger: 'Trigger',
  send_email: 'Send Email',
  send_sms: 'Send SMS',
  create_task: 'Create Task',
  update_field: 'Update Field',
  create_record: 'Create Record',
  wait: 'Wait',
  decision: 'Decision',
  send_message: 'Portal Message',
  webhook: 'Webhook',
  end: 'End',
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [customName, setCustomName] = useState('')

  const categories = Array.from(
    new Set(templates.map(t => t.category))
  ) as WorkflowTemplateCategory[]

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter(t => t.category === selectedCategory)

  const handlePreview = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
    setCustomName(template.name)
  }

  const handleInstall = async () => {
    if (!selectedTemplate) return

    setIsInstalling(true)
    try {
      const result = await createWorkflowFromTemplate(selectedTemplate.id)
      if (result.data) {
        router.push(`/admin/workflows/${result.data.id}`)
      }
    } finally {
      setIsInstalling(false)
    }
  }

  const getSteps = (template: WorkflowTemplate) => {
    const data = template.template_data as {
      steps?: Array<{ step_type: string; step_key: string }>
    }
    return data.steps || []
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              <span className="mr-1">{CATEGORY_ICONS[category]}</span>
              {CATEGORY_LABELS[category]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No templates available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handlePreview(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10 text-primary">
                      {TEMPLATE_ICONS[template.icon] || (
                        <GitBranch className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <span>{getSteps(template).length} steps</span>
                  <span>&middot;</span>
                  <span className="capitalize">
                    {template.object_type.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={open => !open && setSelectedTemplate(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedTemplate && (
                <div className="rounded-lg p-2 bg-primary/10 text-primary">
                  {TEMPLATE_ICONS[selectedTemplate.icon] || (
                    <GitBranch className="h-5 w-5" />
                  )}
                </div>
              )}
              <div>
                <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                <DialogDescription>
                  {selectedTemplate?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customize Name */}
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Enter a name for this workflow"
              />
            </div>

            {/* Steps Preview */}
            <div className="space-y-2">
              <Label>Workflow Steps</Label>
              <div className="rounded-lg border bg-muted/50 p-4">
                {selectedTemplate && (
                  <div className="space-y-2">
                    {getSteps(selectedTemplate).map((step, index) => (
                      <div
                        key={step.step_key}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          {step.step_type === 'trigger' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {step.step_type === 'wait' && (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          {step.step_type === 'decision' && (
                            <GitBranch className="h-4 w-4 text-blue-600" />
                          )}
                          {step.step_type === 'send_email' && (
                            <Mail className="h-4 w-4 text-purple-600" />
                          )}
                          {step.step_type === 'end' && (
                            <CheckCircle2 className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {STEP_TYPE_LABELS[step.step_type] || step.step_type}
                          </span>
                        </div>
                        {index < getSteps(selectedTemplate).length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Template Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Object Type</Label>
                <p className="capitalize">
                  {selectedTemplate?.object_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Trigger Type</Label>
                <p className="capitalize">
                  {selectedTemplate?.trigger_type.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTemplate(null)}
              disabled={isInstalling}
            >
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={isInstalling}>
              {isInstalling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Install Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
