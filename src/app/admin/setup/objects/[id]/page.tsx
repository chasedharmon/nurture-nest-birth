import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getObjectWithFields,
  getObjectsForLookup,
} from '@/app/actions/object-definitions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  ChevronLeft,
  Settings,
  List,
  Layout,
  Link2,
  Lock,
  User,
  Building2,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { FieldsManagement } from '@/components/admin/setup/fields-management'

interface PageProps {
  params: Promise<{ id: string }>
}

const objectIcons: Record<string, React.ReactNode> = {
  Contact: <User className="h-6 w-6" />,
  Account: <Building2 className="h-6 w-6" />,
  Lead: <Target className="h-6 w-6" />,
  Opportunity: <TrendingUp className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
}

export default async function ObjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [objectResult, relatedObjectsResult] = await Promise.all([
    getObjectWithFields(id),
    getObjectsForLookup(),
  ])

  const { data: objectData, error } = objectResult
  const { data: relatedObjects } = relatedObjectsResult

  if (error || !objectData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup/objects">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Objects
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${objectData.color}20` }}
                >
                  <div style={{ color: objectData.color }}>
                    {objectIcons[objectData.api_name] || (
                      <Database className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-xl font-bold text-foreground">
                      {objectData.label}
                    </h1>
                    {objectData.is_standard ? (
                      <Badge variant="secondary">Standard</Badge>
                    ) : (
                      <Badge>Custom</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {objectData.fields.length} field
                    {objectData.fields.length !== 1 ? 's' : ''} &bull; API:{' '}
                    {objectData.api_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="fields" className="space-y-6">
          <TabsList>
            <TabsTrigger value="fields" className="gap-2">
              <List className="h-4 w-4" />
              Fields
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="layouts" className="gap-2" disabled>
              <Layout className="h-4 w-4" />
              Page Layouts
            </TabsTrigger>
            <TabsTrigger value="relationships" className="gap-2" disabled>
              <Link2 className="h-4 w-4" />
              Relationships
            </TabsTrigger>
          </TabsList>

          {/* Fields Tab */}
          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Fields</CardTitle>
                <CardDescription>
                  Manage the fields that define what data is captured for{' '}
                  {objectData.plural_label}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldsManagement
                  fields={objectData.fields}
                  objectDefinition={objectData}
                  relatedObjects={relatedObjects || []}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Object Settings</CardTitle>
                <CardDescription>
                  Configure general settings for this object.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Label (Singular)
                      </label>
                      <p className="mt-1 font-medium">{objectData.label}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Label (Plural)
                      </label>
                      <p className="mt-1 font-medium">
                        {objectData.plural_label}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        API Name
                      </label>
                      <p className="mt-1 font-mono text-sm">
                        {objectData.api_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Table Name
                      </label>
                      <p className="mt-1 font-mono text-sm">
                        {objectData.table_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {objectData.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="mt-1">{objectData.description}</p>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Features
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          objectData.has_activities ? 'default' : 'outline'
                        }
                      >
                        Activities{' '}
                        {objectData.has_activities ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge
                        variant={
                          objectData.has_record_types ? 'default' : 'outline'
                        }
                      >
                        Record Types{' '}
                        {objectData.has_record_types ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge
                        variant={objectData.has_notes ? 'default' : 'outline'}
                      >
                        Notes {objectData.has_notes ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge
                        variant={
                          objectData.has_attachments ? 'default' : 'outline'
                        }
                      >
                        Attachments{' '}
                        {objectData.has_attachments ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  {/* Sharing Model */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sharing Model
                    </label>
                    <p className="mt-1 capitalize">
                      {objectData.sharing_model.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={objectData.is_active ? 'default' : 'secondary'}
                      >
                        {objectData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {objectData.is_standard && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">
                            This is a standard object. Settings cannot be
                            modified.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Layouts Tab (Placeholder) */}
          <TabsContent value="layouts">
            <Card>
              <CardHeader>
                <CardTitle>Page Layouts</CardTitle>
                <CardDescription>
                  Configure how fields are arranged on record pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Layout className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>Page Layout Editor coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab (Placeholder) */}
          <TabsContent value="relationships">
            <Card>
              <CardHeader>
                <CardTitle>Relationships</CardTitle>
                <CardDescription>
                  View and manage relationships with other objects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Link2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>Relationship viewer coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
