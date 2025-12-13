import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shield } from 'lucide-react'
import { RoleCreationWizard } from './role-creation-wizard'

export default async function NewRolePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground">
            Create New Role
          </h1>
          <p className="text-sm text-muted-foreground">
            Define permissions for a new role
          </p>
        </div>
      </div>

      {/* Main Content */}
      <RoleCreationWizard />
    </div>
  )
}
