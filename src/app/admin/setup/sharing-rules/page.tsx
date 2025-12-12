import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRoles } from '@/app/actions/setup'
import { getCrmObjectsWithFieldCounts } from '@/app/actions/field-security'
import { getSharingRules } from '@/app/actions/sharing-rules'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Share2,
  ChevronLeft,
  Users,
  Database,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { SharingRulesManager } from './sharing-rules-manager'

export default async function SharingRulesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data in parallel
  const [rolesResult, objectsResult, rulesResult] = await Promise.all([
    getRoles(),
    getCrmObjectsWithFieldCounts(),
    getSharingRules(),
  ])

  const roles = rolesResult.success ? rolesResult.roles || [] : []
  const objects = objectsResult.data || []
  const sharingRules = rulesResult.data || []

  // Get all users for share targets
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name')

  // Count active rules
  const activeRules = sharingRules.filter(r => r.is_active).length

  // Count objects with private sharing model
  const privateObjects = objects.filter(
    o => o.sharing_model === 'private'
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
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Sharing Rules
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Control record-level access with sharing rules
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CRM Objects</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objects.length}</div>
              <p className="text-xs text-muted-foreground">
                Objects with sharing settings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Private Objects
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{privateObjects}</div>
              <p className="text-xs text-muted-foreground">
                Owner-only by default
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sharing Rules
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRules}</div>
              <p className="text-xs text-muted-foreground">
                Active sharing rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                Available for sharing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Record-Level Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Record-level sharing controls who can see and edit individual
              records. The sharing model hierarchy is:
            </CardDescription>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Private</strong>
                  <p className="text-xs opacity-80">
                    Only owner and granted users
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Public Read</strong>
                  <p className="text-xs opacity-80">
                    All can view, owner edits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <Share2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Public Read/Write</strong>
                  <p className="text-xs opacity-80">All can view and edit</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Full Access</strong>
                  <p className="text-xs opacity-80">All have full control</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sharing Rules Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Sharing</CardTitle>
            <CardDescription>
              Configure organization-wide defaults and create sharing rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SharingRulesManager
              objects={objects}
              roles={roles}
              users={users || []}
              initialRules={sharingRules}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
