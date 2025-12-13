import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getObjectDefinitions } from '@/app/actions/object-definitions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  ChevronLeft,
  ChevronRight,
  Lock,
  User,
  Building2,
  Target,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react'
import { ObjectsPageClient } from './objects-page-client'

const objectIcons: Record<string, React.ReactNode> = {
  Contact: <User className="h-5 w-5" />,
  Account: <Building2 className="h-5 w-5" />,
  Lead: <Target className="h-5 w-5" />,
  Opportunity: <TrendingUp className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
}

export default async function ObjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: objects, error } = await getObjectDefinitions()

  if (error) {
    console.error('Error fetching objects:', error)
  }

  const standardObjects = objects?.filter(o => o.is_standard) || []
  const customObjects = objects?.filter(o => o.is_custom) || []

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
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Object Manager
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {objects?.length || 0} object
                    {objects?.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
              </div>
            </div>
            <ObjectsPageClient />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Standard Objects
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{standardObjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Built-in CRM objects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custom Objects
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customObjects.length}</div>
              <p className="text-xs text-muted-foreground">
                User-defined objects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Objects
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Available for data storage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About CRM Objects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Objects are the building blocks of your CRM. Standard objects
              (Contact, Account, Lead, Opportunity, Activity) provide core CRM
              functionality. You can add custom fields to any object to capture
              additional data specific to your business needs.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Standard Objects */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Standard Objects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {standardObjects.map(obj => (
              <Link key={obj.id} href={`/admin/setup/objects/${obj.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="rounded-md p-2"
                        style={{ backgroundColor: `${obj.color}20` }}
                      >
                        <div style={{ color: obj.color }}>
                          {objectIcons[obj.api_name] || (
                            <Database className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Standard
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {obj.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {obj.description || `Manage ${obj.plural_label}`}
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {obj.has_activities && (
                        <Badge variant="outline" className="text-xs">
                          Activities
                        </Badge>
                      )}
                      {obj.has_record_types && (
                        <Badge variant="outline" className="text-xs">
                          Record Types
                        </Badge>
                      )}
                      {obj.has_notes && (
                        <Badge variant="outline" className="text-xs">
                          Notes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Custom Objects */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Custom Objects
          </h2>
          {customObjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 font-medium text-foreground">
                  No Custom Objects Yet
                </h3>
                <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
                  Custom objects allow you to store data unique to your
                  business. This feature is coming soon.
                </p>
                <ObjectsPageClient variant="outline" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customObjects.map(obj => (
                <Link key={obj.id} href={`/admin/setup/objects/${obj.id}`}>
                  <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="rounded-md p-2"
                          style={{ backgroundColor: `${obj.color}20` }}
                        >
                          <div style={{ color: obj.color }}>
                            <Database className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs">Custom</Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-base">
                        {obj.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {obj.description || `Manage ${obj.plural_label}`}
                      </CardDescription>
                      <p className="mt-2 text-xs text-muted-foreground">
                        API Name: {obj.api_name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
