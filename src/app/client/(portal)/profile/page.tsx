import { getClientSession } from '@/app/actions/client-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/client/profile-editor'

export default async function ClientProfilePage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  // Fetch full client details - use admin client to bypass RLS
  const supabase = createAdminClient()
  const { data: client } = await supabase
    .from('leads')
    .select('*')
    .eq('id', session.clientId)
    .single()

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600">
          Unable to load profile. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f5f0e8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileEditor client={client} />
      </div>
    </div>
  )
}
