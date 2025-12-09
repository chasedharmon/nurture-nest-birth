import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getEmailTemplates } from '@/app/actions/setup'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Mail, Plus, Eye, EyeOff } from 'lucide-react'
import { EmailTemplateDialog } from '@/components/admin/setup/email-template-dialog'
import { EmailTemplateActions } from '@/components/admin/setup/email-template-actions'

const categoryLabels: Record<string, string> = {
  inquiry: 'Inquiry',
  booking: 'Booking',
  reminder: 'Reminder',
  follow_up: 'Follow-up',
  payment: 'Payment',
  document: 'Document',
  general: 'General',
}

const categoryColors: Record<string, string> = {
  inquiry: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  booking:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  reminder:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  follow_up:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  payment:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  document: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default async function EmailTemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getEmailTemplates()
  const templates = result.success ? result.templates || [] : []

  const activeCount = templates.filter(t => t.is_active).length
  const categories = [...new Set(templates.map(t => t.category))].sort()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Email Templates
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {templates.length} template
                    {templates.length !== 1 ? 's' : ''} ({activeCount} active)
                  </p>
                </div>
              </div>
            </div>
            <EmailTemplateDialog mode="create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </EmailTemplateDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-sm text-muted-foreground">Total Templates</p>
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
              <div className="text-2xl font-bold">
                {templates.length - activeCount}
              </div>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Templates by Category */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">No templates yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create your first email template to get started.
              </p>
              <EmailTemplateDialog mode="create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </EmailTemplateDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryTemplates = templates.filter(
                t => t.category === category
              )
              return (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {categoryLabels[category] || category}
                    </h2>
                    <Badge variant="secondary">
                      {categoryTemplates.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTemplates.map(template => (
                      <Card
                        key={template.id}
                        className={`transition-opacity ${!template.is_active ? 'opacity-60' : ''}`}
                      >
                        <CardContent className="pt-6">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <h3 className="font-medium">{template.name}</h3>
                                {template.is_default && (
                                  <Badge variant="outline" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <Badge
                                className={`text-xs ${categoryColors[template.category] || categoryColors.general}`}
                              >
                                {categoryLabels[template.category] ||
                                  template.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {template.is_active ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {template.description && (
                            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          )}

                          <div className="mb-4">
                            <p className="text-sm font-medium text-muted-foreground">
                              Subject:
                            </p>
                            <p className="text-sm line-clamp-1">
                              {template.subject}
                            </p>
                          </div>

                          {template.available_variables.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-1">
                              {template.available_variables
                                .slice(0, 3)
                                .map(variable => (
                                  <Badge
                                    key={variable}
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {`{{${variable}}}`}
                                  </Badge>
                                ))}
                              {template.available_variables.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.available_variables.length - 3}{' '}
                                  more
                                </Badge>
                              )}
                            </div>
                          )}

                          <EmailTemplateActions template={template} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
