import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getUsers,
  getRoles,
  getInvitations,
  getUnlinkedTeamMembers,
} from '@/app/actions/setup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  InviteUserDialog,
  CreateUserDialog,
  UsersTable,
  InvitationsTable,
} from '@/components/admin/setup'
import { Users, UserPlus, ChevronLeft, Mail } from 'lucide-react'

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all data in parallel
  const [usersResult, rolesResult, invitationsResult, unlinkedResult] =
    await Promise.all([
      getUsers(),
      getRoles(),
      getInvitations(),
      getUnlinkedTeamMembers(),
    ])

  const users = usersResult.success ? usersResult.users || [] : []
  const roles = rolesResult.success ? rolesResult.roles || [] : []
  const invitations = invitationsResult.success
    ? invitationsResult.invitations || []
    : []
  const unlinkedTeamMembers = unlinkedResult.success
    ? unlinkedResult.teamMembers || []
    : []

  const activeUsers = users.filter(u => u.is_active !== false)
  const inactiveUsers = users.filter(u => u.is_active === false)

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
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Users
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {activeUsers.length} active user
                    {activeUsers.length !== 1 ? 's' : ''}
                    {inactiveUsers.length > 0 &&
                      `, ${inactiveUsers.length} inactive`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreateUserDialog
                roles={roles}
                unlinkedTeamMembers={unlinkedTeamMembers}
              />
              <InviteUserDialog
                roles={roles}
                unlinkedTeamMembers={unlinkedTeamMembers}
              />
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers.length} active, {inactiveUsers.length} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Invitations
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invitations.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting acceptance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unlinked Team Members
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unlinkedTeamMembers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Without user accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({invitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <UsersTable
                  users={users}
                  roles={roles}
                  currentUserId={user.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <InvitationsTable invitations={invitations} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
