import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSmsTemplates } from '@/app/actions/setup'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  MessageSquare,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { SmsTemplateDialog } from '@/components/admin/setup/sms-template-dialog'
import { SmsTemplateActions } from '@/components/admin/setup/sms-template-actions'
import { SMS_CATEGORY_LABELS, SMS_CATEGORY_COLORS } from '@/lib/sms/templates'
import { calculateSegments } from '@/lib/sms/utils'

export default async function SmsTemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getSmsTemplates()
  const templates = result.success ? result.templates || [] : []

  const activeCount = templates.filter(t => t.is_active).length
  const categories = [...new Set(templates.map(t => t.category))].sort()

  // Calculate total segments for stats
  const templateStats = templates.map(t => ({
    ...t,
    stats: calculateSegments(t.content),
  }))
  const multiSegmentCount = templateStats.filter(
    t => t.stats.segments > 1
  ).length

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
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    SMS Templates
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {templates.length} template
                    {templates.length !== 1 ? 's' : ''} ({activeCount} active)
                  </p>
                </div>
              </div>
            </div>
            <SmsTemplateDialog mode="create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </SmsTemplateDialog>
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
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{multiSegmentCount}</span>
                {multiSegmentCount > 0 && (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Multi-segment</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 pt-6">
            <MessageSquare className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">SMS Infrastructure (Stubbed)</p>
              <p className="text-blue-600 dark:text-blue-400">
                SMS sending is currently stubbed for development. When ready to
                go live, add Twilio credentials to environment variables.
                Templates created here will work automatically once the
                integration is enabled.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates by Category */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">No templates yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create your first SMS template to get started.
              </p>
              <SmsTemplateDialog mode="create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </SmsTemplateDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryTemplates = templateStats.filter(
                t => t.category === category
              )
              return (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {SMS_CATEGORY_LABELS[
                        category as keyof typeof SMS_CATEGORY_LABELS
                      ] || category}
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
                                className={`text-xs ${SMS_CATEGORY_COLORS[template.category as keyof typeof SMS_CATEGORY_COLORS] || SMS_CATEGORY_COLORS.general}`}
                              >
                                {SMS_CATEGORY_LABELS[
                                  template.category as keyof typeof SMS_CATEGORY_LABELS
                                ] || template.category}
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

                          <div className="mb-3 rounded-md bg-muted/50 p-2">
                            <p className="text-sm line-clamp-3 font-mono text-muted-foreground">
                              {template.content}
                            </p>
                          </div>

                          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{template.stats.charCount} chars</span>
                            <span
                              className={
                                template.stats.segments > 1
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : ''
                              }
                            >
                              {template.stats.segments} segment
                              {template.stats.segments !== 1 ? 's' : ''}
                            </span>
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

                          <SmsTemplateActions template={template} />
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
