import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRoles } from '@/app/actions/setup'
import { getCrmObjectsWithFieldCounts } from '@/app/actions/field-security'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield,
  ChevronLeft,
  Lock,
  Database,
  Users,
  Eye,
  Edit3,
} from 'lucide-react'
import { FieldPermissionsSelector } from './field-permissions-selector'

export default async function FieldPermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const params = await searchParams
  const initialRoleId = params.role || ''
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch roles and objects in parallel
  const [rolesResult, objectsResult] = await Promise.all([
    getRoles(),
    getCrmObjectsWithFieldCounts(),
  ])

  const roles = rolesResult.success ? rolesResult.roles || [] : []
  const objects = objectsResult.data || []

  // Filter to non-system roles that can have field permissions
  const configurableRoles = roles.filter(
    r => !r.is_system || r.name !== 'admin'
  )

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
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Field-Level Security
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Control field visibility and editability by role
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
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CRM Objects</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objects.length}</div>
              <p className="text-xs text-muted-foreground">
                Objects with configurable fields
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Fields
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {objects.reduce((sum, obj) => sum + obj.fieldCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all CRM objects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Configurable Roles
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configurableRoles.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Roles with field permissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Field-Level Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Field-level security controls which fields users can see and edit
              based on their role. By default, all fields are visible and
              editable. Use this page to restrict access to sensitive fields
              like medical information, financial data, or personal details.
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Eye className="h-4 w-4" />
                <span>
                  <strong>Visible</strong> = Can see field in forms/views
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Edit3 className="h-4 w-4" />
                <span>
                  <strong>Editable</strong> = Can modify field value
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Permissions Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Field Permissions</CardTitle>
            <CardDescription>
              Select a role and object to configure field-level permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldPermissionsSelector
              roles={configurableRoles}
              objects={objects}
              initialRoleId={initialRoleId}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
