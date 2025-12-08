import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRoles } from '@/app/actions/setup'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RolesTable, CreateRoleDialog } from '@/components/admin/setup'
import { Shield, ChevronLeft, Lock, Settings } from 'lucide-react'

export default async function RolesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const rolesResult = await getRoles()
  const roles = rolesResult.success ? rolesResult.roles || [] : []

  const systemRoles = roles.filter(r => r.is_system)
  const customRoles = roles.filter(r => !r.is_system)

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
                    Roles & Permissions
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {roles.length} role{roles.length !== 1 ? 's' : ''}{' '}
                    configured
                  </p>
                </div>
              </div>
            </div>
            <CreateRoleDialog />
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
                System Roles
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemRoles.length}</div>
              <p className="text-xs text-muted-foreground">
                Built-in roles (cannot be deleted)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custom Roles
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customRoles.length}</div>
              <p className="text-xs text-muted-foreground">
                User-defined roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                Available for assignment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-300">
              About Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Roles define what actions users can perform in the system. Each
              role has a set of permissions that control access to different
              features. System roles (admin, provider, viewer) cannot be deleted
              but their permissions can be modified. Custom roles can be created
              for specific needs.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Roles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RolesTable roles={roles} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
